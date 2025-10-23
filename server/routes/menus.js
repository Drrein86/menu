const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticateToken, authorize } = require('../middleware/auth');

// קבלת כל התפריטים
router.get('/', async (req, res) => {
  try {
    const [menus] = await db.query(`
      SELECT m.*, 
        COUNT(mi.id) as items_count 
      FROM menus m 
      LEFT JOIN menu_items mi ON m.id = mi.menu_id AND mi.is_visible = TRUE
      GROUP BY m.id
      ORDER BY m.created_at
    `);
    res.json(menus);
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// קבלת תפריט לפי ID עם כל הפריטים
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // קבלת התפריט
    const [menus] = await db.query('SELECT * FROM menus WHERE id = ?', [id]);
    
    if (menus.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const menu = menus[0];

    // קבלת הפריטים
    const [items] = await db.query(
      'SELECT * FROM menu_items WHERE menu_id = ? ORDER BY order_index, id',
      [id]
    );

    menu.items = items;
    res.json(menu);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// קבלת תפריט לפי key_name (לשימוש במסכים)
router.get('/key/:keyName', async (req, res) => {
  try {
    const { keyName } = req.params;
    
    const [menus] = await db.query('SELECT * FROM menus WHERE key_name = ?', [keyName]);
    
    if (menus.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    const menu = menus[0];

    // קבלת רק הפריטים הגלויים
    const [items] = await db.query(
      'SELECT * FROM menu_items WHERE menu_id = ? AND is_visible = TRUE ORDER BY order_index, id',
      [menu.id]
    );

    menu.items = items;
    res.json(menu);
  } catch (error) {
    console.error('Error fetching menu by key:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// יצירת תפריט חדש (admin בלבד)
router.post('/', [
  authenticateToken,
  authorize('admin'),
  body('key_name').trim().notEmpty(),
  body('title').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      key_name,
      title,
      theme_color,
      bg_color,
      text_color,
      video_url,
      video_settings,
      layout,
      font_family,
      font_size_title,
      font_size_item
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO menus 
      (key_name, title, theme_color, bg_color, text_color, video_url, video_settings, layout, font_family, font_size_title, font_size_item) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        key_name,
        title,
        theme_color || '#FF6B35',
        bg_color || '#FFFFFF',
        text_color || '#000000',
        video_url || null,
        video_settings ? JSON.stringify(video_settings) : null,
        layout ? JSON.stringify(layout) : null,
        font_family || 'Heebo',
        font_size_title || 48,
        font_size_item || 24
      ]
    );

    // לוג שינוי
    await db.query(
      'INSERT INTO change_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create', 'menu', result.insertId, JSON.stringify({ title })]
    );

    res.status(201).json({
      message: 'Menu created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// עדכון תפריט
router.put('/:id', [
  authenticateToken,
  authorize('admin', 'editor')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = [];
    const updateValues = [];

    // בניית שאילתה דינמית
    const allowedFields = [
      'title', 'theme_color', 'bg_color', 'text_color', 
      'video_url', 'video_settings', 'layout', 
      'font_family', 'font_size_title', 'font_size_item'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        if (field === 'video_settings' || field === 'layout') {
          updateValues.push(JSON.stringify(req.body[field]));
        } else {
          updateValues.push(req.body[field]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await db.query(
      `UPDATE menus SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // לוג שינוי
    await db.query(
      'INSERT INTO change_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update', 'menu', id, JSON.stringify(req.body)]
    );

    // שליחת עדכון דרך WebSocket
    if (req.io) {
      req.io.emit('menu_updated', { menuId: id });
    }

    res.json({ message: 'Menu updated successfully' });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// מחיקת תפריט (admin בלבד)
router.delete('/:id', [
  authenticateToken,
  authorize('admin')
], async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM menus WHERE id = ?', [id]);

    // לוג שינוי
    await db.query(
      'INSERT INTO change_log (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [req.user.id, 'delete', 'menu', id]
    );

    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

