seedDemoMenus();
renderUserBar(document.getElementById('userBar'));
if (Store.currentUser().role !== 'admin') {
  document.getElementById('denied').hidden = false;
} else {
  document.getElementById('app').hidden = false;
  const TABS = { dishes: 'מאגר מנות', menus: 'תפריטים', messages: 'הודעות', summary: 'סיכום ביקוש' };
  let tab = 'dishes';
  const panel = document.getElementById('panel');
  const catLabel = k => CATEGORIES.find(c => c.key === k).label;
  const $ = id => document.getElementById(id);
  const num = v => (v === '' || v == null) ? null : Number(v);

  function renderTabs() {
    $('tabs').innerHTML = Object.entries(TABS).map(([k, l]) => '<button data-t="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + l + '</button>').join('');
    $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
  }

  function dishesTab() {
    const list = Store.dishes();
    panel.innerHTML = '<div class="card"><h2>הוספת מנה</h2><div class="row">' +
      '<input id="nName" placeholder="שם המנה"><select id="nCat">' + CATEGORIES.map(c => '<option value="' + c.key + '">' + c.label + '</option>').join('') + '</select>' +
      '<input id="nPrice" type="number" min="0" step="0.5" placeholder="מחיר (ריק = לא הוגדר)"><button class="primary" id="addDish">הוספה</button></div></div>' +
      '<div class="card"><h2>המאגר (' + list.length + ')</h2><table><tr><th>שם</th><th>קטגוריה</th><th>מחיר</th><th>פעילה</th></tr>' +
      list.map(d => '<tr><td>' + esc(d.name) + (d.demo ? ' <span class="est">הדגמה</span>' : '') + '</td><td>' + catLabel(d.category) +
        '</td><td><input type="number" min="0" step="0.5" data-p="' + d.id + '" value="' + (hasNum(d.price) ? d.price : '') + '" placeholder="לא הוגדר" style="width:90px"></td>' +
        '<td><input type="checkbox" data-a="' + d.id + '"' + (d.active ? ' checked' : '') + '></td></tr>').join('') + '</table></div>';
    $('addDish').onclick = () => {
      const name = $('nName').value.trim();
      if (!name) return;
      list.push({ id: 'x' + Date.now(), name, category: $('nCat').value, active: true, demo: false, price: num($('nPrice').value), nutrition: {}, nutritionSource: '' });
      Store.saveDishes(list); render();
    };
    panel.querySelectorAll('[data-p]').forEach(i => i.onchange = () => { list.find(d => d.id === i.dataset.p).price = num(i.value); Store.saveDishes(list); });
    panel.querySelectorAll('[data-a]').forEach(i => i.onchange = () => { list.find(d => d.id === i.dataset.a).active = i.checked; Store.saveDishes(list); });
  }

  let mDate = toISO(new Date()), mType = null;
  function menusTab() {
    const meals = mealsForDate(mDate, Store.extraEvenings());
    if (!meals.includes(mType)) mType = meals[0] || null;
    const menu = mType ? Store.menu(mDate, mType) : null;
    const cur = new Set(menu ? menu.dishIds : []);
    const dishes = Store.dishes().filter(d => d.active);
    let html = '<div class="card"><div class="row"><label>תאריך <input type="date" id="mDate" value="' + mDate + '"></label>' +
      meals.map(m => '<button data-m="' + m + '" class="' + (m === mType ? 'on' : '') + '">' + MEAL_TYPES[m] + '</button>').join('') + '</div>';
    html += meals.length ? '' : '<p class="muted">אין ארוחה מוגדרת בתאריך זה.</p>';
    html += '<div class="row"><button id="addEvening" class="small">הגדר ערב נוסף בתאריך זה</button>' +
      (Store.extraEvenings().includes(mDate) ? '<button id="rmEvening" class="small">בטל ערב נוסף</button>' : '') + '</div></div>';
    if (mType) {
      html += CATEGORIES.map(c => {
        const items = dishes.filter(d => d.category === c.key);
        return '<div class="card"><h2>' + c.label + (c.fixed ? ' (קבוע)' : ' – לבחירה: ' + c.pick + ' <span class="muted" id="cnt-' + c.key + '"></span>') + '</h2><div class="row">' +
          items.map(d => '<label><input type="checkbox" data-d="' + d.id + '" data-c="' + c.key + '"' + (cur.has(d.id) ? ' checked' : '') + '> ' + esc(d.name) + '</label>').join(' ') + '</div></div>';
      }).join('');
      html += '<div class="card"><p id="menuWarn" class="warn"></p><button class="primary" id="saveMenu">פרסום התפריט</button> <button id="draftMenu">שמירה כטיוטה</button>' +
        (menu ? ' <span class="muted">מצב: ' + (menu.published ? 'פורסם' : 'טיוטה') + '</span>' : '') + '</div>';
    }
    panel.innerHTML = html;
    $('mDate').onchange = e => { mDate = e.target.value; render(); };
    panel.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mType = b.dataset.m; render(); });
    $('addEvening').onclick = () => { Store.addExtraEvening(mDate); mType = 'dinner'; render(); };
    if ($('rmEvening')) $('rmEvening').onclick = () => { Store.removeExtraEvening(mDate); render(); };
    if (!mType) return;
    const boxes = [...panel.querySelectorAll('[data-d]')];
    const validate = () => {
      const warns = [];
      CATEGORIES.filter(c => !c.fixed).forEach(c => {
        const n = boxes.filter(b => b.dataset.c === c.key && b.checked).length;
        $('cnt-' + c.key).textContent = '(נבחרו ' + n + ')';
        if (n !== c.pick) warns.push(c.label + ': נבחרו ' + n + ' מתוך ' + c.pick);
      });
      $('menuWarn').textContent = warns.length ? 'שימו לב – ' + warns.join('; ') : '';
    };
    boxes.forEach(b => b.onchange = validate); validate();
    const save = published => {
      const ids = boxes.filter(b => b.checked).map(b => b.dataset.d);
      dishes.filter(d => d.category === 'cut').forEach(d => { if (!ids.includes(d.id)) ids.push(d.id); }); // ירקות חתוכים תמיד זמינים
      Store.setMenu(mDate, mType, ids, published); render();
    };
    $('saveMenu').onclick = () => save(true);
    $('draftMenu').onclick = () => save(false);
  }

  function messagesTab() {
    const list = Store.messages();
    panel.innerHTML = '<div class="card"><h2>הודעה חדשה</h2><div class="row"><input id="tText" placeholder="תוכן ההודעה" style="flex:1;min-width:200px">' +
      '<label>מתאריך <input type="date" id="tFrom"></label><label>עד תאריך <input type="date" id="tTo"></label><button class="primary" id="addMsg">הוספה</button></div></div>' +
      '<div class="card"><h2>הודעות</h2><table>' + list.map(m => '<tr><td>' + esc(m.text) + '</td><td class="muted">' + (m.from || '—') + ' עד ' + (m.to || '—') + '</td>' +
        '<td><label><input type="checkbox" data-a="' + m.id + '"' + (m.active ? ' checked' : '') + '> פעילה</label></td><td><button class="small" data-x="' + m.id + '">מחיקה</button></td></tr>').join('') + '</table></div>';
    $('addMsg').onclick = () => {
      const text = $('tText').value.trim();
      if (!text) return;
      list.push({ id: 'm' + Date.now(), text, active: true, from: $('tFrom').value, to: $('tTo').value });
      Store.saveMessages(list); render();
    };
    panel.querySelectorAll('[data-a]').forEach(i => i.onchange = () => { list.find(m => m.id === i.dataset.a).active = i.checked; Store.saveMessages(list); });
    panel.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { Store.saveMessages(list.filter(m => m.id !== b.dataset.x)); render(); });
  }

  let sDate = toISO(new Date()), sType = null;
  function summaryTab() {
    const meals = mealsForDate(sDate, Store.extraEvenings());
    if (!meals.includes(sType)) sType = meals[0] || null;
    let html = '<div class="card"><div class="row"><label>תאריך <input type="date" id="sDate" value="' + sDate + '"></label>' +
      meals.map(m => '<button data-m="' + m + '" class="' + (m === sType ? 'on' : '') + '">' + MEAL_TYPES[m] + '</button>').join('') + '</div>' +
      '<p class="muted">הסיכום הרשמי אמור להיווצר ולהישלח אוטומטית בכל יום ב־10:00 (שעון ישראל). באב-טיפוס זה התצוגה ידנית, ללא שליחה.</p></div>';
    if (sType) {
      const picks = Store.picksFor(sDate, sType), counts = {};
      picks.forEach(p => p.dishIds.forEach(id => counts[id] = (counts[id] || 0) + 1));
      html += '<div class="card"><h2>' + hebrewDate(sDate) + ' – ' + MEAL_TYPES[sType] + '</h2><p>סועדים ששמרו בחירה: <strong>' + picks.length + '</strong></p>' +
        (picks.length ? '<table><tr><th>מנה</th><th>קטגוריה</th><th>סועדים</th></tr>' + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => {
          const d = Store.dishById(id);
          return '<tr><td>' + esc(d ? d.name : id) + '</td><td>' + (d ? catLabel(d.category) : '') + '</td><td>' + n + '</td></tr>';
        }).join('') + '</table>' : '<p class="muted">אין עדיין בחירות שמורות.</p>') + '</div>';
    }
    panel.innerHTML = html;
    $('sDate').onchange = e => { sDate = e.target.value; render(); };
    panel.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { sType = b.dataset.m; render(); });
  }

  function render() {
    renderTabs();
    ({ dishes: dishesTab, menus: menusTab, messages: messagesTab, summary: summaryTab })[tab]();
  }
  render();
}
