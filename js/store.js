// שכבת נתונים על localStorage. ממשק יחיד שניתן להחליף בשרת בשלב הבא.
const KEYS = { dishes: 'dr.dishes', menus: 'dr.menus', picks: 'dr.picks', messages: 'dr.messages', extras: 'dr.extraEvenings', user: 'dr.user' };

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* אחסון חסום – המצב יישמר לסשן בלבד */ }
}

const Store = {
  dishes() {
    let d = read(KEYS.dishes, null);
    if (!d) { d = buildDemoDishes(); write(KEYS.dishes, d); }
    return d;
  },
  saveDishes(list) { write(KEYS.dishes, list); },
  dishById(id) { return this.dishes().find(d => d.id === id); },

  menuKey(date, type) { return date + '|' + type; },
  menu(date, type) { return read(KEYS.menus, {})[this.menuKey(date, type)] || null; },
  setMenu(date, type, dishIds, published) {
    const all = read(KEYS.menus, {});
    all[this.menuKey(date, type)] = { dishIds, published };
    write(KEYS.menus, all);
  },

  extraEvenings() { return read(KEYS.extras, []); },
  addExtraEvening(iso) {
    const e = this.extraEvenings();
    if (!e.includes(iso)) { e.push(iso); write(KEYS.extras, e); }
  },
  removeExtraEvening(iso) { write(KEYS.extras, this.extraEvenings().filter(x => x !== iso)); },

  // בחירה אישית: רשומה אחת לכל משתמש+תאריך+ארוחה (שמירה חוזרת מחליפה)
  pickKey(userId, date, type) { return userId + '|' + date + '|' + type; },
  pick(userId, date, type) { return read(KEYS.picks, {})[this.pickKey(userId, date, type)] || null; },
  savePick(userId, date, type, dishIds) {
    const all = read(KEYS.picks, {});
    const k = this.pickKey(userId, date, type);
    all[k] = { userId, date, type, dishIds, savedAt: all[k] ? all[k].savedAt : new Date().toISOString(), updatedAt: new Date().toISOString() };
    write(KEYS.picks, all);
  },
  // רק בחירות שנשמרו במפורש ושייכות לארוחה המבוקשת
  picksFor(date, type) {
    return Object.values(read(KEYS.picks, {})).filter(p => p.date === date && p.type === type);
  },

  messages() {
    let m = read(KEYS.messages, null);
    if (!m) {
      m = [
        { id: 'm1', text: 'ברוכים הבאים לאתר חדר האוכל (הודעת הדגמה)', active: true, from: '', to: '' },
        { id: 'm2', text: 'עומס צפוי בצהריים – קבוצה של 40 אורחים (הודעת הדגמה)', active: true, from: '', to: '' },
      ];
      write(KEYS.messages, m);
    }
    return m;
  },
  saveMessages(list) { write(KEYS.messages, list); },
  activeMessages(todayISO) {
    return this.messages().filter(m => m.active && (!m.from || m.from <= todayISO) && (!m.to || m.to >= todayISO));
  },

  currentUser() {
    const id = read(KEYS.user, null);
    return DEMO_USERS.find(u => u.id === id) || DEMO_USERS[0];
  },
  setUser(id) { write(KEYS.user, id); },
};

// ----- עזרים משותפים לתצוגה -----
const METRICS = [
  { key: 'kcal', label: 'קלוריות', unit: '' },
  { key: 'protein', label: 'חלבון', unit: ' ג׳' },
  { key: 'carbs', label: 'פחמימות', unit: ' ג׳' },
  { key: 'fat', label: 'שומן', unit: ' ג׳' },
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const hasNum = v => typeof v === 'number' && !isNaN(v);
function fmtPrice(p) { return hasNum(p) ? p.toFixed(2) + ' ₪' : 'מחיר לא הוגדר'; }

// סכום מחיר/תזונה; נתון חסר אינו נספר כאפס אלא מסומן כחלקי
function totals(dishes) {
  const t = { price: 0, priceMissing: false, nut: {}, nutMissing: false };
  METRICS.forEach(m => t.nut[m.key] = 0);
  dishes.forEach(d => {
    if (hasNum(d.price)) t.price += d.price; else t.priceMissing = true;
    METRICS.forEach(m => {
      const v = d.nutrition && d.nutrition[m.key];
      if (hasNum(v)) t.nut[m.key] += v; else t.nutMissing = true;
    });
  });
  return t;
}

function renderUserBar(el, requireRole) {
  const u = Store.currentUser();
  el.innerHTML = '<label>משתמש (הדגמה): <select id="userSel">' +
    DEMO_USERS.map(x => '<option value="' + x.id + '"' + (x.id === u.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') +
    '</select></label>';
  el.querySelector('select').addEventListener('change', e => { Store.setUser(e.target.value); location.reload(); });
}

// תפריטי הדגמה לימים הקרובים, רק בהפעלה ראשונה (כדי שהאב-טיפוס לא יהיה ריק)
function seedDemoMenus() {
  if (localStorage.getItem(KEYS.menus)) return;
  const dishes = Store.dishes(), base = new Date();
  for (let i = 0; i < 8; i++) {
    const iso = toISO(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
    mealsForDate(iso, []).forEach(type => {
      const ids = [];
      ['meat', 'hot', 'salad'].forEach(cat => {
        const list = dishes.filter(d => d.category === cat);
        for (let k = 0; k < 3; k++) ids.push(list[(i * 3 + k) % list.length].id);
      });
      dishes.filter(d => d.category === 'cut').forEach(d => ids.push(d.id));
      Store.setMenu(iso, type, ids, true);
    });
  }
}

function renderBanner(el) {
  const msgs = Store.activeMessages(toISO(new Date()));
  if (!msgs.length) { el.hidden = true; return; }
  el.hidden = false;
  let i = 0;
  const show = () => { el.textContent = msgs[i % msgs.length].text; i++; };
  show();
  if (msgs.length > 1) setInterval(show, 5000);
}
