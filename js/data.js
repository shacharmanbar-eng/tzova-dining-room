// נתוני הדגמה בלבד – לא רשימת מנות מאומתת של חדר האוכל בצובה.
// מחירים וערכים תזונתיים הם הדגמה, ויש להחליפם בנתוני חדר האוכל לפני שימוש תפעולי.
const CATEGORIES = [
  { key: 'meat',  label: 'מנות בשריות', pick: 3 },
  { key: 'hot',   label: 'ירק חם',      pick: 3 },
  { key: 'salad', label: 'סלטים',       pick: 3 },
  { key: 'cut',   label: 'ירקות חתוכים', pick: 0, fixed: true },
];

const MEAL_TYPES = { lunch: 'ארוחת צהריים', dinner: 'ארוחת ערב' };

const DEMO_USERS = [
  { id: 'u1', name: 'דנה (סועדת)', role: 'diner' },
  { id: 'u2', name: 'יוסי (סועד)', role: 'diner' },
  { id: 'u3', name: 'מיכל (סועדת)', role: 'diner' },
  { id: 'admin', name: 'מנהל חדר האוכל', role: 'admin' },
];

// מחיר ותזונה לדוגמה לפי קטגוריה (אומדן הדגמה, למנה סטנדרטית לא מוגדרת)
const DEMO_DEFAULTS = {
  meat:  { price: 18, nutrition: { kcal: 250, protein: 25, carbs: 8,  fat: 13 } },
  hot:   { price: 6,  nutrition: { kcal: 60,  protein: 3,  carbs: 9,  fat: 2  } },
  salad: { price: 5,  nutrition: { kcal: 70,  protein: 2,  carbs: 8,  fat: 4  } },
  cut:   { price: 4,  nutrition: { kcal: 30,  protein: 1,  carbs: 6,  fat: 0  } },
};

const DEMO_NAMES = {
  meat: ['שניצל עוף','עוף בתנור','חזה עוף בגריל','פרגיות בגריל','קציצות בקר ברוטב עגבניות','קציצות עוף ברוטב','צלי בקר','גולאש בקר','שווארמה הודו','חזה הודו צלוי','קבב בקר','ממולאים בבשר ואורז','רצועות בקר מוקפצות','שוקי עוף ברוטב','קציצות הודו ברוטב'],
  hot: ['שעועית ירוקה מאודה','ברוקולי מאודה','כרובית אפויה','קישואים בתנור','גזר מאודה','אפונה מבושלת','כרוב מאודה','דלעת בתנור','חצילים אפויים','במיה ברוטב עגבניות','תרד מוקפץ','לקט ירקות מאודה','כרוב ניצנים בתנור','מנגולד מאודה','שומר אפוי'],
  salad: ['סלט כרוב לבן','סלט כרוב סגול','סלט גזר','סלט סלק','סלט חצילים בטחינה','סלט חצילים קלויים','סלט טאבולה','סלט עדשים','סלט חומוס וירקות','סלט שעועית לבנה','סלט תירס','סלט תפוחי אדמה','סלט מלפפונים בשמיר','סלט עגבניות ועשבי תיבול','סלט פלפלים קלויים'],
  cut: ['מלפפון חתוך','עגבנייה חתוכה','פלפל חתוך','גזר חתוך'],
};

function buildDemoDishes() {
  const dishes = [];
  for (const [cat, names] of Object.entries(DEMO_NAMES)) {
    names.forEach((name, i) => {
      const d = DEMO_DEFAULTS[cat];
      dishes.push({
        id: cat + (i + 1), name, category: cat, active: true, demo: true,
        price: d.price,
        nutrition: { ...d.nutrition },
        nutritionSource: 'אומדן הדגמה בלבד (ערך כללי לקטגוריה, לא מקור אמיתי)',
      });
    });
  }
  return dishes;
}
