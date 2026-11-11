/* =========================================================
   Акварели бабушки — настройки сайта
   Контакты и работы редактируются здесь.
   ========================================================= */

// TODO: при необходимости добавьте whatsapp и email и верните кнопки в index.html.
const CONTACTS = {
  telegram: "https://t.me/alexgg101"
};

// Адрес серверной функции приёма заявок (Netlify Function).
// При открытии сайта как файла или без Netlify форма перейдёт
// в резервный режим: текст заявки + Telegram.
const ORDER_API = "/api/order";

const ARTWORKS = [
  {
    id: 1,
    title: "Три яблока",
    technique: "Акварель, бумага",
    size: "A4",
    dimensions: "21 × 29,7 см",
    price: 1000,
    image: "assets/images/full/painting1.jpg",
    preview: "assets/images/preview/painting1.jpg",
    width: 590,
    height: 820,
    previewWidth: 590,
    fullWidth: 1295,
    alt: "Акварель «Три яблока»: розово-красные яблоки на ветке с зелёными листьями",
    desc: "Три яблока с ветки — спелые, с восковым блеском и тёплым румянцем. Работа о простом осеннем изобилии."
  },
  {
    id: 2,
    title: "Рябина",
    technique: "Акварель, бумага",
    size: "A4",
    dimensions: "21 × 29,7 см",
    price: 1100,
    image: "assets/images/full/painting2.jpg",
    preview: "assets/images/preview/painting2.jpg",
    width: 590,
    height: 820,
    previewWidth: 590,
    fullWidth: 1295,
    alt: "Акварель «Рябина»: гроздь красных ягод и осенние листья на тёмно-зелёном фоне",
    desc: "Гроздь рябины на фоне осенней листвы: плотные красные ягоды и листья, тронутые желтизной."
  },
  {
    id: 3,
    title: "Белая сова",
    technique: "Акварель, бумага",
    size: "A4",
    dimensions: "21 × 29,7 см",
    price: 1200,
    image: "assets/images/full/painting3.jpg",
    preview: "assets/images/preview/painting3.jpg",
    width: 590,
    height: 820,
    previewWidth: 590,
    fullWidth: 1295,
    alt: "Акварель «Белая сова»: сова с распахнутыми крыльями на фоне ночного города, луны и молний",
    desc: "Белая сова на фоне ночного неба и старинного города. Почти сказочный сюжет — с луной, молнией и маленьким оберегом в лапах."
  },
  {
    id: 4,
    title: "Дерево у моря",
    technique: "Акварель, бумага",
    size: "A4",
    dimensions: "21 × 29,7 см",
    price: 1100,
    image: "assets/images/full/painting4.jpg",
    preview: "assets/images/preview/painting4.jpg",
    width: 590,
    height: 820,
    previewWidth: 590,
    fullWidth: 1295,
    alt: "Акварель «Дерево у моря»: раскидистое дерево на каменистом берегу, волны и песчаный пляж",
    desc: "Дерево, выросшее на камнях у самой воды. Ветер, брызги и тёплый песок — всё, что нужно для летнего дня."
  },
  {
    id: 5,
    title: "Осенняя набережная",
    technique: "Акварель, бумага",
    size: "A4",
    dimensions: "29,7 × 21 см",
    price: 1200,
    image: "assets/images/full/painting5.jpg",
    preview: "assets/images/preview/painting5.jpg",
    width: 820,
    height: 590,
    previewWidth: 820,
    fullWidth: 1800,
    alt: "Акварель «Осенняя набережная»: церковь с зелёной крышей, рыжие деревья, мост и канал",
    desc: "Осенний город у канала: рыжая листва, зелёные крыши и вода, отражающая небо."
  },
  {
    id: 6,
    title: "Вишни",
    technique: "Акварель, бумага",
    size: "A4",
    dimensions: "21 × 29,7 см",
    price: 1000,
    image: "assets/images/full/painting6.jpg",
    preview: "assets/images/preview/painting6.jpg",
    width: 590,
    height: 820,
    previewWidth: 590,
    fullWidth: 1295,
    alt: "Акварель «Вишни»: три тёмно-красные вишни с бликами на белом блюде",
    desc: "Три вишни на белом блюде — тёмно-красные, с бликами и сочной мякотью."
  },
  {
    id: 7,
    title: "Яблоневый цвет",
    technique: "Акварель, бумага",
    size: "A4",
    dimensions: "21 × 29,7 см",
    price: 1100,
    image: "assets/images/full/painting7.jpg",
    preview: "assets/images/preview/painting7.jpg",
    width: 590,
    height: 820,
    previewWidth: 590,
    fullWidth: 1295,
    alt: "Акварель «Яблоневый цвет»: ветка яблони с розовыми цветами, бутонами и зелёными листьями",
    desc: "Ветка яблони в цвету: розовые лепестки, бутоны и светлое весеннее небо."
  }
];

/* =========================================================
   Дальше — логика сайта. Обычно редактировать не нужно.
   ========================================================= */

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const priceFormat = new Intl.NumberFormat("ru-RU");
const formatPrice = (value) => `${priceFormat.format(value)} ₽`;
const pad = (value) => String(value).padStart(2, "0");

/* ---------- Контакты ---------- */

function contactHref(key) {
  if (key === "email" && CONTACTS.email) return `mailto:${CONTACTS.email}`;
  if (key === "whatsapp" && CONTACTS.whatsapp) return `https://wa.me/${CONTACTS.whatsapp.replace(/\D/g, "")}`;
  return CONTACTS.telegram;
}

function applyContacts() {
  $$("[data-contact]").forEach((link) => {
    const key = link.dataset.contact;
    link.href = contactHref(key);
  });
}

/* ---------- Галерея ---------- */

function renderWorks() {
  const grid = $("#works-grid");
  if (!grid) return;

  grid.innerHTML = ARTWORKS.map(
    (art, index) => `
      <article class="card" data-id="${art.id}">
        <div class="card__media">
          <img src="${art.preview}"
               srcset="${art.preview} ${art.previewWidth}w, ${art.image} ${art.fullWidth}w"
               sizes="(max-width: 600px) 92vw, (max-width: 1080px) 45vw, 30vw"
               width="${art.width}" height="${art.height}"
               alt="${art.alt}" loading="lazy" decoding="async">
          <button class="card__open" type="button" data-artwork-open="${index}" aria-label="Открыть работу «${art.title}»"></button>
        </div>
        <div class="card__row">
          <h3 class="card__title">«${art.title}»</h3>
          <p class="card__price">${formatPrice(art.price)}</p>
        </div>
        <div class="card__row card__row--meta">
          <p class="card__meta">${art.technique} · ${art.size}</p>
          <button class="card__buy" type="button" data-buy="${art.id}">Купить</button>
        </div>
      </article>`
  ).join("") + `
      <aside class="grid-note">
        <div class="grid-note__top">
          <p class="eyebrow">О серии</p>
          <span class="grid-note__count">${pad(ARTWORKS.length)}</span>
        </div>
        <div class="grid-note__body">
          <p class="grid-note__title">Каждая работа<br>существует<br>в одном экземпляре</p>
          <p class="grid-note__text">Ручная работа, акварель на плотной бумаге. Помогу выбрать оформление и рассчитать доставку.</p>
          <a class="link-arrow" href="#contacts">Задать вопрос <span aria-hidden="true">→</span></a>
        </div>
      </aside>`;
}

/* ---------- Просмотр работы ---------- */

const artworkDialog = $("#artwork-dialog");
const artworkImage = $("#artwork-image");
const artworkCounter = $("#artwork-counter");
const artworkTitle = $("#artwork-title");
const artworkDesc = $("#artwork-desc");
const artworkTechnique = $("#artwork-technique");
const artworkSize = $("#artwork-size");
const artworkPrice = $("#artwork-price");
const artworkBuy = $("#artwork-buy");

let currentIndex = 0;
let lastTrigger = null;

function updateArtwork(index) {
  const art = ARTWORKS[index];
  if (!art) return;

  currentIndex = index;
  artworkImage.src = art.image;
  artworkImage.alt = art.alt;
  artworkCounter.textContent = `${pad(index + 1)} / ${pad(ARTWORKS.length)}`;
  artworkTitle.textContent = `«${art.title}»`;
  artworkDesc.textContent = art.desc;
  artworkTechnique.textContent = art.technique;
  artworkSize.textContent = `${art.size} · ${art.dimensions}`;
  artworkPrice.textContent = formatPrice(art.price);
  artworkBuy.dataset.id = art.id;

  preloadNeighbours(index);
}

function preloadNeighbours(index) {
  [index - 1, index + 1].forEach((i) => {
    const art = ARTWORKS[(i + ARTWORKS.length) % ARTWORKS.length];
    const img = new Image();
    img.src = art.image;
  });
}

function openArtwork(index, trigger) {
  lastTrigger = trigger || null;
  updateArtwork(index);
  if (!artworkDialog.open) artworkDialog.showModal();
}

function stepArtwork(direction) {
  const next = (currentIndex + direction + ARTWORKS.length) % ARTWORKS.length;
  updateArtwork(next);
}

/* ---------- Заявка ---------- */

const orderDialog = $("#order-dialog");
const orderForm = $("#order-form");
const orderSelect = $("#order-artwork");
const orderPreview = $("#order-preview");
const orderSubmit = $("#order-submit");
const orderResultTitle = $("#order-result-title");
const orderResultLead = $("#order-result-lead");
const orderResultNote = $("#order-result-note");
const orderNumber = $("#order-number");
const stepOne = $('[data-step="1"]', orderDialog);
const stepTwo = $('[data-step="2"]', orderDialog);

let orderText = "";

function fillOrderSelect() {
  orderSelect.innerHTML = '<option value="" disabled selected>Выберите картину</option>' + ARTWORKS.map(
    (art) => `<option value="${art.id}">«${art.title}» — ${formatPrice(art.price)}</option>`
  ).join("");
}

function openOrder(artworkId) {
  if (artworkDialog.open) artworkDialog.close();

  if (artworkId) orderSelect.value = String(artworkId);
  else orderSelect.value = "";
  stepOne.hidden = false;
  stepTwo.hidden = true;
  orderDialog.scrollTop = 0;

  if (!orderDialog.open) orderDialog.showModal();
  orderDialog.scrollTop = 0;
}

function buildOrderMessage() {
  const art = ARTWORKS.find((item) => String(item.id) === orderSelect.value) || ARTWORKS[0];
  const name = orderForm.elements.name.value.trim();
  const contact = orderForm.elements.contact.value.trim();
  const comment = orderForm.elements.comment.value.trim();

  const lines = [
    "Здравствуйте! Хочу приобрести картину:",
    "",
    `Картина: «${art.title}»`,
    `Размер: ${art.size} (${art.dimensions})`,
    `Цена: ${formatPrice(art.price)}`,
    `Имя: ${name}`,
    `Контакт: ${contact}`
  ];

  if (comment) lines.push(`Комментарий: ${comment}`);
  lines.push("", "Отправлено с сайта «Акварели бабушки».");

  orderText = lines.join("\n");
}

function setOrderChannels() {
  const tg = $("#order-telegram");
  tg.href = CONTACTS.telegram;
}

async function requestOrder(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(ORDER_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.ok) return { ok: true, data };

    return { ok: false, error: data && data.error ? data.error : "" };
  } catch (error) {
    // Нет сети, сайт открыт как файл или API недоступен.
    return { ok: false, error: "" };
  } finally {
    clearTimeout(timer);
  }
}

function showOrderSuccess(result) {
  orderResultTitle.textContent = "Заявка принята";
  orderResultLead.textContent =
    "Спасибо! Я получил заявку и отвечу по указанному контакту в течение дня.";

  if (result.orderNumber) {
    orderNumber.hidden = false;
    orderNumber.textContent = `Заявка №${result.orderNumber}`;
  } else {
    orderNumber.hidden = true;
  }

  orderResultNote.textContent =
    "Хотите что-то уточнить — напишите в Telegram. Текст заявки сохранён ниже.";
}

function showOrderFallback(error) {
  orderResultTitle.textContent = "Заявка готова";
  orderResultLead.textContent = error
    ? `Не удалось отправить заявку автоматически: ${error} Текст скопирован — вставьте его в чат Telegram и отправьте.`
    : "Сайт не смог отправить заявку автоматически. Текст уже скопирован — вставьте его в чат Telegram и отправьте.";
  orderNumber.hidden = true;
  orderResultNote.textContent = "Если текст не скопировался, нажмите «Скопировать текст».";
  copyText(orderText);
}

/* ---------- Копирование / уведомления ---------- */

let toastTimer = null;

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  showToast("Текст скопирован");
}

/* ---------- События ---------- */

function bindEvents() {
  const grid = $("#works-grid");

  grid.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-artwork-open]");
    if (openButton) {
      openArtwork(Number(openButton.dataset.artworkOpen), openButton);
      return;
    }

    const buyButton = event.target.closest("[data-buy]");
    if (buyButton) {
      openOrder(Number(buyButton.dataset.buy));
    }
  });

  $$("[data-artwork-close]").forEach((button) => {
    button.addEventListener("click", () => artworkDialog.close());
  });

  $$("[data-artwork-prev]").forEach((button) => {
    button.addEventListener("click", () => stepArtwork(-1));
  });

  $$("[data-artwork-next]").forEach((button) => {
    button.addEventListener("click", () => stepArtwork(1));
  });

  artworkDialog.addEventListener("click", (event) => {
    if (event.target === artworkDialog) artworkDialog.close();
  });

  artworkDialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepArtwork(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepArtwork(1);
    }
  });

  artworkDialog.addEventListener("close", () => {
    if (lastTrigger) lastTrigger.focus();
    lastTrigger = null;
  });

  artworkBuy.addEventListener("click", () => {
    openOrder(Number(artworkBuy.dataset.id));
  });

  $$("[data-order-open]").forEach((button) => {
    button.addEventListener("click", () => openOrder());
  });

  $$("[data-order-close]").forEach((button) => {
    button.addEventListener("click", () => orderDialog.close());
  });

  orderDialog.addEventListener("click", (event) => {
    if (event.target === orderDialog) orderDialog.close();
  });

  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!orderForm.checkValidity()) {
      orderForm.reportValidity();
      return;
    }

    const art = ARTWORKS.find((item) => String(item.id) === orderSelect.value);
    if (!art) {
      orderSelect.focus();
      return;
    }

    buildOrderMessage();
    setOrderChannels();
    orderPreview.textContent = orderText;

    orderSubmit.disabled = true;
    orderSubmit.textContent = "Отправляем…";

    const result = await requestOrder({
      artworkId: Number(art.id),
      name: orderForm.elements.name.value.trim(),
      contact: orderForm.elements.contact.value.trim(),
      comment: orderForm.elements.comment.value.trim(),
      consent: orderForm.elements.consent.checked,
      website: orderForm.elements.website.value
    });

    orderSubmit.disabled = false;
    orderSubmit.textContent = "Отправить заявку";

    if (result.ok) showOrderSuccess(result.data);
    else showOrderFallback(result.error);

    stepOne.hidden = true;
    stepTwo.hidden = false;
    orderDialog.scrollTop = 0;
  });

  $("#order-copy").addEventListener("click", () => copyText(orderText));

  $("#order-telegram").addEventListener("click", () => {
    if (orderText) copyText(orderText);
  });

  /* Мобильное меню */
  const burger = $(".burger");
  const mobileMenu = $("#mobile-menu");

  const closeMenu = () => {
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    mobileMenu.hidden = true;
    document.body.classList.remove("menu-open");
  };

  burger.addEventListener("click", () => {
    const isOpen = burger.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
      return;
    }

    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Закрыть меню");
    mobileMenu.hidden = false;
    document.body.classList.add("menu-open");
  });

  $$("a", mobileMenu).forEach((link) => link.addEventListener("click", closeMenu));

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });

  /* Появление секций */
  const revealTargets = $$(
    ".hero .eyebrow, .hero__title, .hero__bottom, .feature, .section-head, .card, .grid-note, .about__grid > *, .step, .buy__foot, .contacts h2, .contacts__links, .contacts__note"
  );

  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach((target, index) => {
      target.classList.add("reveal");
      target.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
      observer.observe(target);
    });
  }
}

/* ---------- Старт ---------- */

renderWorks();
fillOrderSelect();
applyContacts();
bindEvents();

const year = $("#year");
if (year) year.textContent = new Date().getFullYear();
