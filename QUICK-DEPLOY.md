# ⚡ Quick Deploy - מדריך מהיר

## 🎯 3 פקודות בלבד!

### 1️⃣ Deploy Backend (Railway)
```bash
npm install -g @railway/cli
railway login
cd server
railway init
railway up
railway run node setup-sqlite.js
```

**➡️ שמור את ה-URL: `https://menu-backend-xxx.up.railway.app`**

---

### 2️⃣ Deploy CMS (Vercel)
```bash
npm install -g vercel
vercel login
cd client
vercel --prod
```

**➡️ הגדר ב-Vercel Dashboard:**
- Environment Variable: `VITE_API_URL` = Railway URL

---

### 3️⃣ Deploy Display (Vercel)
```bash
cd display
vercel --prod
```

**➡️ הגדר ב-Vercel Dashboard:**
- Environment Variable: `VITE_API_URL` = Railway URL

---

## ✅ זהו! אתר live!

- 🎨 CMS: `https://menu-cms.vercel.app`
- 📺 Display: `https://menu-display.vercel.app`
- 👤 כניסה: `admin` / `admin123`

---

## 🔧 לא עובד?

קרא את `DEPLOYMENT-GUIDE.md` למדריך המלא!

