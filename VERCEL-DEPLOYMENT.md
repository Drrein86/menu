# 🚀 פריסה ל-Vercel

## ⚠️ חשוב לדעת!

**Vercel הוא serverless**, מה שאומר:

### ❌ בעיות עם SQLite:

- SQLite **לא יעבוד** ב-Vercel (קבצים נמחקים בכל deployment)
- צריך לעבור למסד נתונים חיצוני

### ✅ פתרונות מומלצים:

#### 1. **Vercel Postgres** (מומלץ! ⭐)

- **חינמי**: 60 שעות compute/חודש
- **משולב**: מובנה בתוך Vercel
- **קל**: Setup אוטומטי

#### 2. **Supabase** (חינמי!)

- **PostgreSQL** מנוהל
- **חינמי**: 500MB database
- **API מובנה**

#### 3. **PlanetScale** (MySQL)

- **חינמי**: 5GB storage
- **MySQL** serverless
- **Schema branching**

---

## 🎯 אני ממליץ: Vercel Postgres

### צעדים:

### 1. **התחבר ל-Vercel**

```bash
# התקן Vercel CLI
npm install -g vercel

# התחבר
vercel login
```

### 2. **צור Postgres Database**

1. לך ל-Vercel Dashboard
2. Storage → Create Database → Postgres
3. העתק את ה-connection string

### 3. **עדכן את הקוד**

צריך להמיר מ-SQLite ל-Postgres:

```bash
# התקן postgres client
cd server
npm install pg
```

**קובץ חדש**: `server/database-postgres.js`

```javascript
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
```

### 4. **Deploy**

```bash
# מהתיקייה הראשית
vercel

# או לייצר production deployment
vercel --prod
```

---

## 📋 רשימת משימות להמרה

- [ ] התקן `pg` במקום `better-sqlite3`
- [ ] המר queries מ-SQLite syntax ל-PostgreSQL
- [ ] צור Postgres database ב-Vercel
- [ ] הגדר environment variables
- [ ] Deploy ל-Vercel

---

## 🔧 אלטרנטיבה פשוטה: Deploy רק ה-Frontend

אם אתה רוצה להתחיל מהר:

### Deploy רק Client + Display

```bash
# Deploy רק את ה-CMS
cd client
vercel

# Deploy רק את התצוגה
cd display
vercel
```

**Backend** - השאר ב-local או deploy ל:

- Railway.app (תומך SQLite!)
- Render.com
- Fly.io

---

## ❓ מה אתה רוצה לעשות?

### אופציה A: המרה ל-Postgres (מלא)

✅ הכל ב-Vercel
✅ Scalable
⏱️ לוקח זמן (המרת DB)

### אופציה B: Frontend ב-Vercel, Backend במקום אחר

✅ מהיר יותר
✅ SQLite עובד
⚠️ צריך 2 services

---

## 💡 המלצה שלי

**לפרויקט שלך** (תפריטים דיגיטליים):

1. **Frontend** → Vercel (CMS + Display)
2. **Backend** → Railway.app (חינמי + תומך SQLite!)

**למה?**

- ✅ פשוט - לא צריך להמיר DB
- ✅ חינמי
- ✅ עובד מיד
- ✅ SQLite ממשיך לעבוד

---

## 🚂 Railway.app Setup (מומלץ!)

```bash
# התקן Railway CLI
npm install -g @railway/cli

# התחבר
railway login

# Deploy backend
cd server
railway init
railway up
```

---

**מה תרצה לעשות? אספר לי ואני אעזור! 🚀**
