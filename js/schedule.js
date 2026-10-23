// חוקי לוח הארוחות: צהריים א'-ה', ערב בשישי, ערב נוסף לפי הגדרת מנהל. שבת: אין הנחה.
function pad(n) { return String(n).padStart(2, '0'); }
function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fromISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }

const DAY_NAMES = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function hebrewDate(iso) { const d = fromISO(iso); return 'יום ' + DAY_NAMES[d.getDay()] + ', ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }

// מחזיר את סוגי הארוחות הקבועים ליום (לפי תאריך), בלי הערבים הנוספים
function baseMeals(iso) {
  const day = fromISO(iso).getDay();
  if (day === 5) return ['dinner'];
  if (day === 6) return [];
  return ['lunch'];
}

// כל הארוחות ליום: קבועות + ערבים נוספים שהוגדרו
function mealsForDate(iso, extraEvenings) {
  const meals = baseMeals(iso);
  if (extraEvenings.includes(iso) && !meals.includes('dinner')) meals.push('dinner');
  return meals;
}
