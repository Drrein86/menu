import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Monitor, LogOut, Menu } from 'lucide-react'
import './Layout.css'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Menu size={32} />
          <h2>ניהול תפריטים</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/" 
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Home size={20} />
            <span>דף הבית</span>
          </Link>
          
          <Link 
            to="/screens" 
            className={`nav-item ${location.pathname === '/screens' ? 'active' : ''}`}
          >
            <Monitor size={20} />
            <span>ניהול מסכים</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>התנתק</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

