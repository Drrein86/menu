import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// Menus
export const getMenus = () => api.get('/menus')
export const getMenu = (id) => api.get(`/menus/${id}`)
export const createMenu = (data) => api.post('/menus', data)
export const updateMenu = (id, data) => api.put(`/menus/${id}`, data)
export const deleteMenu = (id) => api.delete(`/menus/${id}`)

// Items
export const createItem = (data) => api.post('/items', data)
export const updateItem = (id, data) => api.put(`/items/${id}`, data)
export const deleteItem = (id) => api.delete(`/items/${id}`)
export const reorderItems = (items) => api.post('/items/reorder', { items })

// Screens
export const getScreens = () => api.get('/screens')
export const createScreen = (data) => api.post('/screens', data)
export const updateScreen = (id, data) => api.put(`/screens/${id}`, data)
export const deleteScreen = (id) => api.delete(`/screens/${id}`)

// Upload
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const uploadVideo = (file) => {
  const formData = new FormData()
  formData.append('video', file)
  return api.post('/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export default api

