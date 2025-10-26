import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMenus, createMenu, deleteMenu } from '../api'
import toast from 'react-hot-toast'
import { Edit, Plus, BarChart3, X, Trash2 } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMenu, setNewMenu] = useState({ key_name: '', title: '' })

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      const response = await getMenus()
      setMenus(response.data)
    } catch (error) {
      toast.error('שגיאה בטעינת התפריטים')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMenu = async (e) => {
    e.preventDefault()
    
    if (!newMenu.key_name || !newMenu.title) {
      toast.error('יש למלא את כל השדות')
      return
    }

    try {
      await createMenu(newMenu)
      toast.success('תפריט חדש נוצר בהצלחה!')
      setShowAddModal(false)
      setNewMenu({ key_name: '', title: '' })
      loadMenus()
    } catch (error) {
      toast.error('שגיאה ביצירת התפריט')
      console.error(error)
    }
  }

  const handleDeleteMenu = async (menuId, menuTitle, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${menuTitle}"?\n\nפעולה זו תמחק גם את כל הפריטים בתפריט!`)) {
      return
    }
    
    try {
      await deleteMenu(menuId)
      toast.success('התפריט נמחק בהצלחה!')
      loadMenus()
    } catch (error) {
      toast.error('שגיאה במחיקת התפריט')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>טוען תפריטים...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>דף הבית</h1>
          <p>ניהול תפריטים דיגיטליים</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="add-menu-btn">
          <Plus size={20} />
          <span>תפריט חדש</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3498db' }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{menus.length}</div>
            <div className="stat-label">תפריטים פעילים</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#2ecc71' }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {menus.reduce((sum, menu) => sum + (menu.items_count || 0), 0)}
            </div>
            <div className="stat-label">פריטים בסך הכל</div>
          </div>
        </div>
      </div>

      <div className="menus-section">
        <div className="section-header">
          <h2>התפריטים שלי</h2>
        </div>

        <div className="menus-grid">
          {menus.map((menu) => (
            <div key={menu.id} className="menu-card">
              <div 
                className="menu-card-header"
                style={{ background: menu.theme_color || '#3498db' }}
              >
                <h3>{menu.title}</h3>
                <div className="menu-badge">{menu.items_count || 0} פריטים</div>
              </div>
              
              <div className="menu-card-body">
                <div className="menu-info">
                  <div className="info-item">
                    <span className="info-label">מזהה:</span>
                    <span className="info-value">{menu.key_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">עודכן לאחרונה:</span>
                    <span className="info-value">
                      {new Date(menu.updated_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>

                <div className="menu-actions">
                  <Link to={`/menu/${menu.id}`} className="edit-btn">
                    <Edit size={18} />
                    <span>ערוך</span>
                  </Link>
                  <button 
                    onClick={(e) => handleDeleteMenu(menu.id, menu.title, e)}
                    className="delete-menu-btn"
                  >
                    <Trash2 size={18} />
                    <span>מחק</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {menus.length === 0 && (
            <div className="empty-state">
              <Plus size={48} />
              <h3>אין תפריטים עדיין</h3>
              <p>צור תפריט ראשון כדי להתחיל</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal - הוספת תפריט */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>תפריט חדש</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateMenu}>
              <div className="form-group">
                <label>מזהה תפריט (באנגלית)</label>
                <input
                  type="text"
                  placeholder="לדוגמה: breakfast, lunch, dinner"
                  value={newMenu.key_name}
                  onChange={(e) => setNewMenu({ ...newMenu, key_name: e.target.value })}
                  required
                />
                <small>המזהה משמש לצורך טכני בלבד</small>
              </div>

              <div className="form-group">
                <label>שם התפריט</label>
                <input
                  type="text"
                  placeholder="לדוגמה: תפריט ארוחת בוקר"
                  value={newMenu.title}
                  onChange={(e) => setNewMenu({ ...newMenu, title: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">
                  ביטול
                </button>
                <button type="submit" className="create-btn">
                  <Plus size={20} />
                  <span>צור תפריט</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

