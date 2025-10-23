import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMenu, updateMenu, createItem, updateItem, deleteItem, uploadImage, uploadVideo } from '../api'
import toast from 'react-hot-toast'
import { ArrowRight, Plus, Edit2, Trash2, Save, Eye, EyeOff, Upload, Palette } from 'lucide-react'
import './MenuEditor.css'

export default function MenuEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [showThemeEditor, setShowThemeEditor] = useState(false)
  const [themeData, setThemeData] = useState({})

  useEffect(() => {
    loadMenu()
  }, [id])

  const loadMenu = async () => {
    try {
      const response = await getMenu(id)
      setMenu(response.data)
      setItems(response.data.items || [])
      setThemeData({
        theme_color: response.data.theme_color,
        bg_color: response.data.bg_color,
        text_color: response.data.text_color,
        video_url: response.data.video_url,
        font_size_title: response.data.font_size_title,
        font_size_item: response.data.font_size_item
      })
    } catch (error) {
      toast.error('שגיאה בטעינת התפריט')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTheme = async () => {
    try {
      await updateMenu(id, themeData)
      toast.success('ערכת הצבעים נשמרה בהצלחה!')
      setShowThemeEditor(false)
      loadMenu()
    } catch (error) {
      toast.error('שגיאה בשמירת ערכת הצבעים')
    }
  }

  const handleAddItem = () => {
    setEditingItem({
      menu_id: parseInt(id),
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_visible: true,
      order_index: items.length
    })
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    try {
      if (editingItem.id) {
        await updateItem(editingItem.id, editingItem)
        toast.success('הפריט עודכן בהצלחה!')
      } else {
        await createItem(editingItem)
        toast.success('הפריט נוסף בהצלחה!')
      }
      setEditingItem(null)
      loadMenu()
    } catch (error) {
      toast.error('שגיאה בשמירת הפריט')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return
    
    try {
      await deleteItem(itemId)
      toast.success('הפריט נמחק בהצלחה!')
      loadMenu()
    } catch (error) {
      toast.error('שגיאה במחיקת הפריט')
    }
  }

  const handleToggleVisibility = async (item) => {
    try {
      await updateItem(item.id, { is_visible: !item.is_visible })
      toast.success(item.is_visible ? 'הפריט הוסתר' : 'הפריט הוצג')
      loadMenu()
    } catch (error) {
      toast.error('שגיאה בעדכון הפריט')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('יש להעלות קובץ תמונה בלבד')
      e.target.value = '' // Reset input
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('גודל התמונה גדול מדי. מקסימום 5MB')
      e.target.value = '' // Reset input
      return
    }

    const loadingToast = toast.loading('מעלה תמונה...')
    try {
      const response = await uploadImage(file)
      setEditingItem({ ...editingItem, image_url: response.data.url })
      toast.dismiss(loadingToast)
      toast.success('התמונה הועלתה בהצלחה!')
      e.target.value = '' // Reset input so same file can be selected again
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('שגיאה בהעלאת התמונה')
      console.error(error)
      e.target.value = '' // Reset input
    }
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error('יש להעלות קובץ וידאו בלבד')
      e.target.value = '' // Reset input
      return
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('גודל הקובץ גדול מדי. מקסימום 50MB')
      e.target.value = '' // Reset input
      return
    }

    const loadingToast = toast.loading('מעלה וידאו... זה יכול לקחת כמה שניות')
    try {
      const response = await uploadVideo(file)
      setThemeData({ ...themeData, video_url: response.data.url })
      toast.dismiss(loadingToast)
      toast.success('הוידאו הועלה בהצלחה!')
      e.target.value = '' // Reset input so same file can be selected again
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('שגיאה בהעלאת הוידאו')
      console.error(error)
      e.target.value = '' // Reset input
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="menu-editor">
      <div className="editor-header">
        <button onClick={() => navigate('/')} className="back-btn">
          <ArrowRight size={20} />
          <span>חזרה</span>
        </button>
        
        <div className="header-info">
          <h1>{menu.title}</h1>
          <p>{items.length} פריטים</p>
        </div>

        <button onClick={() => setShowThemeEditor(true)} className="theme-btn">
          <Palette size={20} />
          <span>ערכת צבעים</span>
        </button>
      </div>

      <div className="items-section">
        <div className="section-header">
          <h2>פריטי התפריט</h2>
          <button onClick={handleAddItem} className="add-item-btn">
            <Plus size={20} />
            <span>הוסף פריט</span>
          </button>
        </div>

        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className={`item-card ${!item.is_visible ? 'hidden-item' : ''}`}>
              {item.image_url && (
                <div className="item-image">
                  <img src={item.image_url} alt={item.name} />
                </div>
              )}
              
              <div className="item-content">
                <div className="item-header">
                  <h3>{item.name}</h3>
                  {item.price && <div className="item-price">₪{item.price}</div>}
                </div>
                
                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}

                <div className="item-actions">
                  <button 
                    onClick={() => handleToggleVisibility(item)}
                    className="icon-btn"
                    title={item.is_visible ? 'הסתר' : 'הצג'}
                  >
                    {item.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="icon-btn"
                    title="ערוך"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="icon-btn danger"
                    title="מחק"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="empty-state">
              <Plus size={48} />
              <h3>אין פריטים עדיין</h3>
              <p>לחץ על "הוסף פריט" כדי להתחיל</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal - עריכת פריט */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem.id ? 'ערוך פריט' : 'פריט חדש'}</h2>
            
            <form onSubmit={handleSaveItem}>
              <div className="form-group">
                <label>שם הפריט *</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>תיאור</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>מחיר (₪)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>תמונה</label>
                <div className="image-upload">
                  {editingItem.image_url && (
                    <div className="image-preview-container">
                      <img src={editingItem.image_url} alt="Preview" className="image-preview" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => setEditingItem({ ...editingItem, image_url: '' })}
                        title="הסר תמונה"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="image-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="upload-btn">
                    <Upload size={18} />
                    <span>{editingItem.image_url ? 'החלף תמונה' : 'בחר תמונה'}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingItem.is_visible}
                    onChange={(e) => setEditingItem({ ...editingItem, is_visible: e.target.checked })}
                  />
                  <span>הצג פריט זה בתפריט</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEditingItem(null)} className="cancel-btn">
                  ביטול
                </button>
                <button type="submit" className="save-btn">
                  <Save size={18} />
                  <span>שמור</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - ערכת צבעים */}
      {showThemeEditor && (
        <div className="modal-overlay" onClick={() => setShowThemeEditor(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>ערכת צבעים ועיצוב</h2>
            
            <div className="theme-form">
              <div className="form-group">
                <label>צבע ראשי</label>
                <input
                  type="color"
                  value={themeData.theme_color}
                  onChange={(e) => setThemeData({ ...themeData, theme_color: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>צבע רקע</label>
                <input
                  type="color"
                  value={themeData.bg_color}
                  onChange={(e) => setThemeData({ ...themeData, bg_color: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>צבע טקסט</label>
                <input
                  type="color"
                  value={themeData.text_color}
                  onChange={(e) => setThemeData({ ...themeData, text_color: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>גודל כותרת</label>
                <input
                  type="number"
                  value={themeData.font_size_title}
                  onChange={(e) => setThemeData({ ...themeData, font_size_title: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>גודל טקסט פריט</label>
                <input
                  type="number"
                  value={themeData.font_size_item}
                  onChange={(e) => setThemeData({ ...themeData, font_size_item: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>וידאו רקע</label>
                <div className="video-upload-section">
                  {themeData.video_url && (
                    <div className="video-preview-info">
                      <span>✓ וידאו מוגדר</span>
                      <button
                        type="button"
                        className="remove-video-btn"
                        onClick={() => setThemeData({ ...themeData, video_url: '' })}
                        title="הסר וידאו"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input
                    type="url"
                    value={themeData.video_url || ''}
                    onChange={(e) => setThemeData({ ...themeData, video_url: e.target.value })}
                    placeholder="קישור לווידאו (https://example.com/video.mp4)"
                  />
                  <div className="upload-divider">או</div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    id="video-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="video-upload" className="upload-btn">
                    <Upload size={18} />
                    <span>{themeData.video_url ? 'החלף וידאו' : 'העלה קובץ וידאו'}</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowThemeEditor(false)} className="cancel-btn">
                  ביטול
                </button>
                <button onClick={handleSaveTheme} className="save-btn">
                  <Save size={18} />
                  <span>שמור</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

