# 🚀 מדריך פריסה לסביבת ייצור (Production Deployment)

מדריך זה מכסה את כל השלבים הנדרשים לפרוס את המערכת בסביבת ייצור (production) על שרת אמיתי.

## 📋 דרישות סביבת ייצור

- **שרת**: VPS/Dedicated Server (Ubuntu 20.04/22.04 מומלץ)
- **RAM**: לפחות 2GB (4GB מומלץ)
- **Storage**: לפחות 20GB
- **Domain**: דומיין משלך (אופציונלי אך מומלץ)
- **SSL**: Let's Encrypt (חינם)

## 🏗️ אפשרויות פריסה

### אפשרות 1: פריסה על VPS (Ubuntu)

מתאים ל: שרת ייעודי, שליטה מלאה

### אפשרות 2: Docker

מתאים ל: פריסה מהירה, ניידות

### אפשרות 3: Shared Hosting

מתאים ל: תקציב נמוך (מוגבל ביכולות)

---

## 🐧 אפשרות 1: פריסה על VPS Ubuntu

### שלב 1: הכנת השרת

#### 1.1 התחבר לשרת

```bash
ssh root@your-server-ip
```

#### 1.2 עדכן את המערכת

```bash
apt update && apt upgrade -y
```

#### 1.3 צור משתמש חדש (אל תשתמש ב-root!)

```bash
adduser menuadmin
usermod -aG sudo menuadmin
su - menuadmin
```

#### 1.4 התקן Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # אמור להראות v18.x
```

#### 1.5 התקן MySQL

```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

הגדרות מומלצות:

- Remove anonymous users? **Yes**
- Disallow root login remotely? **Yes**
- Remove test database? **Yes**
- Reload privilege tables? **Yes**

#### 1.6 התקן Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 1.7 התקן PM2 (מנהל תהליכים)

```bash
sudo npm install -g pm2
```

#### 1.8 התקן Certbot (SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### שלב 2: העלאת הקוד

#### 2.1 התקן Git

```bash
sudo apt install git -y
```

#### 2.2 שכפל את הפרויקט

```bash
cd /home/menuadmin
git clone <your-repo-url> menu
cd menu
```

או העלה דרך FTP/SCP:

```bash
# מהמחשב המקומי
scp -r /path/to/menu menuadmin@your-server-ip:/home/menuadmin/
```

#### 2.3 התקן תלויות

```bash
npm run setup
```

### שלב 3: הגדרת מסד נתונים

#### 3.1 כניסה ל-MySQL

```bash
sudo mysql
```

#### 3.2 צור מסד נתונים ומשתמש

```sql
CREATE DATABASE menu_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'menu_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON menu_system.* TO 'menu_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3.3 יבוא הנתונים

```bash
cd /home/menuadmin/menu/server
npm run setup-db
```

### שלב 4: הגדרת משתני סביבה (Production)

#### 4.1 צור .env

```bash
cd /home/menuadmin/menu/server
nano .env
```

#### 4.2 הדבק את ההגדרות (production)

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=menu_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=menu_system

# Security - CHANGE THESE!
JWT_SECRET=generate-a-very-long-random-string-at-least-64-characters-long

# Upload Configuration
UPLOAD_DIR=/home/menuadmin/menu/server/uploads
MAX_FILE_SIZE=52428800

# CORS
CORS_ORIGIN=https://yourdomain.com
```

**⚠️ חשוב מאוד**:

- השתמש בסיסמאות חזקות!
- `JWT_SECRET` חייב להיות אקראי וארוך!
- שמור את הקובץ הזה בסוד!

### שלב 5: Build Frontend

#### 5.1 Build CMS

```bash
cd /home/menuadmin/menu/client
npm run build
```

זה ייצור תיקיית `dist/`

#### 5.2 Build Display

```bash
cd /home/menuadmin/menu/display
npm run build
```

### שלב 6: הגדרת PM2

#### 6.1 התחל את השרת

```bash
cd /home/menuadmin/menu/server
pm2 start server.js --name menu-api
pm2 list  # בדוק שזה רץ
```

#### 6.2 שמור להפעלה אוטומטית

```bash
pm2 startup
# העתק והדבק את הפקודה שמוצגת

pm2 save
```

#### 6.3 הגדר monitoring

```bash
pm2 monit  # ראה שימוש ב-CPU/RAM בזמן אמת
```

### שלב 7: הגדרת Nginx

#### 7.1 צור קובץ הגדרה

```bash
sudo nano /etc/nginx/sites-available/menu
```

#### 7.2 הדבק את ההגדרה

```nginx
# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Support
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Uploads (static files)
    location /uploads {
        alias /home/menuadmin/menu/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # CMS Frontend
    location / {
        root /home/menuadmin/menu/client/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Display Frontend
    location /display {
        alias /home/menuadmin/menu/display/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }
}
```

#### 7.3 הפעל את ההגדרה

```bash
sudo ln -s /etc/nginx/sites-available/menu /etc/nginx/sites-enabled/
sudo nginx -t  # בדיקת syntax
sudo systemctl reload nginx
```

### שלב 8: הגדרת SSL (HTTPS)

#### 8.1 קבל תעודת SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

עקוב אחר ההוראות:

- הזן כתובת אימייל
- הסכם לתנאים
- בחר "Redirect" (כל HTTP יפנה ל-HTTPS)

#### 8.2 בדוק חידוש אוטומטי

```bash
sudo certbot renew --dry-run
```

### שלב 9: הגדרות אבטחה נוספות

#### 9.1 הגדר חומת אש (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

#### 9.2 הגבל גישה ל-MySQL

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

ודא ש:

```ini
bind-address = 127.0.0.1
```

#### 9.3 הגדר גיבויים אוטומטיים

```bash
# צור script לגיבוי
nano /home/menuadmin/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/menuadmin/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# גיבוי DB
mysqldump -u menu_user -pYOUR_PASSWORD menu_system > $BACKUP_DIR/db_$DATE.sql

# גיבוי uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/menuadmin/menu/server/uploads

# מחק גיבויים ישנים (מעל 7 ימים)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

הפוך לניתן להרצה:

```bash
chmod +x /home/menuadmin/backup.sh
```

הגדר Cron Job (גיבוי יומי ב-2 בלילה):

```bash
crontab -e
```

הוסף:

```
0 2 * * * /home/menuadmin/backup.sh >> /home/menuadmin/backup.log 2>&1
```

### שלב 10: בדיקה סופית

#### 10.1 בדוק API

```bash
curl https://yourdomain.com/api/health
```

אמור להחזיר:

```json
{ "status": "ok", "timestamp": "..." }
```

#### 10.2 בדוק CMS

פתח בדפדפן:

```
https://yourdomain.com
```

#### 10.3 בדוק Display

```
https://yourdomain.com/display/TOKEN
```

#### 10.4 בדוק WebSocket

בקונסול הדפדפן (F12) אמור לראות:

```
Connected to server
```

### שלב 11: ניטור ותחזוקה

#### 11.1 צפה בלוגים

```bash
# לוגי PM2
pm2 logs menu-api

# לוגי Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### 11.2 מדדי ביצועים

```bash
pm2 monit
```

#### 11.3 הפעלה מחדש

```bash
# הפעלה מחדש של API
pm2 restart menu-api

# הפעלה מחדש של Nginx
sudo systemctl restart nginx
```

---

## 🐳 אפשרות 2: פריסה עם Docker

### Dockerfile (Backend)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ .

EXPOSE 5000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: menu_system
      MYSQL_USER: menu_user
      MYSQL_PASSWORD: menupassword
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      DB_HOST: mysql
      DB_USER: menu_user
      DB_PASSWORD: menupassword
      DB_NAME: menu_system
      JWT_SECRET: your-secret
    depends_on:
      - mysql
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./client/dist:/usr/share/nginx/html
    depends_on:
      - api
    restart: always

volumes:
  mysql_data:
```

### הרצה

```bash
docker-compose up -d
```

---

## ✅ Checklist פריסה

לפני שאתה חי:

- [ ] שרת מוכן עם Ubuntu
- [ ] Node.js, MySQL, Nginx מותקנים
- [ ] קוד הועלה לשרת
- [ ] תלויות הותקנו
- [ ] מסד נתונים הוקם
- [ ] `.env` עם הגדרות production
- [ ] Frontend בנוי (`npm run build`)
- [ ] PM2 מריץ את ה-API
- [ ] Nginx מוגדר נכון
- [ ] SSL פועל (HTTPS)
- [ ] חומת אש הופעלה
- [ ] גיבויים הוגדרו
- [ ] סיסמת admin שונתה!
- [ ] בדיקות עברו בהצלחה

---

## 📊 ניטור וביצועים

### הגדרת Monitoring עם PM2 Plus (אופציונלי)

```bash
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY
```

גש ל-https://app.pm2.io לראות מדדים

### אופטימיזציות ביצועים

#### 1. Gzip ב-Nginx

הוסף ל-nginx.conf:

```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1000;
```

#### 2. Redis לקאש (מתקדם)

```bash
sudo apt install redis-server
```

#### 3. CDN לסטטיקה

השתמש ב-CloudFlare או AWS CloudFront

---

## 🆘 פתרון בעיות Production

### בעיה: 502 Bad Gateway

```bash
# בדוק שה-API רץ
pm2 list
pm2 logs menu-api

# בדוק Nginx
sudo nginx -t
sudo systemctl status nginx
```

### בעיה: SSL לא עובד

```bash
# חידוש תעודה
sudo certbot renew --force-renewal

# הפעלה מחדש של Nginx
sudo systemctl restart nginx
```

### בעיה: מסד נתונים איטי

```bash
# בדוק חיבורים פתוחים
mysql -u root -p -e "SHOW PROCESSLIST;"

# אופטימיזציה
mysql -u root -p -e "OPTIMIZE TABLE menu_system.menu_items;"
```

---

**זהו! המערכת שלך אמורה לרוץ בייצור! 🚀**

צריך עזרה? פתח Issue או בדוק את README.md
