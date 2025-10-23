const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticateToken, authorize } = require('../middleware/auth');

// קבלת כל המסכים (admin/editor)
router.get('/', [
  authenticateToken,
  authorize('admin', 'editor')
], async (req, res) => {
  try {
    const [screens] = await db.query(`
      SELECT s.*, m.title as menu_title, m.key_name as menu_key 
      FROM screens s 
      LEFT JOIN menus m ON s.menu_id = m.id
      ORDER BY s.created_at DESC
    `);
    res.json(screens);
  } catch (error) {
    console.error('Error fetching screens:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// יצירת מסך חדש
router.post('/', [
  authenticateToken,
  authorize('admin'),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, menu_id, kiosk_mode } = req.body;
    const token = uuidv4();

    const [result] = await db.query(
      'INSERT INTO screens (name, token, menu_id, kiosk_mode) VALUES (?, ?, ?, ?)',
      [name, token, menu_id || null, kiosk_mode !== undefined ? kiosk_mode : true]
    );

    // לוג שינוי
    await db.query(
      'INSERT INTO change_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create', 'screen', result.insertId, JSON.stringify({ name, token })]
    );

    res.status(201).json({
      message: 'Screen created successfully',
      id: result.insertId,
      token,
      url: `/screen/${token}`
    });
  } catch (error) {
    console.error('Error creating screen:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// קבלת תוכן מסך לפי טוקן (ללא אימות - לשימוש הטלוויזיות)
router.get('/display/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // עדכון last_seen
    await db.query(
      'UPDATE screens SET last_seen = NOW(), status = ? WHERE token = ?',
      ['online', token]
    );

    // קבלת המסך והתפריט
    const [screens] = await db.query(`
      SELECT s.*, m.* 
      FROM screens s 
      LEFT JOIN menus m ON s.menu_id = m.id
      WHERE s.token = ?
    `, [token]);

    if (screens.length === 0) {
      return res.status(404).json({ error: 'Screen not found' });
    }

    const screen = screens[0];

    if (!screen.menu_id) {
      return res.json({
        screen: { id: screen.id, name: screen.name, kiosk_mode: screen.kiosk_mode },
        menu: null,
        items: []
      });
    }

    // קבלת הפריטים הגלויים
    const [items] = await db.query(
      'SELECT * FROM menu_items WHERE menu_id = ? AND is_visible = TRUE ORDER BY order_index, id',
      [screen.menu_id]
    );

    res.json({
      screen: {
        id: screen.id,
        name: screen.name,
        kiosk_mode: screen.kiosk_mode
      },
      menu: {
        id: screen.menu_id,
        key_name: screen.key_name,
        title: screen.title,
        theme_color: screen.theme_color,
        bg_color: screen.bg_color,
        text_color: screen.text_color,
        video_url: screen.video_url,
        video_settings: screen.video_settings,
        font_family: screen.font_family,
        font_size_title: screen.font_size_title,
        font_size_item: screen.font_size_item
      },
      items
    });
  } catch (error) {
    console.error('Error fetching screen display:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// עדכון מסך
router.put('/:id', [
  authenticateToken,
  authorize('admin')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, menu_id, kiosk_mode } = req.body;
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (menu_id !== undefined) {
      updateFields.push('menu_id = ?');
      updateValues.push(menu_id);
    }
    if (kiosk_mode !== undefined) {
      updateFields.push('kiosk_mode = ?');
      updateValues.push(kiosk_mode);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await db.query(
      `UPDATE screens SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // לוג שינוי
    await db.query(
      'INSERT INTO change_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update', 'screen', id, JSON.stringify(req.body)]
    );

    // שליחת עדכון ספציפי למסך זה
    if (req.io) {
      const [screens] = await db.query('SELECT token FROM screens WHERE id = ?', [id]);
      if (screens.length > 0) {
        req.io.emit('screen_updated', { token: screens[0].token });
      }
    }

    res.json({ message: 'Screen updated successfully' });
  } catch (error) {
    console.error('Error updating screen:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// מחיקת מסך
router.delete('/:id', [
  authenticateToken,
  authorize('admin')
], async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM screens WHERE id = ?', [id]);

    // לוג שינוי
    await db.query(
      'INSERT INTO change_log (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [req.user.id, 'delete', 'screen', id]
    );

    res.json({ message: 'Screen deleted successfully' });
  } catch (error) {
    console.error('Error deleting screen:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// בדיקת מצב מסכים (heartbeat)
router.post('/heartbeat/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    await db.query(
      'UPDATE screens SET last_seen = NOW(), status = ? WHERE token = ?',
      ['online', token]
    );

    res.json({ message: 'Heartbeat received' });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

