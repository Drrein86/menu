# 🔧 הגדרת Environment Variables

## 📋 מה צריך להגדיר?

בשביל ש-Frontend יתחבר ל-Backend, צריך להגדיר את ה-**Railway URL** ב-Vercel.

---

## 🚂 שלב 1: קבל את ה-Railway URL

### אחרי ש-deploy Backend ל-Railway:

```bash
# בדוק את ה-status
railway status

# או
railway open
```

**או** לך ל-Railway Dashboard:
- Settings → Domains
- העתק את ה-URL המלא

**דוגמה:**
```
https://menu-backend-production-xxxx.up.railway.app
```

**❗ שמור את ה-URL הזה!**

---

## 🌐 שלב 2: הגדר ב-Vercel (CMS)

### 2.1 לך ל-Vercel Dashboard

1. פתח: [vercel.com/dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט **menu-cms** (או השם שנתת לו)
3. לחץ על **Settings** (למעלה)
4. בחר **Environment Variables** (מהתפריט משמאל)

### 2.2 הוסף את המשתנה

לחץ על **Add New**:

```
Name:  VITE_API_URL
Value: https://your-railway-app.up.railway.app
```

**⚠️ חשוב:**
- **ללא** `/` בסוף
- **כולל** `https://`
- **בלי** `/api` בסוף

### 2.3 שמור ו-Redeploy

1. לחץ **Save**
2. לך ל-**Deployments**
3. לחץ על `...` ליד ה-deployment האחרון
4. בחר **Redeploy**

---

## 📺 שלב 3: הגדר ב-Vercel (Display)

**חזור על אותו תהליך** עבור הפרויקט **menu-display**:

1. בחר את הפרויקט **menu-display**
2. Settings → Environment Variables
3. הוסף:
   ```
   Name:  VITE_API_URL
   Value: https://your-railway-app.up.railway.app
   ```
4. שמור ו-Redeploy

---

## ✅ בדיקה

### בדוק את ה-Backend:
```
https://your-railway-app.up.railway.app/api/health
```

אמור להחזיר:
```json
{
  "status": "ok",
  "mode": "SQLite Database",
  "database": "menu.db"
}
```

### בדוק את ה-CMS:
1. פתח את ה-CMS URL
2. נסה להתחבר עם `admin` / `admin123`
3. אם עובד - מעולה! ✅

### בדוק את ה-Display:
1. פתח: `https://your-display-url.vercel.app/demo-screen-001`
2. אמור להראות את תפריט הסביח
3. אם עובד - מעולה! ✅

---

## 🔍 פתרון בעיות

### ❌ "Network Error" / "Cannot connect"

**גורם אפשרי 1: CORS**

ב-`server/server-sqlite.js`, ודא ש-CORS מוגדר נכון:

```javascript
app.use(cors({
  origin: [
    'https://your-cms.vercel.app',
    'https://your-display.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
```

**גורם אפשרי 2: URL שגוי**

- ודא שה-URL **כולל** `https://`
- ודא שה-URL **ללא** `/` בסוף
- ודא שה-URL **ללא** `/api` בסוף

**גורם אפשרי 3: Environment Variable לא הוגדר**

- בדוק ש-`VITE_API_URL` מוגדר ב-Vercel
- עשה **Redeploy** אחרי שינוי Environment Variables

---

## 💡 טיפ: בדיקה מקומית

אם רוצה לבדוק עם ה-Railway URL ב-local:

צור קובץ `.env.local` ב-`client/` ו-`display/`:

```env
VITE_API_URL=https://your-railway-app.up.railway.app
```

הרץ:
```bash
npm run dev
```

**זה יאפשר לך לבדוק את החיבור לפני ה-deployment!**

---

## 📊 סיכום

| מה                   | היכן להגדיר           | ערך                                       |
|----------------------|-----------------------|-------------------------------------------|
| **Backend API**      | Railway               | אוטומטי (מקבל URL)                        |
| **CMS Environment**  | Vercel (menu-cms)     | `VITE_API_URL=https://railway-url`       |
| **Display Env**      | Vercel (menu-display) | `VITE_API_URL=https://railway-url`       |
| **CORS**             | server-sqlite.js      | רשימת URLs של Vercel                     |

---

**סיימת? מעולה! עכשיו תבדוק שהכל עובד! 🎉**

