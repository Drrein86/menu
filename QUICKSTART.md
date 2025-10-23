# 🚀 התחלה מהירה - Quick Start

## שלב 1: התקן את כל התלויות (MUST DO!)

פתח PowerShell או CMD בתיקיית הפרויקט והרץ:

```bash
npm run setup
```

זה יתקין את כל התלויות ב-3 התיקיות (server, client, display).

**⏱ זה לוקח 2-3 דקות - המתן בסבלנות!**

---

## שלב 2: הקם את MySQL

### אם MySQL לא מותקן:

1. הורד MySQL Community Server מכאן: https://dev.mysql.com/downloads/mysql/
2. התקן עם ההגדרות הבסיסיות
3. זכור את הסיסמה של root!

### בדוק ש-MySQL רץ:

```powershell
# Windows PowerShell
Get-Service MySQL*

# אם לא רץ:
net start MySQL80
```

---

## שלב 3: צור את מסד הנתונים

```bash
cd server
npm run setup-db
```

אם זה נכשל, עשה את זה ידנית:

1. פתח MySQL:

```bash
mysql -u root -p
# הכנס את הסיסמה שלך
```

2. הרץ:

```sql
CREATE DATABASE menu_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

3. אז הרץ שוב:

```bash
npm run setup-db
```

---

## שלב 4: ערוך את קובץ .env

פתח את `server/.env` ושנה:

```env
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
```

אם אין סיסמה, השאר ריק:

```env
DB_PASSWORD=
```

---

## שלב 5: הרץ את המערכת!

חזור לתיקיית הראשית:

```bash
cd ..
npm run dev
```

אתה אמור לראות:

```
╔════════════════════════════════════════╗
║   🎬 Menu Display System Server       ║
║   Port: 5000                          ║
╚════════════════════════════════════════╝

✅ Connected to MySQL database successfully

VITE ready in xxx ms
➜  Local:   http://localhost:3000/
➜  Local:   http://localhost:3001/
```

---

## שלב 6: פתח את הדפדפן

גש ל: **http://localhost:3000**

התחבר עם:

- שם משתמש: `admin`
- סיסמה: `admin123`

---

## ❌ פתרון בעיות

### שגיאה: "Cannot find module"

```bash
npm run setup
```

### שגיאה: "ECONNREFUSED" / "Cannot connect to database"

1. ודא ש-MySQL רץ: `Get-Service MySQL*`
2. בדוק סיסמה ב-`server/.env`
3. הרץ: `cd server && npm run setup-db`

### שגיאה: "Port 5000 already in use"

שנה ב-`server/.env`:

```env
PORT=5001
```

### המערכת לא נטענת

1. סגור הכל (Ctrl+C)
2. הרץ שוב: `npm run dev`
3. המתן 10 שניות
4. רענן דפדפן (F5)

---

## ✅ כל הפקודות ברצף (העתק והדבק)

```bash
# בתיקיית הפרויקט:
npm run setup
cd server
npm run setup-db
cd ..
npm run dev
```

ואז פתח בדפדפן: **http://localhost:3000**

---

**זקוק לעזרה? קרא את README.md או INSTALLATION.md**
