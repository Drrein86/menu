import axios from 'axios'
import { io } from 'socket.io-client'

// ב-production: משתמש ב-VITE_API_URL
// ב-development: משתמש ב-proxy של Vite
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL 
  : 'https://menu-production-3a36.up.railway.app'

console.log('🔧 Display API_BASE_URL:', API_BASE_URL)

// Axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
})

// Socket.IO instance
export const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling']
})

export default api

