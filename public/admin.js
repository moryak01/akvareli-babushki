/* =========================================================
   Акварели бабушки — админка заказов
   =========================================================
   1. Заполните два значения ниже из Supabase:
      Project Settings → API → Project URL и anon public key.
   2. anon key безопасен для браузера: доступ к заказам закрыт
      RLS-политиками и открывается только после входа.
   3. service_role key сюда НЕ вставлять.
   ========================================================= */

const SUPABASE_URL = "https://jbtkcgdpkkcvfeixmsvm.supabase.co/rest/v1/";      // например https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_er22aqWC0z4UpOD9RYkUGA_EVo-vo4_"; // eyJhbGciOi... (anon public)

const STATUS_LABELS = {
  new: "Новая",
  confirmed: "Подтверждена",
  paid: "Оплачена",
  shipped: "Отправлена",
  completed: "Завершена",
  cancelled: "Отменена"
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const el = {
  setup: $("#setup"),
  login: $("#login"),
  app: $("#app"),
  loginForm: $("#login-form"),
  loginError: $("#login-error"),
  loginSubmit: $("#login-submit"),
  userEmail: $("#user-email"),
  logout: $("#logout"),
  orders: $("#orders"),
  empty: $("#empty"),
  note: $("#list-note"),
  search: $("#search"),
  statusFilter: $("#status-filter"),
  refresh: $("#refresh"),
  export: $("#export"),
  toast: $("#toast")
};

let client = null;
let orders = [];
let loading = false;

/* ---------- Утилиты ---------- */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const priceFormat = new Intl.NumberFormat("ru-RU");

function formatPrice(value) {
  return `${priceFormat.format(Number(value) || 0)} ₽`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatNumber(value) {
  return String(value ?? "").padStart(4, "0");
}

function contactHref(contact) {
  const value = String(contact || "").trim();
  if (!value) return null;
  if (/^@[A-Za-z0-9_]{3,}$/.test(value)) return `https://t.me/${value.slice(1)}`;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length >= 10) return `tel:${digits}`;
  return null;
}

let toastTimer = null;

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2800);
}

function showView(name) {
  ["setup", "login", "app"].forEach((key) => {
    el[key].hidden = key !== name;
  });
}

/* ---------- Вход ---------- */

async function handleLogin(event) {
  event.preventDefault();
  el.loginError.hidden = true;
  el.loginSubmit.disabled = true;
  el.loginSubmit.textContent = "Проверяем…";

  const email = el.loginForm.elements.email.value.trim();
  const password = el.loginForm.elements.password.value;

  const { error } = await client.auth.signInWithPassword({ email, password });

  el.loginSubmit.disabled = false;
  el.loginSubmit.textContent = "Войти";

  if (error) {
    el.loginError.hidden = false;
    el.loginError.textContent =
      error.message === "Invalid login credentials"
        ? "Неверный e-mail или пароль."
        : "Не удалось войти: " + error.message;
    return;
  }

  el.loginForm.reset();
}

async function logout() {
  await client.auth.signOut();
  orders = [];
  el.orders.innerHTML = "";
  showView("login");
}

/* ---------- Загрузка ---------- */

async function loadOrders() {
  if (loading) return;
  loading = true;
  el.refresh.disabled = true;
  el.note.hidden = false;
  el.note.textContent = "Загружаем заказы…";

  const { data, error } = await client
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  loading = false;
  el.refresh.disabled = false;

  if (error) {
    orders = [];
    el.note.hidden = true;
    render();
    toast("Ошибка загрузки: " + error.message);
    if (/jwt|session|token/i.test(error.message)) logout();
    return;
  }

  orders = data || [];
  el.note.hidden = true;
  render();
}

/* ---------- Отрисовка ---------- */

function matches(order) {
  const query = el.search.value.trim().toLowerCase();
  const status = el.statusFilter.value;

  if (status && order.status !== status) return false;
  if (!query) return true;

  const haystack = [
    formatNumber(order.order_number),
    order.artwork_title,
    order.customer_name,
    order.contact,
    order.comment,
    order.admin_note
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function renderStats() {
  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    active: orders.filter((o) => ["confirmed", "paid", "shipped"].includes(o.status)).length,
    done: orders.filter((o) => o.status === "completed").length
  };

  $$("[data-count]").forEach((node) => {
    node.textContent = counts[node.dataset.count] ?? 0;
  });
}

function orderTemplate(order) {
  const status = STATUS_LABELS[order.status] ? order.status : "new";
  const href = contactHref(order.contact);
  const contact = href
    ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(order.contact)}</a>`
    : esc(order.contact);

  const options = Object.entries(STATUS_LABELS)
    .map(
      ([value, label]) =>
        `<option value="${value}"${value === status ? " selected" : ""}>${label}</option>`
    )
    .join("");

  return `
    <article class="order-row" data-id="${esc(order.id)}">
      <div class="order-row__head">
        <p class="order-row__num">№${formatNumber(order.order_number)}</p>
        <p class="order-row__date">${esc(formatDate(order.created_at))}</p>
        <span class="badge badge--${esc(status)}">${esc(STATUS_LABELS[status])}</span>
      </div>

      <div class="order-row__main">
        <div>
          <p class="order-row__label">Картина</p>
          <p class="order-row__value">«${esc(order.artwork_title)}» · ${esc(formatPrice(order.price))}</p>
        </div>
        <div>
          <p class="order-row__label">Покупатель</p>
          <p class="order-row__value">${esc(order.customer_name)}<br>${contact}</p>
        </div>
        <div>
          <p class="order-row__label">Комментарий</p>
          <p class="order-row__value order-row__comment">${esc(order.comment) || "—"}</p>
        </div>
      </div>

      <div class="order-row__controls">
        <label class="field">
          <span>Статус</span>
          <select data-status>${options}</select>
        </label>
        <button class="order-row__toggle" type="button" data-note-toggle>
          ${order.admin_note ? "Заметка •" : "Добавить заметку"}
        </button>
      </div>

      <div class="order-row__note" data-note-box hidden>
        <label class="field">
          <span>Внутренняя заметка</span>
          <textarea data-note rows="3" placeholder="Оплата, трек-номер, договорённости">${esc(order.admin_note)}</textarea>
        </label>
        <button class="btn btn--dark" type="button" data-note-save>Сохранить заметку</button>
      </div>
    </article>`;
}

function render() {
  renderStats();

  const visible = orders.filter(matches);
  el.orders.innerHTML = visible.map(orderTemplate).join("");
  el.empty.hidden = visible.length > 0;
  el.empty.textContent = orders.length
    ? "По этому фильтру заказов нет."
    : "Заказов пока нет. Отправьте тестовую заявку с сайта.";
}

/* ---------- Изменения ---------- */

async function updateOrder(id, patch, successMessage) {
  const { error } = await client.from("orders").update(patch).eq("id", id);

  if (error) {
    toast("Не сохранилось: " + error.message);
    return false;
  }

  const order = orders.find((item) => item.id === id);
  if (order) Object.assign(order, patch);

  render();
  if (successMessage) toast(successMessage);
  return true;
}

function handleOrdersClick(event) {
  const row = event.target.closest(".order-row");
  if (!row) return;
  const id = row.dataset.id;

  const toggle = event.target.closest("[data-note-toggle]");
  if (toggle) {
    const box = $("[data-note-box]", row);
    box.hidden = !box.hidden;
    if (!box.hidden) $("[data-note]", row).focus();
    return;
  }

  const save = event.target.closest("[data-note-save]");
  if (save) {
    const note = $("[data-note]", row).value.trim();
    save.disabled = true;
    updateOrder(id, { admin_note: note || null }, "Заметка сохранена").finally(() => {
      save.disabled = false;
    });
  }
}

function handleOrdersChange(event) {
  const select = event.target.closest("[data-status]");
  if (!select) return;

  const row = event.target.closest(".order-row");
  const id = row.dataset.id;
  const status = select.value;

  select.disabled = true;
  updateOrder(id, { status }, "Статус: " + STATUS_LABELS[status]).finally(() => {
    select.disabled = false;
  });
}

/* ---------- CSV ---------- */

function exportCsv() {
  const visible = orders.filter(matches);
  if (!visible.length) {
    toast("Нечего экспортировать");
    return;
  }

  const header = [
    "Номер",
    "Дата",
    "Картина",
    "Цена",
    "Имя",
    "Контакт",
    "Комментарий",
    "Статус",
    "Заметка"
  ];

  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = visible.map((order) =>
    [
      formatNumber(order.order_number),
      formatDate(order.created_at),
      order.artwork_title,
      order.price,
      order.customer_name,
      order.contact,
      order.comment || "",
      STATUS_LABELS[order.status] || order.status,
      order.admin_note || ""
    ]
      .map(escapeCell)
      .join(";")
  );

  const csv = "\uFEFF" + [header.map(escapeCell).join(";"), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("CSV скачан");
}

/* ---------- Старт ---------- */

async function showApp(session) {
  el.userEmail.textContent = session.user?.email || "";
  showView("app");
  await loadOrders();
}

async function init() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    showView("setup");
    return;
  }

  client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  el.loginForm.addEventListener("submit", handleLogin);
  el.logout.addEventListener("click", logout);
  el.refresh.addEventListener("click", loadOrders);
  el.export.addEventListener("click", exportCsv);
  el.orders.addEventListener("click", handleOrdersClick);
  el.orders.addEventListener("change", handleOrdersChange);
  el.search.addEventListener("input", render);
  el.statusFilter.addEventListener("change", render);

  const {
    data: { session }
  } = await client.auth.getSession();

  if (session) {
    await showApp(session);
  } else {
    showView("login");
  }

  client.auth.onAuthStateChange((event, nextSession) => {
    if (event === "SIGNED_OUT") showView("login");
    if (event === "SIGNED_IN" && nextSession && el.app.hidden) showApp(nextSession);
  });
}

init();
