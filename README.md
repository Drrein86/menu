# 🍽️ Menu Display System

מערכת תצוגת תפריט דיגיטלי מקצועית עם CMS לניהול תפריטים ותצוגה בזמן אמת.

## ✨ תכונות

- 📋 **ניהול תפריטים** - CMS מלא לעריכת תפריטים, פריטים, מחירים ותמונות
- 📺 **תצוגה דיגיטלית** - תצוגה מלאה למסכי טלוויזיה
- 🎨 **עיצוב דינמי** - שינוי צבעים, פונטים וערכת עיצוב
- 🎬 **וידאו רקע** - הוספת וידאו לתצוגה
- 🔄 **עדכון בזמן אמת** - שינויים מתעדכנים מיידית בכל המסכים
- 💾 **SQLite Database** - מסד נתונים קל ומהיר ללא התקנות
- 📸 **העלאת תמונות** - העלאת תמונות אמיתיות למוצרים

## 🛠️ טכנולוגיות

### Backend:
- Node.js + Express
- SQLite (better-sqlite3)
- Socket.IO (real-time updates)
- Multer (file uploads)

### Frontend:
- React + Vite
- React Router
- Axios
- Socket.IO Client

## 🚀 התחלה מהירה

### דרישות מקדימות:
- Node.js (v16 ומעלה)

### התקנה:

```bash
# התקנת dependencies
npm run setup

# יצירת מסד נתונים
cd server
npm run setup-sqlite
cd ..
```

### הפעלה:

#### Windows:
```bash
# לחץ כפול על:
start-sqlite.bat
```

#### Terminal:
```bash
npm run dev-sqlite
```

## 📊 כניסה למערכת

### CMS (ניהול):
- **URL**: http://localhost:3000
- **שם משתמש**: `admin`
- **סיסמה**: `admin123`

### תצוגה (Display):
- **מסך 1**: http://localhost:3001/demo-screen-001
- **מסך 2**: http://localhost:3001/demo-screen-002

## 📁 מבנה הפרויקט

```
menu/
├── server/           # Backend (Node.js + Express)
│   ├── server-sqlite.js
│   ├── database.js
│   ├── setup-sqlite.js
│   ├── menu.db      # SQLite database
│   └── uploads/     # Uploaded files
├── client/          # CMS Frontend
│   └── src/
├── display/         # Display Frontend
│   └── src/
└── start-sqlite.bat # Quick start script
```

## 🔧 פקודות שימושיות

```bash
# הפעלה עם SQLite
npm run dev-sqlite

# איפוס מסד נתונים
cd server
npm run setup-sqlite

# התקנת dependencies מחדש
npm run setup
```

## 📝 תכונות CMS

1. **ניהול תפריטים**:
   - יצירת תפריטים חדשים
   - עריכת כותרות וצבעים
   - הוספת וידאו רקע

2. **ניהול פריטים**:
   - הוספת/עריכת/מחיקת פריטים
   - העלאת תמונות
   - קביעת מחירים
   - הצגה/הסתרה של פריטים

3. **ניהול מסכים**:
   - יצירת מסכי תצוגה
   - שיוך תפריטים למסכים
   - קישורים ייחודיים לכל מסך

## 💾 גיבוי

לגיבוי מסד הנתונים:
```bash
copy server\menu.db server\backup\menu-backup-YYYY-MM-DD.db
```

לשחזור:
```bash
copy server\backup\menu-backup-YYYY-MM-DD.db server\menu.db
```

## 🎨 התאמה אישית

### שינוי צבעים:
1. היכנס ל-CMS
2. בחר תפריט
3. לחץ על "ערכת צבעים"
4. שנה צבעים וגופנים
5. שמור

### שינוי וידאו:
1. CMS → ערכת צבעים
2. בחר קובץ וידאו או הדבק קישור
3. שמור

## 📸 העלאת תמונות

התמונות נשמרות ב-`server/uploads/` ומוגשות דרך:
```
http://localhost:5000/uploads/[filename]
```

## 🐛 Troubleshooting

### השרת לא עולה?
```bash
# עצור תהליכי node
taskkill /F /IM node.exe

# הפעל מחדש
start-sqlite.bat
```

### מסד הנתונים ריק?
```bash
cd server
npm run setup-sqlite
```

### התמונות לא נטענות?
וודא ש-`server/uploads/` קיימת והשרת רץ על פורט 5000.

## 📄 License

ISC

## 👨‍💻 תמיכה

לבעיות או שאלות, פתח issue בגיטהאב.

---

**נבנה עם ❤️ למערכות תצוגה דיגיטליות**
