# KotvukAI — Crypto Analytics Platform

**KotvukAI** — это полнофункциональная платформа для криптовалютной аналитики с интегрированным искусственным интеллектом, реализованная в рамках дипломного проекта.

---

## Стек технологий

| Слой | Технологии |
|------|-----------|
| **Frontend** | React 18, Vite 5, Framer Motion, Lightweight Charts |
| **Backend** | Node.js, Express.js, SQLite (better-sqlite3) |
| **AI** | Groq API (LLaMA 3) |
| **Real-time** | WebSocket (ws), Binance Stream |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Тесты** | Jest + Supertest (backend), Vitest (frontend) |
| **Infra** | Kubernetes, GitHub Actions CI/CD, Prometheus, Grafana, ELK |
| **PWA** | Service Worker, Web App Manifest |

---

## Архитектура

```
┌─────────────────────────────────────────────┐
│              Browser (React 18)              │
│  Dashboard │ Charts │ AI │ Trades │ Alerts  │
│  Screener  │ Whale  │ News │ Heatmap │ PWA  │
└──────────────────┬──────────────────────────┘
                   │ HTTP / WebSocket
┌──────────────────▼──────────────────────────┐
│           Express.js Backend                 │
│  /api/auth  /api/ai  /api/market  /api/trades│
│  /api/alerts  /api/signals  /api/watchlist  │
│  /api/news  /api/whale  /api/onchain  /metrics│
└──────┬──────────────┬───────────────────────┘
       │              │
┌──────▼──────┐  ┌────▼──────────────────────┐
│   SQLite    │  │   External APIs            │
│   (WAL)     │  │   Binance │ Groq │ CryptoC │
└─────────────┘  └───────────────────────────┘
```

---

## Быстрый старт

### Требования
- Node.js >= 18
- npm >= 9

### Backend
```bash
cd backend
npm install
cp ../.env.example .env
# Заполните .env своими ключами
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Приложение доступно на `http://localhost:5173`  
Backend API на `http://localhost:3000`

---

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```env
PORT=3000
NODE_ENV=development

# Обязательно
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
GROQ_API_KEY=your-groq-api-key

# Опционально
GLASSNODE_API_KEY=your-glassnode-key
```

---

## Функциональность

| Панель | Описание |
|--------|----------|
| **Dashboard** | Live цены (WebSocket), AI рекомендация дня, Fear & Greed индекс |
| **Charts** | TradingView Lightweight Charts, 7 таймфреймов, рисование, Fibonacci |
| **AI Analysis** | Многотаймфреймовый анализ 40+ пар, история сигналов, self-learning |
| **AI Chat** | Диалог с AI по криптовалютному рынку |
| **Trades** | Paper trading: long/short, TP/SL, автозакрытие, статистика PnL |
| **Alerts** | Ценовые алерты с аудио-уведомлением (Web Audio API) |
| **Screener** | Таблица 50+ пар с сортировкой, фильтрами, sparkline |
| **Heatmap** | Тепловая карта рынка, цветовое кодирование изменений |
| **Whale Panel** | Order book, крупные сделки (>$100k) |
| **News** | Новости CryptoCompare + AI-краткое содержание |
| **On-Chain** | Метрики блокчейна (требует Glassnode API) |
| **Watchlist** | Избранные пары с live ценами |
| **Calculator** | Калькулятор позиции с визуальным Risk Gauge |
| **Learning** | Образовательные материалы по TA, FA, психологии |
| **Admin** | Управление пользователями, планами, сигналами |

---

## Тестирование

```bash
# Backend (Jest + Supertest)
cd backend
npm test

# Frontend (Vitest)
cd frontend
npm test
```

---

## Деплой

### Docker / Kubernetes
```bash
kubectl apply -f infra/k8s/
```

### CI/CD
GitHub Actions автоматически запускает lint → тесты → build → Snyk scan при каждом push в `main`.

---

## История разработки

Подробная история разработки проекта по этапам — в файле [HISTORY.md](./HISTORY.md).

---

## Лицензия

MIT License — см. файл [LICENSE](./LICENSE).
