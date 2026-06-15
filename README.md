# Cloud Forex Servers

Блок тарифів **Cloud Forex Servers** за макетом Figma: верстка карток тарифних
планів, перемикач дата-центру та перемикач періоду оплати з динамічним
оновленням цін. Дані тарифів отримуються з upstream API, фільтруються до
Forex-тарифів та нормалізуються бекендом.

| Шар        | Технології                          | Порт |
| ---------- | ----------------------------------- | ---- |
| Frontend   | Next.js 14 (App Router), TypeScript, SCSS, SWR | 3000 (публічний) |
| Backend    | FastAPI, httpx, Pydantic            | 8000 (внутрішній) |
| Оркестрація| Docker / Docker Compose             | —    |

---

## Швидкий старт (Docker)

```bash
docker compose up --build
```

- Застосунок: <http://localhost:3000>

Публікується **лише фронтенд**. Браузер звертається до `/api/*` на тому ж
домені, а Next.js проксіює ці запити на внутрішній бекенд — тож CORS і другий
домен не потрібні. Зупинка: `docker compose down`.

## Локальний запуск (без Docker)

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # Swagger: http://localhost:8000/docs
```

**Frontend**

```bash
cd frontend
npm install
cp .env.local.example .env.local        # API_BASE_URL_INTERNAL=http://localhost:8000
npm run dev
```

---

## Архітектура

```
                 single public domain
Browser ──/api──► Next.js ──► FastAPI ──► upstream BILLmanager proxy
          (SSR + CSR proxy)   (internal)   (api.zomrodev.online)
```

Браузер ніколи не звертається до бекенду напряму: і SSR, і клієнтський
`GET /api/forex/catalogue` (route handler [`src/app/api/forex/catalogue`](frontend/src/app/api/forex/catalogue/route.ts))
проходять через Next.js, який ходить до FastAPI по внутрішній мережі.

1. **FastAPI** звертається до upstream `v2.instances.order.pricelist`,
   **фільтрує лише Forex-тарифи** (`fgroup_2 == "9"`, тег `forex_server`),
   розгортає глибоко вкладений BILLmanager-payload у пласку, типізовану
   структуру і віддає її одним ендпоінтом.
2. **Next.js** робить SSR-запит до бекенду для миттєвого першого рендера, а на
   клієнті використовує **SWR** для оновлення та повторних спроб. Перемикання
   дата-центру і періоду відбувається **на клієнті без додаткових запитів** —
   каталог завантажується один раз.

### Контракт API — `GET /api/forex/catalogue`

```jsonc
{
  "datacenters": [{ "id": "12", "name": "Poland-1 [Cloud]", "short": "PL-1" }],
  "periods":     [{ "key": "1", "months": 1 }, { "key": "12", "months": 12 }],
  "plans": [{
    "id": "8005",
    "key": "8005_12",              // унікальний ключ замовлення
    "tier": 1,                     // 1..4 (Cloud Forex N)
    "name": "Cloud Forex 1",
    "datacenter_id": "12",
    "specs": { "cpu": "1", "ram": "2.5 Gb", "disk": "17 Gb", "port": "1000 Mbps", "traffic": "1 TB" },
    "currency": "EUR",
    "prices": { "1": 6.48, "3": 19.44, "6": 37.88, "12": 77.76 },
    "order_url": "/order?plan=8005_12"   // посилання містить унікальний id тарифу
  }]
}
```

---

## Реалізовані вимоги

- ✅ Верстка карток Cloud Forex 1–4 згідно з дизайном (темна violet-тема,
  glow, градієнтні бордери, картка **BEST CHOICE**).
- ✅ Кнопка покупки містить **унікальний id тарифу** в посиланні
  (`data-plan-id` + `order_url=/order?plan=<key>`).
- ✅ **Дропдаун з параметрами тарифу** на кожній картці (розгортає повний
  список характеристик: CPU, Memory, Disk, Port, Bandwidth, Traffic).
- ✅ Перемикач **дата-центру** — тарифи змінюються при зміні ДЦ.
- ✅ Перемикач **періоду оплати** — ціни оновлюються динамічно.
- ✅ Дані тарифів через API з фільтрацією лише Forex-тарифів.

## Прийняті рішення

- **Дата-центр USA (21)** показаний як повноцінний перемикач — upstream
  повертає для нього Forex-тарифи. Якщо для будь-якого ДЦ тарифів немає,
  показується акуратний порожній стан.
- **Маркетинговий контент** (кількість Terminals, список «ВОЗМОЖНОСТИ», теги
  «ПОДХОДИТ ДЛЯ») відсутній в API — це presentation-копірайт із Figma, винесений
  у per-tier конфіг [`frontend/src/lib/content.ts`](frontend/src/lib/content.ts).
  Назва, ціна, характеристики та id беруться з API.
- **Специфікації** в картці рендеряться з реальних даних API (числа в макеті
  були ілюстративними).
- **Стійкість до upstream**: бекенд має in-process TTL-кеш та ретраї з backoff
  на транзієнтні `429/502/503/504` **і на порожній 200-payload** (upstream під
  навантаженням періодично віддає 503 або порожній прайс-лист); порожня
  відповідь не кешується.
- **Прапори ДЦ та іконка термінала** — інлайн SVG із
  [`frontend/src/icons/`](frontend/src/icons), підключені через **SVGR**
  (див. [`next.config.mjs`](frontend/next.config.mjs)).

## Конфігурація

Backend (env, див. [`backend/.env.example`](backend/.env.example)):
`UPSTREAM_URL`, `DATACENTERS`, `FOREX_GROUP_TAG`, `CACHE_TTL_SECONDS`.

Frontend: `API_BASE_URL_INTERNAL` — внутрішній URL бекенду для SSR і
проксі-роуту (за замовчуванням `http://backend:8000` у Docker).

Compose: `FRONTEND_PORT` — host-порт фронтенду (за замовчуванням `3000`).

## Деплой на Dokploy

Застосунок розрахований на **один публічний домен** (фронтенд), бекенд
лишається внутрішнім — тож налаштування мінімальне.

1. **Dokploy → Create → Compose.**
2. **Provider:** Git, репозиторій `https://github.com/VitoPython/payment_forex.git`,
   гілка `main`, Compose Path `docker-compose.yml`.
3. **Environment** (необов'язково): дефолтів достатньо. За потреби можна
   перевизначити `DATACENTERS`, `CACHE_TTL_SECONDS` тощо.
4. **Deploy** — Dokploy збере обидва образи.
5. **Domains:** додати домен сервісу **`frontend`**, container port **`3000`**,
   увімкнути HTTPS (Let's Encrypt). Сервісу `backend` домен **не** потрібен.
6. Відкрити домен — застосунок працює; усі API-запити йдуть через той самий
   домен (`/api/...`) і проксіюються на внутрішній бекенд.

> Якщо на хості зайнятий порт 3000 (напр. ним користується сама панель
> Dokploy), задайте `FRONTEND_PORT` в Environment — маршрутизація через домен
> Dokploy/Traefik від цього не залежить.

### Доступ до FastAPI (Swagger)

Фронтенду бекенд не потрібен ззовні, але якщо треба відкрити сам API:
додайте **другий домен** для сервісу **`backend`**, container port **`8000`**.
Тоді доступні `https://<backend-домен>/docs` (Swagger) та
`https://<backend-домен>/api/forex/catalogue`. API публічний і дозволяє CORS
з будь-якого джерела (`CORS_ORIGINS` за замовчуванням `*`).
