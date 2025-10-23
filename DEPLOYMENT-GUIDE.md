# 🚀 מדריך Deploy מלא - Vercel + Railway

## 📋 מה אנחנו עושים:

```
┌─────────────────────────────────────────┐
│  Frontend (CMS + Display) → Vercel      │
│  Backend (API + DB)      → Railway      │
└─────────────────────────────────────────┘
```

---

## 🎯 שלב 1: Deploy Backend ל-Railway

### 1.1 התקן Railway CLI

```bash
npm install -g @railway/cli
```

### 1.2 התחבר ל-Railway

```bash
railway login
```

זה יפתח דפדפן - התחבר עם GitHub.

### 1.3 Deploy Backend

```bash
# עבור לתיקיית server
cd server

# אתחל Railway project
railway init

# בחר: "Create new project"
# תן לו שם: menu-backend

# Deploy!
railway up

# קבל את ה-URL של השרת
railway status
```

### 1.4 הגדר Environment Variables

```bash
# הגדר JWT Secret (חשוב!)
railway variables set JWT_SECRET=your-super-secret-jwt-key-$(openssl rand -hex 32)

# הגדר PORT
railway variables set PORT=5000

# הגדר NODE_ENV
railway variables set NODE_ENV=production
```

### 1.5 אתחל את המסד נתונים

```bash
# הרץ את ה-setup script
railway run node setup-sqlite.js
```

### 1.6 שמור את ה-URL

Railway ייתן לך URL כמו: `https://menu-backend-production-xxxx.up.railway.app`

**שמור את ה-URL הזה! תצטרך אותו בשלב הבא.**

---

## 🌐 שלב 2: Deploy Frontend ל-Vercel

### 2.1 התקן Vercel CLI

```bash
npm install -g vercel
```

### 2.2 התחבר ל-Vercel

```bash
vercel login
```

### 2.3 עדכן את ה-API URLs

לפני ה-deployment, צריך לעדכן את ה-URLs לשרת Railway:

#### עבור CMS (client):

ערוך את `client/src/api/index.js`:

```javascript
// מצא את השורה:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// שנה ל:
const API_URL = import.meta.env.VITE_API_URL || 'https://YOUR-RAILWAY-URL.up.railway.app';
```

#### עבור Display:

ערוך את `display/src/main.jsx` או `display/vite.config.js`:

```javascript
// ב-vite.config.js מצא:
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    
// שנה ל:
proxy: {
  '/api': {
    target: 'https://YOUR-RAILWAY-URL.up.railway.app',
```

### 2.4 Deploy CMS

```bash
cd client

# Deploy ל-Vercel
vercel

# בחר:
# - Set up and deploy? Yes
# - Project name: menu-cms
# - Directory: ./
# - Override build command? No
# - Override output directory? No

# לאחר ה-deployment הראשון, deploy לproduction:
vercel --prod
```

שמור את ה-URL: `https://menu-cms.vercel.app`

### 2.5 Deploy Display

```bash
cd display

# Deploy ל-Vercel
vercel

# בחר:
# - Set up and deploy? Yes
# - Project name: menu-display
# - Directory: ./
# - Override build command? No
# - Override output directory? No

# Deploy לproduction:
vercel --prod
```

שמור את ה-URL: `https://menu-display.vercel.app`

---

## 🔗 שלב 3: חיבור הכל

### 3.1 הגדר Environment Variables ב-Vercel

#### עבור CMS (client):

1. לך ל-Vercel Dashboard → menu-cms → Settings → Environment Variables
2. הוסף:
   - `VITE_API_URL` = `https://YOUR-RAILWAY-URL.up.railway.app`

#### עבור Display:

1. לך ל-Vercel Dashboard → menu-display → Settings → Environment Variables
2. הוסף:
   - `VITE_API_URL` = `https://YOUR-RAILWAY-URL.up.railway.app`

### 3.2 עדכן CORS ב-Backend

ערוך את `server/server-sqlite.js`:

```javascript
// מצא את:
app.use(cors());

// שנה ל:
app.use(cors({
  origin: [
    'https://menu-cms.vercel.app',
    'https://menu-display.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
```

### 3.3 Commit ו-Push השינויים

```bash
# מהתיקייה הראשית
git add .
git commit -m "Update URLs for production deployment"
git push origin main

# Deploy שוב את ה-backend
cd server
railway up
```

### 3.4 Redeploy Frontend

```bash
# Redeploy CMS
cd client
vercel --prod

# Redeploy Display
cd display
vercel --prod
```

---

## ✅ שלב 4: בדיקה

### Backend:
```
https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

אמור להחזיר: `{"status":"ok","mode":"SQLite Database"}`

### CMS:
```
https://menu-cms.vercel.app
```

התחבר עם: `admin` / `admin123`

### Display:
```
https://menu-display.vercel.app/demo-screen-001
```

אמור להראות את תפריט הסביח!

---

## 🎉 סיימנו!

### ה-URLs שלך:

- 🎨 **CMS (ניהול)**: `https://menu-cms.vercel.app`
- 📺 **Display (תצוגה)**: `https://menu-display.vercel.app`
- 🔧 **Backend (API)**: `https://YOUR-RAILWAY-URL.up.railway.app`

### כניסה ראשונית:
- **משתמש**: `admin`
- **סיסמה**: `admin123`

**⚠️ חשוב**: שנה את הסיסמה מייד לאחר הכניסה הראשונה!

---

## 🔄 עדכונים עתידיים

### עדכון Backend:
```bash
cd server
git push origin main
railway up
```

### עדכון Frontend:
```bash
cd client  # או display
git push origin main
vercel --prod
```

---

## 🆘 פתרון בעיות

### Backend לא עובד?
```bash
# בדוק logs
railway logs

# רענן את המסד נתונים
railway run node setup-sqlite.js
```

### Frontend לא מתחבר ל-Backend?
1. בדוק ש-CORS מוגדר נכון
2. בדוק ש-Environment Variables מוגדרים ב-Vercel
3. בדוק את הקונסול לשגיאות

### CORS Errors?
ודא ש-ה-URLs ב-`server-sqlite.js` תואמים ל-URLs ב-Vercel.

---

## 💰 עלויות

### Railway (Backend):
- ✅ **Free Tier**: $5 credit/חודש (מספיק לפרויקט קטן)
- 💳 אם נגמר: $0.000231/GB-hour

### Vercel (Frontend):
- ✅ **Free Tier**: Unlimited for personal use
- ✅ Bandwidth: 100GB/חודש
- ✅ Build time: 100 שעות/חודש

**לפרויקט שלך**: כנראה יישאר חינמי לגמרי! 🎉

---

**צריך עזרה? שאל אותי! 🚀**

