# HANDOFF — «Акварели бабушки»

**Дата:** 12.11.2026
**Корень проекта:** `C:\Users\pinea\Desktop\folder1`
**Статус:** сайт, приём заявок и админка готовы в коде. Осталось подключить аккаунты GitHub, Netlify, Supabase и бота, затем проверить сквозной сценарий на публичной ссылке.
**Git:** локальный репозиторий создан, коммиты есть; удалённого репозитория пока нет.

---

## 1. Главная цель

Продавать 7 оригинальных акварелей, написанных бабушкой владельца:

- формат A4, ручная работа пожилого художника;
- цены 1000–1200 ₽;
- связь и заявки через Telegram **@alexgg101**;
- публичная HTTPS-ссылка;
- учёт заказов: база, уведомления в Telegram, админка со статусами.

Согласованные решения владельца:

- хостинг: **GitHub + Netlify**;
- учёт заказов: **Supabase + админка**;
- домен: остаёмся на `*.netlify.app`, свой не покупаем.

---

## 2. Что уже сделано

### 2.1. Структура проекта

```
public/                         — только эта папка публикуется на хостинге
  index.html                    — главная: hero, галерея, «О работах», покупка, контакты
  privacy.html                  — политика конфиденциальности
  styles.css                    — оформление главной и диалогов
  script.js                     — ARTWORKS, CONTACTS, галерея, лайтбокс, заявка
  admin.html / admin.css / admin.js — админка заказов
  robots.txt                    — Disallow /admin.html
  assets/favicon.svg            — иконка
  assets/images/full/painting1–7.jpg     — полноразмерные изображения
  assets/images/preview/painting1–7.jpg  — превью для галереи
netlify.toml                    — publish=public, functions, redirect /api/order
netlify/functions/order.mjs     — серверная функция приёма заявки
supabase/schema.sql             — таблица orders, индексы, триггер, RLS
README.md                       — инструкция по правкам и публикации
HANDOFF.md                      — этот файл
.gitignore                      — исключает photo1–7.jpg, .env, node_modules
photo1–7.jpg                    — исходники, в git не попадают
```

Сборки и зависимостей нет. `package.json` не нужен: Netlify Function написана как ESM `.mjs` и использует встроенный `fetch` Node 20.

### 2.2. Контент

Название: **«Акварели бабушки»**, подзаголовок «живопись ручной работы». Контакт только Telegram `https://t.me/alexgg101`.

| id | Название | Цена | Формат |
|---|---|---|---|
| 1 | «Три яблока» | 1 000 ₽ | A4, 21 × 29,7 см |
| 2 | «Рябина» | 1 100 ₽ | A4, 21 × 29,7 см |
| 3 | «Белая сова» | 1 200 ₽ | A4, 21 × 29,7 см |
| 4 | «Дерево у моря» | 1 100 ₽ | A4, 21 × 29,7 см |
| 5 | «Осенняя набережная» | 1 200 ₽ | A4, 29,7 × 21 см |
| 6 | «Вишни» | 1 000 ₽ | A4, 21 × 29,7 см |
| 7 | «Яблоневый цвет» | 1 100 ₽ | A4, 21 × 29,7 см |

Цены продублированы в двух местах:

- `public/script.js` → `ARTWORKS` (что видит покупатель);
- `netlify/functions/order.mjs` → `CATALOG` (что записывается в базу).

**При изменении цены править оба файла.** Сервер намеренно игнорирует цену из запроса.

### 2.3. Главная страница

- Строгий минимализм: белый фон, тонкие линии, Cormorant Garamond + Inter.
- Hero и полноширинная «Осенняя набережная».
- Галерея 3 колонки → 2 → 1, восьмая плитка «О серии» на 2 колонки.
- Лайтбокс с описанием, характеристиками, ценой, стрелками, ←/→ и Esc.
- Мобильное меню, плавные появления, `prefers-reduced-motion`, alt-тексты.
- «О работах»: прямо сказано, что это картины бабушки, ручная работа пожилого художника, акварель A4, не репродукции.
- В футере ссылка на политику конфиденциальности.

### 2.4. Заявка

Два шага в `<dialog>`:

1. Картина (обязательный select), имя, контакт, комментарий, обязательное согласие на обработку данных, honeypot.
2. Результат: номер заявки либо резервный режим с текстом для Telegram.

Логика `public/script.js`:

1. `POST /api/order` с `artworkId`, `name`, `contact`, `comment`, `consent`, `website`.
2. Успех → «Заявка принята», номер вида `№0042`, кнопки Telegram и «Скопировать текст».
3. Ошибка/нет API → «Заявка готова», текст автоматически копируется, показывается Telegram. Заявка не теряется.
4. Таймаут запроса — 12 секунд.

### 2.5. Серверная функция `netlify/functions/order.mjs`

- Только `POST`; `OPTIONS` → 204, остальное → 405.
- Honeypot `website`: если заполнен — ответ `ok`, запись не создаётся.
- Валидация: `artworkId` из каталога, имя 2–100, контакт 2–200, комментарий ≤1000, `consent === true`.
- Цена и название берутся из серверного `CATALOG`.
- Лимит: 5 запросов с одного IP за 10 минут (in-memory, на инстанс).
- INSERT в Supabase REST через `service_role` + `Prefer: return=representation`.
- Telegram `sendMessage`; ошибка Telegram не отменяет уже сохранённую заявку.
- Ответ: `{ ok: true, orderId, orderNumber }`, номер дополняется нулями до 4 знаков.

### 2.6. База `supabase/schema.sql`

Таблица `public.orders`:

```sql
id uuid primary key default gen_random_uuid()
order_number bigint generated always as identity unique
created_at timestamptz not null default now()
artwork_id int not null
artwork_title text not null
price int not null check (price >= 0)
customer_name text not null
contact text not null
comment text
status text not null default 'new'
  check (status in ('new','confirmed','paid','shipped','completed','cancelled'))
admin_note text
consent_at timestamptz
updated_at timestamptz not null default now()
```

Плюс индексы по `created_at` и `status`, триггер `touch_updated_at`, RLS:

- `select` и `update` — только роли `authenticated`;
- политики `insert` нет: вставка идёт только через `service_role`, который обходит RLS.

### 2.7. Админка `public/admin.html`

- Вход по e-mail/паролю Supabase Auth, выход.
- Если `SUPABASE_URL`/`SUPABASE_ANON_KEY` в `public/admin.js` пустые — экран «Админка ещё не подключена», а не белый экран.
- Статистика: всего / новые / в работе / завершены.
- Поиск по номеру, картине, имени, контакту, комментарию и заметке; фильтр по статусу.
- Смена статуса сразу сохраняется в Supabase; есть toast.
- Внутренняя заметка на заказ (трек-номер, договорённости).
- Экспорт CSV (BOM + `;` — открывается в Excel).
- Контакты превращаются в ссылки: `@username` → Telegram, e-mail → mailto, телефон → tel.
- Все данные экранируются (`esc`), HTML из заявки не исполняется.
- На ширине ≤760 px — карточки, без горизонтального скролла.
- `noindex, nofollow`, `X-Robots-Tag`, `robots.txt`.

### 2.8. Политика конфиденциальности

`public/privacy.html`: какие данные собираются, зачем, где хранятся (Supabase + Telegram), срок хранения, права, отсутствие cookies и аналитики, контакт для удаления данных. Согласие в форме обязательно.

---

## 3. Архитектура

```
Браузер
  │ POST /api/order
  ▼
Netlify Function (Node 20, order.mjs)
  ├── валидация + honeypot + лимит
  ├── INSERT → Supabase Postgres (orders)
  └── sendMessage → Telegram-бот
  ▼
Supabase
  ▲
  │ anon key + Supabase Auth (RLS: только authenticated)
/admin.html — вход, список, статусы, заметки, CSV
```

Почему так:

- сайт остаётся статическим, дешёвым и быстрым;
- цена и название проверяются на сервере;
- персональные данные не доступны по публичному ключу;
- владелец получает мгновенное уведомление и удобный список;
- нет своего сервера и ежемесячных платежей на старте.

Ограничения:

- нет онлайн-оплаты, корзины и аккаунтов покупателей;
- нет английской версии;
- лимит запросов живёт в памяти инстанса — это защита от случайных повторов, не полноценный WAF;
- функции и админка требуют интернета; офлайн работает только резервный сценарий с Telegram;
- при удалении заказа из базы номер `order_number` не переиспользуется (identity);
- Supabase Auth должен иметь отключённую публичную регистрацию.

---

## 4. Что проверено

### 4.1. Синтаксис

```powershell
node --check public/script.js
node --check public/admin.js
node --check netlify/functions/order.mjs
```

Все три — без ошибок.

### 4.2. Главная страница (Chrome DevTools Protocol)

Проверено на 1440×1000, 390×844, 320×700:

- название, цены 1000–1200 ₽, A4, Telegram @alexgg101;
- горизонтального скролла нет (`scrollWidth` = ширине экрана);
- форма: без согласия не отправляется, фокус уходит на checkbox;
- резервный режим: заголовок «Заявка готова», текст скопирован, toast, пустой номер не показывается;
- успешный ответ API (замокан): «Заявка принята», `Заявка №0042`;
- `public/privacy.html` открывается, вёрстка не ломается.

### 4.3. Админка (мок Supabase)

- вход: неверный пароль → «Неверный e-mail или пароль», верный → список;
- 3 тестовых заказа, статистика 3 / 1 / 1 / 1;
- поиск «Иван» → 1 заказ; фильтр «Оплачена» → 1;
- смена статуса «Новая» → «Подтверждена»: бейдж, статистика и toast обновились;
- заметка сохраняется, toast «Заметка сохранена»;
- мобильная ширина 390 px: 3 карточки, `scrollWidth` 390, одна колонка.

### 4.4. Серверная функция (юнит-тест с моком `fetch`)

- GET → 405, битый JSON → 400;
- несуществующая картина → 400, без согласия → 400;
- honeypot → 200 без записи;
- без переменных окружения → 500;
- успех: цена из каталога (1200, присланная 1 игнорируется), номер `0007`, `consent_at` заполнен;
- Telegram получает `chat_id` и текст заказа;
- 6-й запрос с одного IP → 429.

---

## 5. Ошибки, которые уже возникали, и решения

1. **Headless Chrome не давал окно уже 500 px.** `--window-size=390` игнорировался. Решение: CDP `Emulation.setDeviceMetricsOverride`.
2. **`<dialog>` растягивался на весь экран.** Из-за `inset: 0` и `height: auto`. Решение: `height: fit-content`.
3. **Пустая картинка в первом скриншоте.** Lazy/full-изображение не успевало декодироваться; плюс были неверные width-дескрипторы в `srcset`. Исправлено, проверено по `img.complete` и `currentSrc`.
4. **Telegram не подставлял текст через `?text=`.** Параметр ненадёжен для личных чатов. Решение: копировать текст в буфер и открывать обычный `t.me/alexgg101`; есть fallback `execCommand("copy")`.
5. **Двойная линия над шагами на мобильном.** Совпали бордеры заголовка и первого шага. Убран верхний бордер у первого шага на ≤860 px.
6. **Пустая ячейка в сетке из 7 карточек.** Добавлена плитка «О серии» на 2 колонки.
7. **`photo5.jpg` повёрнута на 90°.** Исправлено при обработке (`rotate(-90)`).
8. **Мёртвые ссылки WhatsApp/e-mail.** Удалены, оставлен только Telegram.
9. **Заказ уходил с первой картиной по умолчанию.** Добавлен обязательный placeholder в select.
10. **Кириллица в PowerShell выглядит мусором.** Это кодировка консоли; файлы в UTF-8, в браузере всё корректно.
11. **Админка показывала экран настройки поверх приложения.** У `.setup`/`.login` задан `display: grid`, который перебивал атрибут `hidden`. Решение: глобальное правило `[hidden] { display: none !important; }` в `public/admin.css` и `public/styles.css`. Заодно перестал показываться пустой блок номера заявки.
12. **Огромная пустота в мобильной админке.** У `.field--search` был `flex: 1 1 260px`; в колоночном flex это становилось высотой 260 px. Решение: на ≤760 px `flex: 1 1 auto`.

---

## 6. Что осталось сделать

### Шаг 1. Проверить локально (5 минут)

```powershell
cd C:\Users\pinea\Desktop\folder1
python -m http.server 8000 --directory public
```

Открыть http://localhost:8000. Форма должна уйти в резервный режим с текстом для Telegram — это ожидаемо без Netlify.

### Шаг 2. Создать репозиторий GitHub

Локальный git уже инициализирован и содержит первый коммит. Нужен аккаунт владельца:

1. Создать пустой репозиторий `akvareli-babushki` на GitHub (без README и .gitignore).
2. Выполнить:

```powershell
cd C:\Users\pinea\Desktop\folder1
git remote add origin https://github.com/ВАШ-АККАУНТ/akvareli-babushki.git
git push -u origin main
```

Если git попросит пароль — нужен Personal Access Token или GitHub Desktop / вход через браузер.

### Шаг 3. Подключить Netlify

1. https://app.netlify.com → **Add new site → Import an existing project → GitHub**.
2. Выбрать `akvareli-babushki`.
3. Build command — пусто, publish directory — `public` (уже задан в `netlify.toml`).
4. Deploy.
5. Получить ссылку `https://<имя>.netlify.app`. Имя можно изменить: Site configuration → Change site name.
6. Проверить, что сайт открылся, картинки и шрифты загрузились.

### Шаг 4. Создать Supabase

1. https://supabase.com → New project, регион EU.
2. SQL Editor → вставить целиком `supabase/schema.sql` → Run.
3. Authentication → Users → Add user: e-mail владельца + пароль.
4. Authentication → Providers → Email: **выключить** Enable Sign Ups, включить Email/Password.
5. Project Settings → API:
   - Project URL и `anon public` → в `public/admin.js` (два места в начале файла);
   - `service_role` — **только** в переменные Netlify, не в код.
6. Закоммитить `public/admin.js` с URL и anon key (это безопасно при включённом RLS).

### Шаг 5. Создать Telegram-бота

1. `@BotFather` → `/newbot` → имя и username → токен.
2. Владелец пишет боту `/start`.
3. Открыть `https://api.telegram.org/bot<ТОКЕН>/getUpdates` → взять `message.chat.id` (число).
4. Не публиковать токен и `chat_id` в репозитории.

### Шаг 6. Переменные окружения Netlify

Site configuration → Environment variables → Add:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
```

Затем **Deploys → Trigger deploy → Deploy site** (без редеплоя функции не увидят новые переменные).

### Шаг 7. Сквозной тест

1. Отправить заявку с телефона на публичной ссылке.
2. Проверить: появился номер заявки, запись есть в Supabase → Table Editor → `orders`.
3. Проверить уведомление в Telegram.
4. Открыть `/admin.html`, войти, увидеть заказ.
5. Сменить статус, обновить страницу — статус сохранился.
6. Добавить заметку, экспортировать CSV.
7. Попробовать отправить форму без согласия — не должна уходить.
8. Отправить заявку с несуществующей картиной через curl — 400.
9. Проверить `/admin.html` в режиме инкогнито — только форма входа, без данных.
10. Проверить мобильную админку на 390 px.

### Шаг 8. Финальная полировка

- Проверить `og:image` и мета-теги на реальном URL.
- Добавить `canonical` и абсолютный `og:image` после получения финального адреса.
- При желании — `sitemap.xml`.
- Отправить владельцу ссылку на сайт, `/admin.html` и инструкцию по входу (без пароля в переписке с третьими лицами).

---

## 7. Что нужно от владельца

1. Аккаунт GitHub (или готовность создать).
2. Аккаунт Netlify.
3. Аккаунт Supabase.
4. Токен Telegram-бота и числовой `chat_id`.
5. E-mail и пароль для входа в админку.
6. Подтверждение условий доставки и оплаты (сейчас текст общий).
7. Решение, нужны ли WhatsApp/e-mail (сейчас только Telegram).

**Не коммитить и не присылать в чат:** `service_role`, токен бота, пароль Supabase.

---

## 8. Definition of Done

- [ ] Сайт открывается по публичной HTTPS-ссылке.
- [ ] Название «Акварели бабушки», цены 1000–1200 ₽, A4, Telegram @alexgg101.
- [ ] Заявка сохраняется в Supabase и приходит в Telegram.
- [ ] Покупатель видит номер заявки.
- [ ] `/admin.html` закрыт входом; видны заказы, статусы, заметки, CSV.
- [ ] Форма требует согласие; есть `public/privacy.html`.
- [ ] Нет ошибок в консоли и горизонтального скролла на 320/390 px.
- [ ] Владелец получил ссылку и доступы.

---

## 9. Быстрые команды

```powershell
# локальный просмотр
cd C:\Users\pinea\Desktop\folder1
python -m http.server 8000 --directory public

# синтаксис
node --check public/script.js
node --check public/admin.js
node --check netlify/functions/order.mjs

# поиск цен и названий
Select-String -Path public/script.js,netlify/functions/order.mjs -Pattern "price:|price ="

# git
git status
git add .
git commit -m "Описание изменения"
git push
```

Ссылки:

- Netlify: https://app.netlify.com
- Supabase: https://supabase.com
- BotFather: https://t.me/BotFather
- Telegram владельца: https://t.me/alexgg101
