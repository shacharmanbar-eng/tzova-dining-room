seedDemoMenus();
const user = Store.currentUser();
renderUserBar(document.getElementById('userBar'));
renderBanner(document.getElementById('banner'));

let selDate = null, selType = null, chosen = new Set();

function upcomingDays() {
  const out = [], base = new Date(), extras = Store.extraEvenings();
  for (let i = 0; i < 8; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const iso = toISO(d), meals = mealsForDate(iso, extras);
    if (meals.length) out.push({ iso, meals });
  }
  return out;
}

function showToast(text) {
  const t = document.createElement('div');
  t.id = 'toast'; t.textContent = text; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function renderDays() {
  const days = upcomingDays();
  if (!selDate && days.length) { selDate = days[0].iso; selType = days[0].meals[0]; loadPick(); }
  const box = document.getElementById('days');
  box.innerHTML = days.map(d => '<button data-d="' + d.iso + '" class="' + (d.iso === selDate ? 'on' : '') + '">' + hebrewDate(d.iso).replace(/, .*/, '') + ' ' + d.iso.slice(8) + '.' + d.iso.slice(5, 7) + '</button>').join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    selDate = b.dataset.d;
    const meals = days.find(d => d.iso === selDate).meals;
    selType = meals.includes(selType) ? selType : meals[0];
    loadPick(); renderAll();
  });
  const meals = (days.find(d => d.iso === selDate) || { meals: [] }).meals;
  const mbox = document.getElementById('meals');
  mbox.innerHTML = meals.map(m => '<button data-m="' + m + '" class="' + (m === selType ? 'on' : '') + '">' + MEAL_TYPES[m] + '</button>').join('');
  mbox.querySelectorAll('button').forEach(b => b.onclick = () => { selType = b.dataset.m; loadPick(); renderAll(); });
}

function loadPick() {
  const p = Store.pick(user.id, selDate, selType);
  chosen = new Set(p ? p.dishIds : []);
}

function nutText(d) {
  const parts = METRICS.map(m => {
    const v = d.nutrition && d.nutrition[m.key];
    return m.label + ': ' + (hasNum(v) ? v + m.unit : 'אין נתון');
  });
  return parts.join(' · ');
}

function renderMenu() {
  const box = document.getElementById('menu');
  document.getElementById('mealTitle').textContent = selDate ? hebrewDate(selDate) + ' – ' + MEAL_TYPES[selType] : '';
  const menu = selDate && Store.menu(selDate, selType);
  if (!menu || !menu.published) {
    box.innerHTML = '<div class="card muted">התפריט לארוחה זו טרם פורסם.</div>';
    return;
  }
  const dishes = menu.dishIds.map(id => Store.dishById(id)).filter(Boolean);
  box.innerHTML = CATEGORIES.map(c => {
    const list = dishes.filter(d => d.category === c.key);
    if (!list.length) return '';
    return '<div class="card"><h2>' + c.label + '</h2>' + list.map(d =>
      '<div class="dish"><div><strong>' + esc(d.name) + '</strong>' + (d.demo ? ' <span class="est">הדגמה</span>' : '') +
      '<div class="meta">' + fmtPrice(d.price) + '<br>' + nutText(d) + ' <span class="est">אומדן</span></div></div>' +
      '<button class="' + (chosen.has(d.id) ? 'on' : '') + '" data-id="' + d.id + '">' + (chosen.has(d.id) ? 'הסר' : 'הוסף') + '</button></div>').join('') + '</div>';
  }).join('');
  box.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => {
    chosen.has(b.dataset.id) ? chosen.delete(b.dataset.id) : chosen.add(b.dataset.id);
    renderMenu(); renderSummary();
  });
}

function renderSummary() {
  const box = document.getElementById('summary');
  const menu = selDate && Store.menu(selDate, selType);
  if (!menu || !menu.published) { box.hidden = true; return; }
  box.hidden = false;
  const dishes = [...chosen].map(id => Store.dishById(id)).filter(Boolean);
  const t = totals(dishes);
  const saved = Store.pick(user.id, selDate, selType);
  let html = '<h2>הארוחה שלי (' + dishes.length + ' מנות)</h2>';
  if (!dishes.length) html += '<p class="muted">עדיין לא נבחרו מנות.</p>';
  else {
    html += '<p>מחיר: <strong>' + t.price.toFixed(2) + ' ₪</strong>' + (t.priceMissing ? ' <span class="warn">(חלקי – לחלק מהמנות אין מחיר)</span>' : '') + '</p>';
    html += '<p>' + METRICS.map(m => m.label + ': <strong>' + Math.round(t.nut[m.key]) + m.unit + '</strong>').join(' · ') +
      ' <span class="est">אומדן הדגמה</span>' + (t.nutMissing ? ' <span class="warn">(חלקי – חסרים נתונים)</span>' : '') + '</p>';
  }
  html += '<button class="primary" id="saveBtn">שמירת הארוחה שלי</button>';
  if (saved) html += ' <span class="muted">נשמר ' + new Date(saved.updatedAt).toLocaleTimeString('he-IL') + '</span>';
  box.innerHTML = html;
  document.getElementById('saveBtn').onclick = () => {
    Store.savePick(user.id, selDate, selType, [...chosen]);
    showToast('הבחירה נשמרה'); renderSummary();
  };
}

function renderAll() { renderDays(); renderMenu(); renderSummary(); }
renderAll();
