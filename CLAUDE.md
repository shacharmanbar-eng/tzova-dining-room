# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static, no-build prototype of a Hebrew (RTL) kibbutz dining-room site (Tzova): diners compose a personal meal and see price + estimated nutrition; an admin manages dishes, menus and banner messages. The spec was provided in Hebrew; many decisions are still open (real login, pricing model, portion sizes, summary delivery channel, data import) — don't assume answers, keep prototype assumptions marked as demo.

## Commands

- Run: `python -m http.server 8765` in this directory, then open `http://localhost:8765/index.html` (diner) and `/admin.html` (admin). Opening via `file://` is blocked in the Chrome automation tool.
- No build, lint or test tooling exists, and Node is not installed. Logic was verified with ad-hoc scripts run in the browser (JS tool) against a cleared `localStorage`.
- After CSS edits do a hard reload (Ctrl+Shift+R); the browser caches `css/styles.css`.

## Architecture

Plain `<script>` tags, no modules — files share globals and **load order matters**: `data.js` → `schedule.js` → `store.js` → page script (`diner.js` / `admin.js`).

- `js/data.js`: categories (`meat`/`hot`/`salad`/`cut`, with `pick: 3` and `cut` fixed), meal types, demo users, and `buildDemoDishes()`. Demo dishes carry `demo: true`; prices and nutrition are placeholders per category.
- `js/schedule.js`: meal rules by weekday (Sun–Thu lunch, Fri dinner only, Sat none) plus admin-defined extra evenings. Dates are local-time ISO strings (`YYYY-MM-DD`), not Israel time.
- `js/store.js`: the only persistence layer (`localStorage`, keys `dr.*`), designed as the single seam to replace with a server. Also holds shared render helpers (`totals`, `fmtPrice`, `esc`, `renderBanner`, `renderUserBar`) and `seedDemoMenus()` (runs once, 8 days of published demo menus).
- `js/diner.js` / `js/admin.js`: page controllers that build UI via string templates + `innerHTML`.

Key invariants:
- A pick is one record per `userId|date|mealType`; saving again replaces it (no double counting). The kitchen summary counts only saved picks, separated by meal.
- Missing price/nutrition is `null`/absent and must render as "לא הוגדר"/"אין נתון" and mark totals as partial — never as 0 (`price: 0` is valid).
- Always run user/admin-entered text through `esc()` before `innerHTML` (banner uses `textContent`).
- Admin gating (`role !== 'admin'`) and the "login" user selector are client-side demo only; real enforcement needs a server.
- The 10:00 daily summary is not automated; the admin "summary" tab is a manual view with no sending.

## Known open issues (from review)

- An empty saved pick still counts as a diner in the summary.
- A saved pick keeps dishes later removed from the menu (diner summary and kitchen counts include them).
- Deactivated dishes remain in already-published menus; demo menus cover only the first 8 days.
