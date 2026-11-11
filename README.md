# Акварели бабушки — сайт для продажи картин

Статический сайт-галерея с приёмом заявок: без сборки и фреймворков. Заявки сохраняются в Supabase и приходят уведомлением в Telegram; владелец видит их в админке `/admin.html`.

## Что внутри

```
index.html                     — главная страница и тексты
privacy.html                   — политика конфиденциальности
styles.css                     — оформление главной
script.js                      — работы, контакты, галерея, заявка
admin.html / admin.css / admin.js — админка заказов (вход по паролю)
netlify.toml                   — публикация, /api/order, заголовки
netlify/functions/order.mjs    — приём заявки, запись в Supabase, Telegram
supabase/schema.sql            — таблица orders и RLS-политики
robots.txt                     — закрывает /admin.html от индексации
assets/images/full/            — полноразмерные фотографии
assets/images/preview/         — превью для галереи
assets/favicon.svg             — иконка сайта
photo1…photo7.jpg              — исходники, в git и на хостинг не попадают
```

## Локальный просмотр

```powershell
python -m http.server 8000
```

Открыть http://localhost:8000. Без Netlify форма работает в резервном режиме: копирует текст заявки и предлагает отправить его в Telegram. Это нормально.

## Что заменить перед публикацией

1. **Контакты** — начало `script.js`:

```js
const CONTACTS = {
  telegram: "https://t.me/alexgg101"
};
```

2. **Ключи Supabase для админки** — начало `admin.js`:

```js
const SUPABASE_URL = "https://ВАШ-ПРОЕКТ.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi..."; // именно anon public, не service_role
```

3. **Переменные окружения Netlify** (Site settings → Environment variables):

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

`service_role` и токен бота хранятся только в Netlify. В `script.js` и `admin.js` их быть не должно.

## Работы и цены

Массив `ARTWORKS` в `script.js` — источник данных для галереи. Цены и названия для серверной проверки продублированы в `netlify/functions/order.mjs` (`CATALOG`). **При изменении цены правьте оба места**, иначе сервер запишет старую цену.

Сейчас: 7 работ, A4, 1000–1200 ₽.

## Как добавить новую картину

1. Положите фотографию в `assets/images/full/` (например, `painting8.jpg`).
2. Сделайте превью ~800 px по длинной стороне в `assets/images/preview/painting8.jpg`.
3. Добавьте объект в `ARTWORKS` в `script.js`.
4. Добавьте работу в `CATALOG` в `netlify/functions/order.mjs`.
5. Обновите счётчик «07» в `index.html` и `ARTWORKS.length` подставится в галерее автоматически.

## Публикация: GitHub + Netlify

```powershell
cd C:\Users\pinea\Desktop\folder1
git init
git add .
git commit -m "Акварели бабушки: сайт, заявки, админка"
git branch -M main
git remote add origin https://github.com/ВАШ-АККАУНТ/akvareli-babushki.git
git push -u origin main
```

Затем в Netlify: **Add new site → Import an existing project → GitHub** → выбрать репозиторий.
Build command — пусто, Publish directory — `.`. Functions подхватятся из `netlify.toml`.

После первого деплоя добавить переменные окружения и нажать **Deploys → Trigger deploy → Deploy site**.

## Supabase: один раз

1. Создать проект на https://supabase.com (регион EU).
2. SQL Editor → выполнить `supabase/schema.sql`.
3. Authentication → Users → Add user: e-mail и пароль владельца.
4. Authentication → Providers → Email: выключить публичную регистрацию (Enable Sign Ups).
5. Project Settings → API: скопировать Project URL и `anon public` key в `admin.js`, `service_role` — в Netlify.

## Telegram-бот

1. `@BotFather` → `/newbot` → получить токен.
2. Написать боту `/start`.
3. Открыть `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и взять числовой `chat_id`.
4. Положить токен и `chat_id` в переменные Netlify.

Бот не может писать по `@username` — нужен именно числовой `chat_id`.

## Админка

`https://ваш-сайт.netlify.app/admin.html`

- вход по e-mail и паролю Supabase;
- список заказов, поиск, фильтр по статусу;
- смена статуса: новая → подтверждена → оплачена → отправлена → завершена (или отменена);
- внутренние заметки (трек-номер, договорённости);
- экспорт CSV для Excel;
- на телефоне — карточки вместо таблицы.

Страница закрыта от индексации (`noindex` + `robots.txt`), но не прячьте её как «секрет»: защита — пароль и RLS-политики Supabase.

## Как работает заявка

1. Форма собирает картину, имя, контакт и комментарий.
2. `POST /api/order` → Netlify Function.
3. Функция проверяет поля, берёт цену из серверного каталога, проверяет honeypot и лимит запросов.
4. Запись вставляется в `orders` через `service_role`.
5. В Telegram уходит уведомление с номером заказа.
6. Покупатель видит номер заявки; текст заявки можно скопировать и отправить в Telegram.

Если API недоступен (локальный файл, сбой сети), сайт не теряет заявку: показывает готовый текст, копирует его и предлагает открыть Telegram.

## Проверки

```powershell
node --check script.js
node --check admin.js
node --check netlify/functions/order.mjs
```

Перед публикацией стоит вручную отправить тестовую заявку и убедиться, что она появилась в админке и пришла в Telegram.
