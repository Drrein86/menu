// Mock Data - נתונים דמה למערכת

const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$YourHashedPasswordHere', // סיסמה: admin123
    role: 'admin'
  }
];

const mockMenus = [
  {
    id: 1,
    key_name: 'sabich',
    title: 'תפריט סביח 🥙',
    theme_color: '#FF6B35',
    bg_color: '#FFF8F0',
    text_color: '#2C3E50',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    video_settings: { loop: true, muted: true, autoplay: true },
    layout: null,
    font_family: 'Rubik',
    font_size_title: 56,
    font_size_item: 26,
    items_count: 4,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    key_name: 'toast',
    title: 'תפריט טוסט 🌭',
    theme_color: '#E74C3C',
    bg_color: '#FFFAEB',
    text_color: '#2C3E50',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    video_settings: { loop: true, muted: true, autoplay: true },
    layout: null,
    font_family: 'Rubik',
    font_size_title: 56,
    font_size_item: 26,
    items_count: 4,
    created_at: new Date(),
    updated_at: new Date()
  }
];

const mockMenuItems = [
  // פריטי סביח - רק 4 פריטים
  {
    id: 1,
    menu_id: 1,
    name: '🥙 סביח קלאסי',
    description: 'חציל מטוגן, ביצה קשה, טחינה, סלט ירקות טריים',
    price: 34.90,
    image_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
    is_visible: true,
    order_index: 1,
    modifiers: null
  },
  {
    id: 2,
    menu_id: 1,
    name: '⭐ סביח מיוחד',
    description: 'חציל מטוגן, ביצה קשה, טחינה, חריף, חומוס',
    price: 38.90,
    image_url: 'https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?w=400',
    is_visible: true,
    order_index: 2,
    modifiers: null
  },
  {
    id: 3,
    menu_id: 1,
    name: '🔥 סביח XL',
    description: 'פיתה גדולה, חציל כפול, 2 ביצים, כל התוספות',
    price: 44.90,
    image_url: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400',
    is_visible: true,
    order_index: 3,
    modifiers: null
  },
  {
    id: 4,
    menu_id: 1,
    name: '🌱 סביח טבעוני',
    description: 'חציל מטוגן, טחינה, סלט ירקות, חומוס',
    price: 32.90,
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    is_visible: true,
    order_index: 4,
    modifiers: null
  },

  // פריטי טוסט נקניק - רק 4 פריטים
  {
    id: 9,
    menu_id: 2,
    name: '🌭 טוסט נקניק קלאסי',
    description: 'נקניקיות פריכות, גבינה צהובה, קטשופ',
    price: 28.90,
    image_url: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400',
    is_visible: true,
    order_index: 1,
    modifiers: null
  },
  {
    id: 10,
    menu_id: 2,
    name: '⭐ טוסט נקניק מיוחד',
    description: 'נקניקיות, גבינה, עגבניה טרייה, מלפפון חמוץ',
    price: 32.90,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    is_visible: true,
    order_index: 2,
    modifiers: null
  },
  {
    id: 11,
    menu_id: 2,
    name: '👨‍👩‍👧‍👦 טוסט משפחתי',
    description: 'טוסט גדול, נקניקיות כפול, 2 סוגי גבינה',
    price: 42.90,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    is_visible: true,
    order_index: 3,
    modifiers: null
  },
  {
    id: 12,
    menu_id: 2,
    name: '🔥 טוסט חריף',
    description: 'נקניקיות, גבינה, ג\'לפניו, רטב חריף מעולה',
    price: 34.90,
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400',
    is_visible: true,
    order_index: 4,
    modifiers: null
  }
];

const mockScreens = [
  {
    id: 1,
    name: 'מסך ראשי',
    token: 'demo-screen-001',
    menu_id: 1,
    kiosk_mode: true,
    last_seen: new Date(),
    status: 'online'
  },
  {
    id: 2,
    name: 'מסך טוסט',
    token: 'demo-screen-002',
    menu_id: 2,
    kiosk_mode: true,
    last_seen: new Date(),
    status: 'online'
  }
];

module.exports = {
  mockUsers,
  mockMenus,
  mockMenuItems,
  mockScreens
};

