import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'
import './Display.css'

export default function Display() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const socketRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    loadDisplayData()
    setupSocket()
    setupHeartbeat()
    requestFullscreen()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [token])

  const loadDisplayData = async () => {
    try {
      const response = await axios.get(`/api/screens/display/${token}`)
      setData(response.data)
      setError(null)
    } catch (err) {
      setError('שגיאה בטעינת הנתונים')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const setupSocket = () => {
    const socket = io(window.location.origin)
    socketRef.current = socket

    // האזנה לעדכונים
    socket.on('connect', () => {
      console.log('Connected to server')
      socket.emit('join_screen', token)
    })

    socket.on('menu_updated', (data) => {
      console.log('Menu updated, reloading...')
      loadDisplayData()
    })

    socket.on('screen_updated', (data) => {
      if (data.token === token) {
        console.log('Screen updated, reloading...')
        loadDisplayData()
      }
    })
  }

  const setupHeartbeat = () => {
    // שליחת heartbeat כל 30 שניות
    const interval = setInterval(() => {
      axios.post(`/api/screens/heartbeat/${token}`).catch(console.error)
    }, 30000)

    // שליחה מיידית
    axios.post(`/api/screens/heartbeat/${token}`).catch(console.error)

    return () => clearInterval(interval)
  }

  const requestFullscreen = () => {
    const elem = document.documentElement
    
    // המתנה קצרה לפני כניסה ל-fullscreen
    setTimeout(() => {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log('Fullscreen request failed:', err))
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen()
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen()
      }
    }, 1000)
  }

  useEffect(() => {
    // הפעלת וידאו אוטומטית
    if (videoRef.current && data?.menu?.video_url) {
      videoRef.current.play().catch(err => {
        console.log('Auto-play prevented:', err)
      })
    }
  }, [data])

  if (loading) {
    return (
      <div className="display-loading">
        <div className="spinner"></div>
        <p>טוען תפריט...</p>
      </div>
    )
  }

  if (error || !data?.menu) {
    return (
      <div className="display-error">
        <h1>⚠️</h1>
        <h2>{error || 'לא נמצא תפריט להצגה'}</h2>
        <p>אנא בדוק את הקישור או צור קשר עם המנהל</p>
      </div>
    )
  }

  const { menu } = data
  const items = menu.items || []
  
  console.log('🔍 Display loaded:', { title: menu.title, itemsCount: items.length })
  
  const themeColors = {
    '--theme-color': menu.theme_color || '#FF6B35',
    '--bg-color': menu.bg_color || '#FFFFFF',
    '--text-color': menu.text_color || '#000000',
    '--font-size-title': `${menu.font_size_title || 48}px`,
    '--font-size-item': `${menu.font_size_item || 24}px`
  }

  return (
    <div className="display-container" style={themeColors}>
      {/* אזור תפריט - 2/3 */}
      <div className="menu-area">
        <header className="menu-header">
          <h1 className="menu-title">{menu.title}</h1>
        </header>

        <div className="menu-items">
          {items && items.map((item) => (
            <div key={item.id} className="menu-item">
              <div className="item-info">
                <div className="item-name">{item.name}</div>
                {item.description && (
                  <div className="item-description">{item.description}</div>
                )}
              </div>
              
              {item.price && (
                <div className="item-price">₪{parseFloat(item.price).toFixed(2)}</div>
              )}

              {item.image_url && (
                <div className="item-image">
                  <img src={item.image_url} alt={item.name} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* אזור וידאו - 1/3 */}
      <div className="video-area">
        {menu.video_url ? (
          <video
            ref={videoRef}
            src={menu.video_url}
            autoPlay
            loop
            muted
            playsInline
            className="display-video"
            onError={(e) => {
              console.error('Video error:', e);
              console.log('Video URL:', menu.video_url);
            }}
            onLoadedData={() => console.log('Video loaded successfully')}
          />
        ) : (
          <div className="video-placeholder">
            <div className="placeholder-content">
              <h2>{menu.title}</h2>
              <p>תפריט דיגיטלי</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

