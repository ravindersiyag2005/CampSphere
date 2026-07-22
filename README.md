<div align="center">

# 🎓 CampSphere

### *The all-in-one digital campus platform — built on the MEAN stack*

<br/>

[![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/ravindersiyag2005/CampusHub-MEAN-Platform/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/ravindersiyag2005/CampusHub-MEAN-Platform?style=for-the-badge&color=gold)](https://github.com/ravindersiyag2005/CampusHub-MEAN-Platform/stargazers)

<br/>

> **CampSphere** brings your entire campus life into one sleek platform — share notes, find trip buddies, discover food spots, chat anonymously, and let admins keep everything in order. Dark mode included. Animations too. Zero boring UIs.

<br/>

---

</div>

## ✨ What's Inside?

| Module | What it does |
|--------|-------------|
| 📚 **Notes Sharing** | Upload, search, upvote, edit, delete & download notes. **Instantly earn contribution points**! |
| 📝 **PYQ Bank** | Previous-year question papers, same slick engine as Notes |
| 🎉 **Campus Events** | Post & discover events — auto-expire via MongoDB TTL after the event ends |
| ✈️ **Travel & Trip Buddy** | Find trip-mates, **manage join requests (accept/decline)**, and auto-cleans up 12h after departure |
| 🍜 **Food Spots** | Pin dishes on campus or in the city — upvote + 5-star ratings |
| 💬 **Anonymous Chat** | Group rooms + private 1:1 DMs with alias-based identity and private photo/PDF sharing |
| 🛡️ **Admin Panel** | User management, chat monitor, report queue, blocked-word list, and **global moderation of private posts**. |
| 📸 **Photoholic Feed** | Share photos of campus life, double-tap to like, and comment. **Share private moments with specific college IDs.** |
| ⚙️ **Profile & Settings** | Custom avatars, password management, and per-room anonymous identity control |
| 📱 **Fully Responsive** | Optimized layouts that seamlessly adapt across mobile, tablet, and desktop views |
| 🌙 **Dark Mode** | System-preference aware, one-click toggle, persisted forever |
| ✨ **Anime.js Animations** | Staggered entrances, counting numbers, parallax blobs, elastic micro-interactions |

---

## 🛡️ Security & Authorization

- **Rate Limiting**: Integrated `express-rate-limit` to prevent brute-force attacks on authentication endpoints and limit global API spam.
- **Robust Access Control**: Full database-level IDOR (Insecure Direct Object Reference) protection. Users can securely edit or delete only their own uploaded resources (Notes, PYQs, Travel Posts, etc.), while Admins have full moderation capabilities.
- **NoSQL Injection Protection**: Inputs are strictly sanitized and regex queries safely escaped to prevent database injection and timing-based user enumeration attacks.

---

## 🏗️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│   Angular 18 (Standalone Components)  +  anime.js       │
│   SCSS Design Tokens  •  Socket.io-client  •  RxJS      │
├─────────────────────────────────────────────────────────┤
│                       BACKEND                           │
│   Node.js 18+  •  Express 4.x  •  Socket.io            │
│   Multer (file uploads)  •  JWT Auth  •  bcryptjs       │
├─────────────────────────────────────────────────────────┤
│                      DATABASE                           │
│   MongoDB  (local or Atlas)  •  Mongoose ODM            │
│   TTL Indexes for auto-expiring documents               │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
campus-hub/
├── 📂 backend/
│   ├── config/          → MongoDB connection
│   ├── models/          → User, Resource, Event, TravelPost, FoodSpot,
│   │                       ChatRoom, RoomAlias, Conversation, Message,
│   │                       BlockedWord, Report, Review, Post
│   ├── controllers/     → One per module (auth, chat, admin, …)
│   ├── routes/          → Express routers
│   ├── middleware/       → JWT auth • Multer file upload
│   ├── socket/          → chatSocket.js — real-time engine
│   ├── utils/           → aliasGenerator.js • wordFilter.js
│   ├── seed.js          → Seeds admin account + starter chat rooms
│   └── server.js        → App entrypoint
│
└── 📂 frontend/
    └── src/app/
        ├── core/        → Services, Guards, Interceptor, Models
        ├── features/
        │   ├── auth/        → Login, Register
        │   ├── dashboard/   → Module hub with animations
        │   ├── notes/       → Notes + PYQ (shared component)
        │   ├── events/      → Campus events
        │   ├── travel/      → Trip buddy board
        │   ├── food/        → Food spots map
        │   ├── chat/        → Rooms list, Group room, Anonymous DM
        │   ├── photoholic/  → Campus photo feed, likes, and comments
        │   ├── settings/    → Avatar upload, profile & aliases management
        │   └── admin/       → Admin dashboard (5 tabs)
        └── shared/      → BackgroundFX component, StaggerIn directive
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `v18+` and `npm`
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- Two terminal windows (one for backend, one for frontend)

---

### 1️⃣ Clone the repo

```bash
git clone https://github.com/ravindersiyag2005/CampusHub-MEAN-Platform.git
cd CampusHub-MEAN-Platform
```

### 2️⃣ Backend setup

```bash
cd backend
npm install
cp .env.example .env       # Fill in your Mongo URI + JWT secret
npm run dev                # Starts on http://localhost:5000 via nodemon
```

**Seed the database** (creates default admin + 3 starter chat rooms):

```bash
node seed.js
```

> 🔑 **Default admin credentials:** College ID `1232610` / password `1232610`

### 3️⃣ Frontend setup

```bash
cd ../frontend
npm install
npm start                  # Starts on http://localhost:4200
```

> The frontend talks to `http://localhost:5000/api` by default. Update `src/environments/environment.prod.ts` before deploying.

---

## 🔐 Anonymous Chat — How It Works

The alias system is one of CampSphere's coolest features:

```
Student A ──► "Cosmic Falcon 482"  (in Room 1)
Student A ──► "Lunar Wolf 117"     (in Room 2)   ← different alias, same person
                                                     server knows who's who
                                                     other students don't 👀
```

| Feature | Details |
|---------|---------|
| **Per-room aliases** | Each user gets a unique alias per room — can't be correlated across rooms |
| **Private DMs** | "Message privately" resolves alias → real user *server-side*, still anonymous on client |
| **Media Sharing** | Securely share photos and PDFs in private 1:1 DMs and group rooms |
| **Admin transparency** | Admins see real name + college ID next to every message and DM |
| **Word filter** | Messages checked against admin blocklist *before* saving — can't be bypassed from browser |
| **Rate limiting** | Max 8 messages per 10 seconds per user — server-side, in-memory |
| **Reports** | 3 reports = auto-hidden pending admin review; admins can block/unblock real accounts |

---

## 👑 Admin Permissions & Moderation

CampSphere provides a comprehensive suite of tools for admins to keep the campus platform safe and organized. Admin accounts have elevated permissions globally:

- **Global Content Moderation:** Admins can view and delete *any* post across all modules (Notes, PYQs, Travel, Events, Food, Photoholic), regardless of the content's privacy settings.
- **Privacy Override:** Private posts (like Photoholic pictures or private Notes) are automatically visible to admins for moderation purposes, bypassing the usual `sharedWith` College ID restrictions.
- **User Management:** Full ability to view all registered students, manage accounts, and block/unblock malicious users from the platform.
- **Chat Transparency:** While students see anonymous aliases in chat rooms, admins always see the *real name and College ID* of the message sender to ensure accountability.
- **Automated Reporting Queue:** Messages reported 3 times are auto-hidden and sent to the admin dashboard for manual review.
- **Word Filter:** Admins can configure a global blocklist of inappropriate words that the server actively prevents from being sent in any chat room.

---

## 🎨 Design System

The entire app uses a **"golden-hour campus quad"** palette:

```
Primary BG  →  Deep Indigo    #14132B
Accent 1    →  Electric Violet
Accent 2    →  Coral
Accent 3    →  Amber
Accent 4    →  Teal / Pink

Display Font → Sora
Body Font    → Inter
Mono Font    → JetBrains Mono (IDs, timestamps, aliases)
```

Every color is a **CSS custom property** — `--bg`, `--surface`, `--text`, `--violet` — defined once in `styles.scss` and remapped under `html[data-theme='dark']`. The whole app re-themes **instantly** without a single page reload.

---

## ✨ Animations (anime.js)

`animation.service.ts` exposes reusable helpers used across every screen:

| Helper | Used for |
|--------|----------|
| `fadeUp` | Hero sections, form cards |
| `staggerIn` | List/grid items arriving in sequence |
| `popIn` | Module cards on dashboard |
| `countUp` | Reputation/contribution counters |
| `pulse` | Upvote, join, rating micro-interactions |
| `shake` | Failed login/register validation |

**Background FX** — four blurred gradient blobs loop continuously *and* drift toward your cursor (mouse parallax), layered over real campus photography with a theme-aware tint.

---

## 🌙 Dark Mode

Click the **☀️ / 🌙** switch in the sidebar. It:

- Persists to `localStorage`
- Defaults to your OS `prefers-color-scheme` on first visit
- Re-themes every element instantly via CSS variables
- Keeps the sidebar and auth panels always dark (by design — like any good app shell)

---

## ⚙️ Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

```env
MONGO_URI=mongodb://127.0.0.1:27017/campsphere
JWT_SECRET=your_super_secret_key
PORT=5000
```

> ⚠️ Never commit your `.env` — it's already in `.gitignore`.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. **Fork** this repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push and open a **Pull Request**

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

**Built with ❤️ by [Ravinder Siyag](https://github.com/ravindersiyag2005)**

*If you found this useful, drop a ⭐ — it means a lot!*

[![GitHub](https://img.shields.io/badge/GitHub-ravindersiyag2005-181717?style=for-the-badge&logo=github)](https://github.com/ravindersiyag2005)

</div>
