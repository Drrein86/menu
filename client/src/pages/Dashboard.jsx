import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMenus } from '../api'
import toast from 'react-hot-toast'
import { Edit, Plus, BarChart3 } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)

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
            <Link to={`/menu/${menu.id}`} key={menu.id} className="menu-card">
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

                <button className="edit-btn">
                  <Edit size={18} />
                  <span>ערוך תפריט</span>
                </button>
              </div>
            </Link>
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
    </div>
  )
}

