import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Display from './Display'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/:token" element={<Display />} />
        <Route path="/display/:token" element={<Display />} />
        <Route path="*" element={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh',
            background: '#2c3e50',
            color: 'white',
            fontFamily: 'Heebo',
            fontSize: '24px'
          }}>
            מערכת תצוגת תפריטים - אנא השתמש בקישור תקין
          </div>
        } />
      </Routes>
    </Router>
  </React.StrictMode>,
)

