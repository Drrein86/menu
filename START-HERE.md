# ⚡ התחל כאן - START HERE!

## 🔴 הבעיה שזיהיתי:

1. ❌ לא הותקנו תלויות (node_modules)
2. ❌ חסר קובץ `.env` בתיקיית server
3. ❌ מסד נתונים לא הוקם

---

## ✅ הפתרון - עשה את זה עכשיו!

### צעד 1: צור קובץ .env

**צור קובץ חדש בשם `.env` בתיקיית `server`**

ב-Windows:

1. פתח Notepad
2. העתק את התוכן הזה:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=menu_system
JWT_SECRET=my-secret-key-change-this-later-12345678
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

3. שמור בשם: `C:\Users\ELIOR\Documents\apps\menu\server\.env`
4. ודא שהשם הוא `.env` (עם נקודה בהתחלה, ללא .txt)

**⚠️ אם יש לך סיסמה ל-MySQL, שים אותה אחרי `DB_PASSWORD=`**

---

### צעד 2: התקן תלויות

פתח PowerShell או CMD בתיקיית `C:\Users\ELIOR\Documents\apps\menu` והרץ:

```bash
npm run setup
```

**זה יקח 2-3 דקות - אל תסגור!**

---

### צעד 3: ודא ש-MySQL רץ

```powershell
# בדוק:
Get-Service MySQL*

# אם לא רץ:
net start MySQL80
```

אם MySQL לא מותקן - הורד מכאן: https://dev.mysql.com/downloads/mysql/

---

### צעד 4: הקם מסד נתונים

```bash
cd server
npm run setup-db
cd ..
```

---

### צעד 5: הרץ!

```bash
npm run dev
```

המתן עד שתראה:

```
╔════════════════════════════════════════╗
║   🎬 Menu Display System Server       ║
╚════════════════════════════════════════╝
✅ Connected to MySQL
```

---

### צעד 6: פתח דפדפן

גש ל: **http://localhost:3000**

- שם משתמש: `admin`
- סיסמה: `admin123`

---

## 🆘 עדיין לא עובד?

הרץ את זה ושלח לי מה רשום:

```bash
cd server
node server.js
```

העתק את השגיאה ואני אעזור!

---

## 📁 הקובץ .env שלך צריך להיות כאן:

```
C:\Users\ELIOR\Documents\apps\menu\server\.env
```

ולהכיל בדיוק את זה (בלי רווחים מיותרים):

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=menu_system
JWT_SECRET=my-secret-key-change-this-later-12345678
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

---

**ברגע שתעשה את 6 הצעדים האלה - הכל יעבוד! 🚀**
