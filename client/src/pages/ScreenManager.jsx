import { useState, useEffect } from 'react'
import { getScreens, getMenus, createScreen, updateScreen, deleteScreen } from '../api'
import toast from 'react-hot-toast'
import { Plus, Monitor, Trash2, ExternalLink, Edit2, Copy } from 'lucide-react'
import './ScreenManager.css'

export default function ScreenManager() {
  const [screens, setScreens] = useState([])
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newScreen, setNewScreen] = useState({ name: '', menu_id: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [screensRes, menusRes] = await Promise.all([
        getScreens(),
        getMenus()
      ])
      setScreens(screensRes.data)
      setMenus(menusRes.data)
    } catch (error) {
      toast.error('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateScreen = async (e) => {
    e.preventDefault()
    try {
      const response = await createScreen(newScreen)
      toast.success('מסך חדש נוצר בהצלחה!')
      setShowAddModal(false)
      setNewScreen({ name: '', menu_id: '' })
      loadData()
      
      // הצג את ה-URL והטוקן
      if (response.data.token) {
        const displayUrl = import.meta.env.VITE_DISPLAY_URL || window.location.origin
        const url = `${displayUrl}/display/${response.data.token}`
        toast.success(`קישור למסך: ${url}`, { duration: 10000 })
      }
    } catch (error) {
      toast.error('שגיאה ביצירת המסך')
    }
  }

  const handleDeleteScreen = async (screenId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מסך זה?')) return
    
    try {
      await deleteScreen(screenId)
      toast.success('המסך נמחק בהצלחה!')
      loadData()
    } catch (error) {
      toast.error('שגיאה במחיקת המסך')
    }
  }

  const handleUpdateScreenMenu = async (screenId, menuId) => {
    try {
      await updateScreen(screenId, { menu_id: menuId })
      toast.success('התפריט עודכן בהצלחה!')
      loadData()
    } catch (error) {
      toast.error('שגיאה בעדכון המסך')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('הקישור הועתק ללוח!')
  }

  const getScreenUrl = (token) => {
    const displayUrl = import.meta.env.VITE_DISPLAY_URL || window.location.origin
    return `${displayUrl}/display/${token}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="screen-manager">
      <div className="page-header">
        <div>
          <h1>ניהול מסכים</h1>
          <p>נהל את מסכי התצוגה והטלוויזיות</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="add-screen-btn">
          <Plus size={20} />
          <span>מסך חדש</span>
        </button>
      </div>

      <div className="screens-grid">
        {screens.map((screen) => (
          <div key={screen.id} className="screen-card">
            <div className="screen-header">
              <div className="screen-icon">
                <Monitor size={32} />
              </div>
              <div className="screen-info">
                <h3>{screen.name}</h3>
                <div className={`status-badge ${screen.status}`}>
                  {screen.status === 'online' ? 'מחובר' : 'לא מחובר'}
                </div>
              </div>
            </div>

            <div className="screen-body">
              <div className="info-row">
                <span className="label">תפריט מוצג:</span>
                <select
                  value={screen.menu_id || ''}
                  onChange={(e) => handleUpdateScreenMenu(screen.id, e.target.value || null)}
                  className="menu-select"
                >
                  <option value="">ללא תפריט</option>
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.title}
                    </option>
                  ))}
                </select>
              </div>

              {screen.last_seen && (
                <div className="info-row">
                  <span className="label">נראה לאחרונה:</span>
                  <span className="value">
                    {new Date(screen.last_seen).toLocaleString('he-IL')}
                  </span>
                </div>
              )}

              <div className="url-section">
                <label>קישור למסך:</label>
                <div className="url-box">
                  <input
                    type="text"
                    value={getScreenUrl(screen.token)}
                    readOnly
                    className="url-input"
                  />
                  <button
                    onClick={() => copyToClipboard(getScreenUrl(screen.token))}
                    className="copy-btn"
                    title="העתק"
                  >
                    <Copy size={18} />
                  </button>
                  <a
                    href={`/display/${screen.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-btn"
                    title="פתח בחלון חדש"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>

            <div className="screen-actions">
              <button
                onClick={() => handleDeleteScreen(screen.id)}
                className="delete-btn"
              >
                <Trash2 size={18} />
                <span>מחק</span>
              </button>
            </div>
          </div>
        ))}

        {screens.length === 0 && (
          <div className="empty-state">
            <Monitor size={64} />
            <h3>אין מסכים עדיין</h3>
            <p>צור מסך ראשון כדי להתחיל</p>
          </div>
        )}
      </div>

      {/* Modal - הוספת מסך */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>מסך חדש</h2>
            
            <form onSubmit={handleCreateScreen}>
              <div className="form-group">
                <label>שם המסך *</label>
                <input
                  type="text"
                  value={newScreen.name}
                  onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })}
                  placeholder="לדוגמה: טלוויזיה 1"
                  required
                />
              </div>

              <div className="form-group">
                <label>בחר תפריט</label>
                <select
                  value={newScreen.menu_id}
                  onChange={(e) => setNewScreen({ ...newScreen, menu_id: e.target.value })}
                >
                  <option value="">ללא תפריט (בינתיים)</option>
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">
                  ביטול
                </button>
                <button type="submit" className="create-btn">
                  <Plus size={18} />
                  <span>צור מסך</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

