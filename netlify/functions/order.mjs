/* =========================================================
   Приём заявки: POST /api/order
   Netlify Function (Node 20, ESM).

   Переменные окружения (Netlify → Site settings → Environment variables):
     SUPABASE_DB_URL
     SUPABASE_SERVICE_ROLE_KEY
     TELEGRAM_BOT_TOKEN
     TELEGRAM_CHAT_ID
   Никогда не кладите эти значения в client-side JS.
   ========================================================= */

// Серверный каталог. Цены и названия берутся только отсюда,
// чтобы нельзя было прислать поддельную цену.
// Держать в синхроне с ARTWORKS в script.js.
const CATALOG = {
  1: { title: "Три яблока", price: 1000 },
  2: { title: "Рябина", price: 1100 },
  3: { title: "Белая сова", price: 1200 },
  4: { title: "Дерево у моря", price: 1100 },
  5: { title: "Осенняя набережная", price: 1200 },
  6: { title: "Вишни", price: 1000 },
  7: { title: "Яблоневый цвет", price: 1100 }
};

const LIMITS = {
  name: 100,
  contact: 200,
  comment: 1000
};

// Простой лимит в памяти процесса. На serverless это защита от
// случайных повторов и простых ботов, а не полноценный firewall.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();

  for (const [key, entry] of hits) {
    if (now - entry.start > WINDOW_MS) hits.delete(key);
  }

  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function clean(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultiline(value, max) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveOrder(row) {
  const url = (process.env.SUPABASE_DB_URL || "").replace(/\/rest\/v1\/?$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify(row)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  return data[0];
}

async function notifyTelegram(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines = [
    `Новый заказ №${String(order.order_number).padStart(4, "0")}`,
    `«${order.artwork_title}» — ${order.price} ₽`,
    `Имя: ${order.customer_name}`,
    `Контакт: ${order.contact}`
  ];
  if (order.comment) lines.push(`Комментарий: ${order.comment}`);
  lines.push("", "Открыть админку: /admin.html");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${text.slice(0, 300)}`);
  }
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { Allow: "POST, OPTIONS" }, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  const ip =
    event.headers["x-nf-client-connection-ip"] ||
    (event.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    "unknown";

  if (rateLimited(ip)) {
    return json(429, {
      ok: false,
      error: "Слишком много заявок подряд. Попробуйте через 10 минут или напишите в Telegram."
    });
  }

  const body = parseBody(event);
  if (body === null) {
    return json(400, { ok: false, error: "Некорректный запрос." });
  }

  // Honeypot: заполненное скрытое поле — почти наверняка бот.
  // Отвечаем как будто всё хорошо, чтобы не подсказывать.
  if (clean(body.website, 200)) {
    return json(200, { ok: true, orderNumber: null });
  }

  const artworkId = Number(body.artworkId);
  const art = CATALOG[artworkId];
  if (!art) {
    return json(400, { ok: false, error: "Выберите картину из списка." });
  }

  const name = clean(body.name, LIMITS.name);
  const contact = clean(body.contact, LIMITS.contact);
  const comment = cleanMultiline(body.comment, LIMITS.comment);

  if (name.length < 2) {
    return json(400, { ok: false, error: "Укажите имя." });
  }
  if (contact.length < 2) {
    return json(400, { ok: false, error: "Укажите телефон, e-mail или Telegram." });
  }
  if (body.consent !== true) {
    return json(400, { ok: false, error: "Нужно согласие на обработку данных." });
  }

  if (!process.env.SUPABASE_DB_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("order: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
    return json(500, { ok: false, error: "Приём заявок временно недоступен." });
  }

  let order;
  try {
    order = await saveOrder({
      artwork_id: artworkId,
      artwork_title: art.title,
      price: art.price,
      customer_name: name,
      contact,
      comment: comment || null,
      status: "new",
      consent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return json(502, { ok: false, error: "Не удалось сохранить заявку. Напишите в Telegram." });
  }

  try {
    await notifyTelegram(order);
  } catch (error) {
    // Заявка уже сохранена — уведомление не должно её отменять.
    console.error(error);
  }

  return json(200, {
    ok: true,
    orderId: order.id,
    orderNumber: String(order.order_number).padStart(4, "0")
  });
}
