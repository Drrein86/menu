# 📘 מדריך התקנה מפורט - Menu Display System

מדריך זה מכסה את כל השלבים הנדרשים להתקנה מלאה של המערכת, מתחילה ועד סוף.

## 📋 דרישות קדם

לפני שמתחילים, ודא שיש לך את הבאים מותקנים במחשב:

### 1. Node.js

**גרסה נדרשת**: 16.x או גבוהה יותר

**בדיקה**:

```bash
node --version
npm --version
```

**התקנה** (אם לא מותקן):

- Windows/Mac: הורד מ-[nodejs.org](https://nodejs.org)
- Linux:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### 2. MySQL

**גרסה נדרשת**: 5.7+ או 8.0+

**בדיקה**:

```bash
mysql --version
```

**התקנה**:

- **Windows**: הורד מ-[MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
- **Mac**:
  ```bash
  brew install mysql
  brew services start mysql
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install mysql-server
  sudo systemctl start mysql
  sudo mysql_secure_installation
  ```

### 3. Git (אופציונלי אך מומלץ)

```bash
git --version
```

## 🚀 התקנה צעד אחר צעד

### שלב 1: הורדת הפרויקט

אם יש לך את הקוד בגיטהאב:

```bash
git clone <repository-url>
cd menu
```

אם יש לך את הקבצים בזיפ:

```bash
# חלץ את הקובץ ועבור לתיקייה
cd menu
```

### שלב 2: התקנת כל התלויות

הפעל פקודה אחת שמתקינה הכל:

```bash
npm run setup
```

זה יתקין תלויות עבור:

- ✅ Root project
- ✅ Server (Backend)
- ✅ Client (CMS)
- ✅ Display (TV Frontend)

אם יש שגיאות, התקן ידנית:

```bash
# Root
npm install

# Server
cd server
npm install
cd ..

# Client
cd client
npm install
cd ..

# Display
cd display
npm install
cd ..
```

### שלב 3: הגדרת MySQL

#### 3.1 כניסה ל-MySQL

```bash
# Windows (Command Prompt או PowerShell)
mysql -u root -p

# Mac/Linux
sudo mysql -u root -p
```

#### 3.2 יצירת מסד נתונים ומשתמש

העתק והדבק את הפקודות הבאות ב-MySQL:

```sql
-- יצירת מסד נתונים
CREATE DATABASE menu_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- יצירת משתמש (שנה את הסיסמה!)
CREATE USER 'menu_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';

-- מתן הרשאות
GRANT ALL PRIVILEGES ON menu_system.* TO 'menu_user'@'localhost';

-- רענון הרשאות
FLUSH PRIVILEGES;

-- בדיקה
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'menu_user';

-- יציאה
EXIT;
```

#### 3.3 בדיקת חיבור

```bash
mysql -u menu_user -p menu_system
# הכנס את הסיסמה שהגדרת
# אם נכנסת בהצלחה - מעולה! הקלד EXIT לצאת
```

### שלב 4: יצירת קובץ .env

#### 4.1 צור את הקובץ

```bash
cd server
```

**ב-Windows**:

```cmd
copy nul .env
notepad .env
```

**ב-Mac/Linux**:

```bash
touch .env
nano .env
```

#### 4.2 הדבק את התוכן הבא

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=menu_user
DB_PASSWORD=YourStrongPassword123!
DB_NAME=menu_system

# Security
JWT_SECRET=your-super-secret-random-key-change-this-to-something-very-long-and-random

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# CORS (אופציונלי)
CORS_ORIGIN=*
```

**⚠️ חשוב מאוד**:

- החלף `YourStrongPassword123!` בסיסמה שהגדרת ב-MySQL
- החלף את `JWT_SECRET` במחרוזת אקראית ארוכה (לפחות 32 תווים)

#### 4.3 שמור את הקובץ

- **Notepad**: File → Save
- **Nano**: Ctrl+X, אז Y, אז Enter

### שלב 5: הקמת מבנה מסד הנתונים

עדיין בתיקיית `server`, הרץ:

```bash
npm run setup-db
```

אם הכל עובד תראה:

```
✅ Connected to MySQL server
✅ Database 'menu_system' created or already exists
✅ Table 'users' created
✅ Table 'menus' created
✅ Table 'menu_items' created
✅ Table 'screens' created
✅ Table 'change_log' created
✅ Admin user created (username: admin, password: admin123)

🎉 Database setup completed successfully!
```

### שלב 6: בדיקת הקמת הטבלאות

```bash
mysql -u menu_user -p menu_system
```

```sql
SHOW TABLES;
-- אמור להראות: users, menus, menu_items, screens, change_log

SELECT * FROM users;
-- אמור להראות את משתמש ה-admin

EXIT;
```

### שלב 7: הפעלה ראשונה

חזור לתיקיית הראשית:

```bash
cd ..
```

הפעל את המערכת:

```bash
npm run dev
```

אתה אמור לראות:

```
> server@1.0.0 dev
> nodemon server.js

╔════════════════════════════════════════╗
║   🎬 Menu Display System Server       ║
║   Port: 5000                          ║
║   Environment: development            ║
╚════════════════════════════════════════╝

Server running on http://localhost:5000
✅ Connected to MySQL database successfully

> client@1.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose

> display@1.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
```

### שלב 8: בדיקת כל החלקים

#### 8.1 בדוק API

פתח דפדפן וגש ל:

```
http://localhost:5000/api/health
```

אמור להראות:

```json
{ "status": "ok", "timestamp": "2024-..." }
```

#### 8.2 בדוק CMS

```
http://localhost:3000
```

אמור לראות מסך התחברות

#### 8.3 התחבר

- **שם משתמש**: `admin`
- **סיסמה**: `admin123`

אם נכנסת בהצלחה - מזל טוב! ההתקנה הצליחה! 🎉

## 🔧 פתרון בעיות התקנה

### בעיה: "ECONNREFUSED" בחיבור ל-MySQL

**סיבה**: MySQL לא פועל או שגוי בפרטי חיבור

**פתרון**:

1. ודא ש-MySQL פועל:

   ```bash
   # Windows
   net start MySQL80  # או MySQL57

   # Mac
   brew services list
   brew services start mysql

   # Linux
   sudo systemctl status mysql
   sudo systemctl start mysql
   ```

2. בדוק את פרטי החיבור ב-`server/.env`

### בעיה: "Error: Cannot find module ..."

**פתרון**:

```bash
# נקה ותתקין מחדש
rm -rf node_modules package-lock.json
npm install

# עשה זאת גם ב-server, client, display
cd server && rm -rf node_modules && npm install
cd ../client && rm -rf node_modules && npm install
cd ../display && rm -rf node_modules && npm install
```

### בעיה: "Port 5000 is already in use"

**פתרון 1**: הרוג את התהליך שתופס את הפורט

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**פתרון 2**: שנה את הפורט
ב-`server/.env`:

```env
PORT=5001
```

### בעיה: קבצי .env לא נטענים

**פתרון**:

1. ודא שהקובץ נקרא **בדיוק** `.env` (עם נקודה בהתחלה)
2. ודא שהוא בתיקיית `server/`
3. אל תשתמש ברווחים סביב ה-`=`:

   ```env
   # נכון
   PORT=5000

   # לא נכון
   PORT = 5000
   ```

### בעיה: "ER_NOT_SUPPORTED_AUTH_MODE" ב-MySQL 8

**פתרון**:

```sql
-- כנס ל-MySQL כ-root
mysql -u root -p

-- שנה את שיטת האימות
ALTER USER 'menu_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourPassword';
FLUSH PRIVILEGES;
EXIT;
```

### בעיה: תמונות לא עולות

**פתרון**:

1. צור את התיקייה ידנית:

   ```bash
   cd server
   mkdir uploads
   mkdir uploads/images
   mkdir uploads/videos
   ```

2. ב-Windows, ודא הרשאות כתיבה:
   - לחץ ימני על `uploads` → Properties → Security → Edit
   - תן Full Control למשתמש הנוכחי

## 🌐 הפעלה ברשת מקומית (LAN)

אם אתה רוצה שטלוויזיות במשרד יגישו למערכת:

### 1. מצא את כתובת ה-IP שלך

**Windows**:

```cmd
ipconfig
# חפש IPv4 Address - למשל: 192.168.1.100
```

**Mac/Linux**:

```bash
ifconfig
# או
ip addr show
```

### 2. עדכן CORS ב-server/.env

```env
CORS_ORIGIN=*
```

### 3. פתח פורטים בחומת האש

**Windows Firewall**:

```powershell
# הרץ כ-Administrator
New-NetFirewallRule -DisplayName "Menu System API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Menu System Display" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 4. גש מטלוויזיה אחרת

במקום `localhost` השתמש בכתובת ה-IP:

```
http://192.168.1.100:3001/display/TOKEN
```

## 📱 התקנה על Raspberry Pi

### 1. הכנת Raspberry Pi

```bash
# עדכון מערכת
sudo apt update && sudo apt upgrade -y

# התקן Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# התקן MySQL (או השתמש בשרת מרוחק)
sudo apt install mariadb-server -y
```

### 2. העתק את הקבצים

```bash
# דרך USB או rsync
rsync -avz /path/to/menu pi@192.168.1.x:/home/pi/
```

### 3. הרץ את המערכת

```bash
cd menu
npm run setup
# המשך כמו בהתקנה רגילה
```

### 4. הפעלה אוטומטית בהדלקה

```bash
# התקן PM2
sudo npm install -g pm2

# התחל את השרת
cd server
pm2 start server.js --name menu-api

# שמור להפעלה אוטומטית
pm2 startup
pm2 save
```

## ✅ Checklist סופי

לפני שאתה מסיים, ודא:

- [ ] Node.js מותקן (גרסה 16+)
- [ ] MySQL מותקן ופועל
- [ ] מסד נתונים `menu_system` נוצר
- [ ] משתמש `menu_user` נוצר עם הרשאות
- [ ] קובץ `.env` קיים ב-`server/` עם פרטים נכונים
- [ ] כל התלויות הותקנו (`npm run setup`)
- [ ] מבנה DB הוקם (`npm run setup-db`)
- [ ] המערכת רצה (`npm run dev`)
- [ ] ניתן להתחבר ל-CMS ב-`http://localhost:3000`
- [ ] API עונה ב-`http://localhost:5000/api/health`
- [ ] סיסמת admin שונתה!

## 🎓 שלבים הבאים

עכשיו שהמערכת מותקנת:

1. **שנה את סיסמת ה-admin** (חובה!)
2. **ערוך את התפריטים הקיימים** (סביח, טוסט)
3. **העלה תמונות** לפריטים
4. **צור מסך ראשון** ובדוק בטלוויזיה
5. **התאם ערכות צבעים** למיתוג שלך
6. **קרא את README.md** למידע נוסף

---

**זקוק לעזרה נוספת?** פתח Issue או חפש בדוקומנטציה!
