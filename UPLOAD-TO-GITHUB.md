# 🚀 איך להעלות ל-GitHub

## שלב 1: צור Repository ב-GitHub

1. **היכנס ל-GitHub**: https://github.com
2. **לחץ על "+** (למעלה מימין) → **New repository**
3. **מלא פרטים**:
   - Repository name: `menu-display-system` (או כל שם שתרצה)
   - Description: `מערכת תצוגת תפריט דיגיטלי עם CMS`
   - **Public** או **Private** (לפי בחירתך)
   - **אל תסמן** "Initialize with README" (כבר יש לנו!)
4. **לחץ Create repository**

---

## שלב 2: העלה את הקוד

אחרי יצירת ה-repository, GitHub יראה לך הוראות.

**העתק את ה-URL** של ה-repository (משהו כמו):

```
https://github.com/YOUR-USERNAME/menu-display-system.git
```

**הרץ את הפקודות הבאות**:

```bash
# קישור ל-GitHub repository (החלף ב-URL שלך!)
git remote add origin https://github.com/YOUR-USERNAME/menu-display-system.git

# דחיפה ל-GitHub
git push -u origin main
```

---

## ✅ זהו! הקוד שלך ב-GitHub!

הפרויקט שלך עכשיו זמין ב:

```
https://github.com/YOUR-USERNAME/menu-display-system
```

---

## 📝 עדכונים עתידיים

כשתעשה שינויים בקוד:

```bash
# שמור את השינויים
git add .
git commit -m "תיאור השינויים"

# דחוף ל-GitHub
git push
```

---

## 🔐 אם אתה מתבקש להתחבר

GitHub עשוי לבקש ממך authentication:

### אופציה 1: GitHub CLI (מומלץ)

```bash
# התקן GitHub CLI
winget install GitHub.cli

# התחבר
gh auth login
```

### אופציה 2: Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. בחר `repo` scope
4. העתק את ה-token
5. השתמש ב-token במקום סיסמה

---

## 📂 מה עולה ל-GitHub?

✅ **כל קוד המקור**
✅ **קבצי תצורה**
✅ **README ותיעוד**

❌ **לא עולה**:

- `node_modules/` (תלויות - יתקינו מחדש)
- `menu.db` (מסד נתונים - יוצר מחדש)
- `server/uploads/*` (תמונות - לא בגיבוי)
- `.env` (קבצי סביבה רגישים)

---

## 🎯 טיפים

1. **שמור סודות**: אל תעלה סיסמאות או מפתחות API
2. **גיבוי תמונות**: שמור את `server/uploads/` בנפרד
3. **גיבוי DB**: שמור את `server/menu.db` בנפרד
4. **קבצי .env**: לעולם לא להעלות!

---

## 🔄 Clone הפרויקט במחשב אחר

```bash
# שכפול
git clone https://github.com/YOUR-USERNAME/menu-display-system.git
cd menu-display-system

# התקנה
npm run setup

# יצירת DB
cd server
npm run setup-sqlite
cd ..

# הפעלה
npm run dev-sqlite
```

---

**מזל טוב! הפרויקט שלך עכשיו ב-GitHub! 🎉**
