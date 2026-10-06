import api from './api'

const SESSION_KEY = 'medifind_current_user'
const TOKEN_KEY = 'medifind_access_token'
const REMEMBER_KEY = 'medifind_remember'

const getStorage = () => {
  return localStorage.getItem(REMEMBER_KEY) === 'true'
    ? localStorage
    : sessionStorage
}

const readStorage = (key, fallback) => {
  try {
    const localValue = localStorage.getItem(key)
    const sessionValue = sessionStorage.getItem(key)
    const value = localValue ?? sessionValue

    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const saveSession = (token, user, remember = false) => {
  const storage = remember ? localStorage : sessionStorage

  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TOKEN_KEY)

  storage.setItem(TOKEN_KEY, token)
  storage.setItem(SESSION_KEY, JSON.stringify(user))
  localStorage.setItem(REMEMBER_KEY, String(remember))
}

export const registerUser = async (userDetails) => {
  try {
    const response = await api.post('/auth/register', {
      fullName: userDetails.fullName.trim(),
      email: userDetails.email.trim().toLowerCase(),
      phone: userDetails.phone.trim(),
      password: userDetails.password,
      role: 'PATIENT',
    })

    const { token, user } = response.data

    saveSession(token, user, false)

    return user
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Registration failed. Please try again.'

    throw new Error(message)
  }
}

export const loginUser = async ({ email, password, remember = false }) => {
  try {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })

    const { token, user } = response.data

    saveSession(token, user, remember)

    return user
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Email or password is incorrect.'

    throw new Error(message)
  }
}

export const getCurrentUser = () => readStorage(SESSION_KEY, null)

export const getAccessToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY)

export const updateCurrentUser = (updates) => {
  const currentUser = getCurrentUser()
  if (!currentUser) return null

  const updatedUser = { ...currentUser, ...updates }
  getStorage().setItem(SESSION_KEY, JSON.stringify(updatedUser))
  return updatedUser
}

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword })
  return response.data
}

export const validateSession = async () => {
  const token = getAccessToken()
  const currentUser = getCurrentUser()

  if (!token || !currentUser) {
    logoutUser()
    return null
  }

  try {
    await api.get(
      `/reservations/patient/${currentUser.id || currentUser.sub || 'session-check'}`
    )

    return currentUser
  } catch (error) {
    const status = error.response?.status

    if (status === 401 || status === 403 || !status) {
      if (status === 403) return currentUser

      logoutUser()
      return null
    }

    return currentUser
  }
}

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REMEMBER_KEY)

  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}