# ⚕ StellarHealthRecord — Token-Gated Patient Records

> Full-stack patient record system with Stellar blockchain token-gated access control.

**Stack:** React + Vite (frontend) · Express + MongoDB (backend) · Stellar SDK · Freighter Wallet

---

## 🏗️ Architecture

```
stellar-health/
├── backend/                     ← Node.js / Express API
│   └── src/
│       ├── index.js             ← Server entry, MongoDB connect
│       ├── lib/stellar.js       ← Stellar SDK: token-gate, SEP-10, Friendbot
│       ├── middleware/auth.js   ← JWT verify + Stellar token-gate middleware
│       ├── models/index.js      ← Mongoose: User, Patient, AccessGrant, Audit
│       └── routes/
│           ├── auth.js          ← Register, login, SEP-10 challenge, token-check
│           └── patients.js      ← CRUD + vitals + visits + grants + audit
│
└── frontend/                    ← React + Vite SPA
    └── src/
        ├── lib/
        │   ├── api.js           ← REST client (fetch wrapper)
        │   └── AuthContext.jsx  ← Auth state + token-gate status
        ├── components/
        │   ├── UI.jsx           ← Shared design system (Card, Btn, Badge…)
        │   └── NewPatientModal  ← Create patient form
        └── pages/
            ├── Login.jsx        ← Register / login with Stellar keypair
            ├── Dashboard.jsx    ← Patient list, stats, token-gate indicator
            └── PatientDetail.jsx← Overview, Vitals, Visits, Access, Audit
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas free tier)

### 2. Backend
```bash
cd backend
cp .env.example .env          # edit MONGO_URI and JWT_SECRET
npm install
npm run dev                   # → http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                   # → http://localhost:5173
```

---

## 🔐 Token Gating — How It Works

### Three access levels per patient record:

| Level | Who can view | Stellar requirement |
|---|---|---|
| 🌐 **Public** | Any logged-in user | None |
| 🔒 **Restricted** | Doctors with ≥10 XLM | Checked live on Horizon |
| 🔐 **Private** | Explicitly granted accounts | Creator must grant |

### Flow:
1. Doctor logs in with Stellar public key
2. Backend checks `GET /api/auth/token-check/:publicKey` → queries Horizon live
3. If balance ≥ 10 XLM → `requireStellarAccess` middleware passes
4. All access events written to MongoDB Audit collection
5. On-chain anchoring: visit logs include Stellar TX hash as proof

### To get testnet XLM:
- Click "Fund via Friendbot" in the dashboard
- Or: `POST /api/auth/fund-testnet` with your public key

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with name, email, Stellar key |
| POST | `/api/auth/login` | Login with email + Stellar key |
| GET  | `/api/auth/token-check/:key` | Live on-chain balance check |
| POST | `/api/auth/fund-testnet` | Fund account via Friendbot |

### Patients (all require JWT)
| Method | Endpoint | Gate | Description |
|---|---|---|---|
| GET    | `/api/patients`           | JWT only    | List patients (public fields) |
| POST   | `/api/patients`           | JWT + Token | Create patient record |
| GET    | `/api/patients/:id`       | Access-level| Get full record |
| POST   | `/api/patients/:id/vitals`| JWT + Token | Record vitals |
| POST   | `/api/patients/:id/visits`| JWT + Token | Log visit |
| POST   | `/api/patients/:id/grant` | Creator only| Grant access |
| GET    | `/api/patients/:id/audit` | JWT + Token | Get audit trail |
| DELETE | `/api/patients/:id`       | Creator only| Delete record |

---

## 🌍 Deploy

### Backend (Railway / Render)
```bash
# Set env vars in dashboard:
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```bash
cd frontend
npm install -g vercel
vercel --prod
# Set env: VITE_API_URL=https://your-backend.railway.app
```

---

## 🔮 Production Upgrades

- [ ] Real SEP-10 challenge/response (full Stellar auth flow)
- [ ] Custom Stellar asset `HRTOKEN` instead of XLM threshold
- [ ] IPFS storage for medical documents / X-rays
- [ ] Soroban smart contract for access grant logic
- [ ] Email notifications on record access
- [ ] Multi-hospital support with institution tokens
- [ ] Mainnet switch (change HORIZON_URL + NETWORK_PASSPHRASE)

---

Built for **Stellar Ecosystem Hackathon** · Project 5 of 30 · Devdock.AI
