import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { LogIn, Menu } from 'lucide-react'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      toast.success('התחברת בהצלחה!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Menu size={48} strokeWidth={1.5} />
          <h1>מערכת ניהול תפריטים</h1>
          <p>התחבר כדי לנהל את התפריטים והמסכים</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">שם משתמש</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="הכנס שם משתמש"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הכנס סיסמה"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20 }}></div>
            ) : (
              <>
                <LogIn size={20} />
                <span>התחבר</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>משתמש ברירת מחדל: <strong>admin</strong></p>
          <p>סיסמה: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  )
}

