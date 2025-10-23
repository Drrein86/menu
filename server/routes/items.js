const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticateToken, authorize } = require('../middleware/auth');

// הוספת פריט חדש
router.post('/', [
  authenticateToken,
  authorize('admin', 'editor'),
  body('menu_id').isInt(),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      menu_id,
      name,
      description,
      price,
      image_url,
      is_visible,
      order_index,
      modifiers
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO menu_items 
      (menu_id, name, description, price, image_url, is_visible, order_index, modifiers) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        menu_id,
        name,
        description || null,
        price || null,
        image_url || null,
        is_visible !== undefined ? is_visible : true,
        order_index || 0,
        modifiers ? JSON.stringify(modifiers) : null
      ]
    );

    // לוג שינוי
    await db.query(
      'INSERT INTO change_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create', 'item', result.insertId, JSON.stringify({ name, menu_id })]
    );

    // שליחת עדכון דרך WebSocket
    if (req.io) {
      req.io.emit('menu_updated', { menuId: menu_id });
    }

    res.status(201).json({
      message: 'Item created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// עדכון פריט
router.put('/:id', [
  authenticateToken,
  authorize('admin', 'editor')
], async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'name', 'description', 'price', 'image_url', 
      'is_visible', 'order_index', 'modifiers'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        if (field === 'modifiers') {
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
      `UPDATE menu_items SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // קבלת menu_id לעדכון WebSocket
    const [items] = await db.query('SELECT menu_id FROM menu_items WHERE id = ?', [id]);
    
    if (items.length > 0) {
      // לוג שינוי
      await db.query(
        'INSERT INTO change_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, 'update', 'item', id, JSON.stringify(req.body)]
      );

      // שליחת עדכון דרך WebSocket
      if (req.io) {
        req.io.emit('menu_updated', { menuId: items[0].menu_id });
      }
    }

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// מחיקת פריט
router.delete('/:id', [
  authenticateToken,
  authorize('admin', 'editor')
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // קבלת menu_id לפני מחיקה
    const [items] = await db.query('SELECT menu_id FROM menu_items WHERE id = ?', [id]);
    
    await db.query('DELETE FROM menu_items WHERE id = ?', [id]);

    if (items.length > 0) {
      // לוג שינוי
      await db.query(
        'INSERT INTO change_log (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [req.user.id, 'delete', 'item', id]
      );

      // שליחת עדכון דרך WebSocket
      if (req.io) {
        req.io.emit('menu_updated', { menuId: items[0].menu_id });
      }
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// עדכון סדר פריטים
router.post('/reorder', [
  authenticateToken,
  authorize('admin', 'editor'),
  body('items').isArray()
], async (req, res) => {
  try {
    const { items } = req.body; // מערך של { id, order_index }
    
    // עדכון בטרנזקציה
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const item of items) {
        await connection.query(
          'UPDATE menu_items SET order_index = ? WHERE id = ?',
          [item.order_index, item.id]
        );
      }

      await connection.commit();

      // קבלת menu_id מהפריט הראשון
      if (items.length > 0) {
        const [menuItems] = await db.query(
          'SELECT menu_id FROM menu_items WHERE id = ?',
          [items[0].id]
        );

        if (menuItems.length > 0 && req.io) {
          req.io.emit('menu_updated', { menuId: menuItems[0].menu_id });
        }
      }

      res.json({ message: 'Items reordered successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error reordering items:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

