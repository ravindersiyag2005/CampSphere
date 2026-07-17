# Campus Hub — MEAN Stack

A multi-module campus platform: **MongoDB + Express + Angular (standalone components) + Node.js**, with Socket.io for real-time anonymous chat.

Modules included (Lost & Found intentionally excluded, as requested):

1. **Notes Sharing** — upload/search/upvote/download subject-wise notes
2. **PYQ Bank** — previous-year papers, same engine as Notes (shared schema, `type: 'pyq'`)
3. **Campus Events** — auto-expiring (MongoDB TTL index, cleans itself up ~6h after the event)
4. **Travel & Trip Buddy** — post/join trips, auto-expires ~12h after travel time
5. **Food Spots** — pin dishes on campus or in the city, upvote + 5-star rating
7. **Anonymous Chat** — group rooms + anonymous 1:1 DMs, alias-based identity, report/rate-limit/word-filter, full admin oversight
8. **Admin Panel** — user list + block/unblock, chat monitor with real identities, report queue, blocked-word list
9. **Dark mode** — toggle in the sidebar, persisted, respects system preference on first visit
10. **Animated, photo-backed theme** — anime.js-driven entrances, floating gradient blobs, mouse parallax, and real campus/library photography behind the UI

---

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string
- Two terminals (one for backend, one for frontend)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env if your Mongo URI / JWT secret should be different
npm run dev          # starts on http://localhost:5000 (nodemon)
```

In a second terminal, seed a default admin account and starter chat rooms:

```bash
cd backend
node seed.js
```

This creates:
- **Admin login:** `admin@campushub.edu` / `Admin@123`
- Chat rooms: General Campus Chat, Placements & Internships, DSA & Coding

Uploaded files (notes/PYQ PDFs, images) are stored in `backend/uploads/` and served at `/uploads/...`.

## 3. Frontend setup

```bash
cd frontend
npm install
npm start            # starts on http://localhost:4200
```

The frontend expects the API at `http://localhost:5000/api` and sockets at `http://localhost:5000` — see `src/environments/environment.ts`. Update `environment.prod.ts` before deploying.

## 4. Using the app

1. Open `http://localhost:4200`, register a student account (name, college ID, email, password).
2. Explore modules from the sidebar: Notes, PYQ, Events, Travel Buddy, Food Spots, Anonymous Chat.
3. Log out and log in as the seeded admin (`admin@campushub.edu` / `Admin@123`) to see the **Admin Panel** in the sidebar — user management, chat monitor (real names + college IDs against every anonymous message), report queue, and the blocked-words list.

## 5. How the anonymous chat identity model works

- Every student gets a random alias (e.g. "Cosmic Falcon 482") that's **consistent within a room** but **different across rooms**, so aliases can't be correlated by other students.
- The server always knows the real user behind a message — the frontend for regular students never receives `senderId`, only `senderAlias`.
- Clicking **"Message privately"** on someone's message resolves their alias to a real user *server-side* and opens (or reuses) a private, still-anonymous 1:1 conversation.
- **Admins bypass the alias mask everywhere** — the Chat Monitor tab shows real name + college ID next to every message and DM.
- **Word filter:** messages are checked against an admin-maintained blocklist **before** they're saved — this happens in the Socket.io handler on the server, so it can't be bypassed from the browser.
- **Rate limiting:** max 8 messages per 10 seconds per user (server-side, in-memory).
- **Reports:** 3 reports on a message auto-hides it pending admin review; admins can also hide/unhide any message directly, and block/unblock the real account behind repeat offenses (blocking the account, not just the alias, so a new alias can't be used to bypass a block).

## 6. Project structure

```
campus-hub/
  backend/
    config/db.js
    models/            User, Resource (Notes+PYQ), Event, TravelPost, FoodSpot, Review,
                        ChatRoom, RoomAlias, Conversation, Message, BlockedWord, Report
    middleware/         auth.js (JWT), upload.js (multer)
    controllers/        one per module
    routes/              one per module
    socket/chatSocket.js  real-time chat, word filter, rate limiting, admin broadcast
    seed.js              creates admin + starter rooms
    server.js
  frontend/
    src/app/
      core/              services, guards, interceptor, models
      features/
        auth/            login, register
        dashboard/       colorful module hub
        notes/           shared Notes + PYQ list/upload component
        events/
        travel/
        food/
        chat/            rooms list, group room, anonymous DM
        admin/            admin dashboard (tabs: overview/users/chat/reports/blocklist)
    src/styles.scss       global theme (colors, type, buttons, cards, forms)
```

## 7. Design notes

The theme is a "golden-hour campus quad" palette — deep indigo ink (`#14132B`) with electric violet, coral, amber, teal and pink accents, `Sora` for display type and `Inter` for body text, `JetBrains Mono` for IDs/timestamps/aliases. Every module card, badge, and button uses this consistent token system (defined once in `frontend/src/styles.scss`) rather than one-off styling per page.

## 8. Dark mode

Click the sun/moon switch at the bottom of the sidebar to toggle dark mode. It's persisted in `localStorage` and defaults to the browser's `prefers-color-scheme` on first visit. Almost every color in the app is a CSS custom property (`--bg`, `--surface`, `--text`, `--violet`, …) defined once in `styles.scss` and re-mapped under `html[data-theme='dark']`, so the whole app re-themes instantly — the only fixed-dark surfaces are the sidebar, toasts, and the auth-page side panel, which use a separate `--shell` token so they stay dark in both modes (by design, like most app shells).

## 9. Animation (anime.js)

`core/services/animation.service.ts` wraps [anime.js](https://animejs.com) with a handful of reusable helpers — `fadeUp`, `staggerIn`, `popIn`, `countUp`, `pulse`, `shake` — used throughout:

- **Background** (`shared/components/background-fx.component.ts`) — four blurred gradient blobs loop continuously with anime.js and drift slightly toward the cursor (mouse parallax), layered over real campus/library photography with a theme-aware tint.
- **Dashboard** — hero fades up, the contribution/reputation numbers count up from 0, module cards pop in with a staggered delay, and each card's emoji bounces on hover.
- **Login / Register** — floating anime.js blobs over a campus photo, the form card fades in, and a failed login/register shakes the card.
- **Notes / PYQ / Events / Travel / Food / Chat rooms** — list and grid items stagger in via a small reusable `appStaggerIn` directive (`shared/components/stagger-in.directive.ts`) that re-triggers whenever the list changes.
- **Anonymous chat** — new messages pop in individually as they arrive over the socket; the initial history staggers in on load.
- **Micro-interactions** — upvote, join, "I'm interested", star-rating, and the dark-mode switch all give a quick elastic "pulse" on click for tactile feedback.

Real photography (verified, license-free Unsplash URLs) is layered behind the login/register panels and the app background — a sunlit campus courtyard for light mode, a grand library for dark mode — tinted and blurred so it adds atmosphere without hurting text contrast.

## 10. What's verified vs. what you should double check

- ✅ Backend: all files pass `node --check`; the server boots cleanly and only fails to fully start when MongoDB isn't reachable (expected in this sandbox, which has no local Mongo instance).
- ✅ Frontend: `ng build` completes with **zero errors** (verified in this environment) — all standalone components, routes, and templates compile.
- ⚠️ Not verified here: full end-to-end runtime behavior against a live MongoDB + browser session (this sandbox has no MongoDB and no browser). Run it locally per the steps above to confirm the full flow — I'd recommend testing register → upload a note → post an event → join a trip → chat in a room → report a message → check the admin panel, in that order.
