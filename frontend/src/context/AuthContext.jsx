import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, loginUser, logoutUser, registerUser, updateCurrentUser, validateSession } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())

  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      const validUser = await validateSession()
      if (!cancelled) setUser(validUser)
    }

    // Only validate when there is a saved session; guests go straight to login.
    if (getCurrentUser()) checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key || event.key === 'medifind_current_user') setUser(getCurrentUser())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const register = async (details) => {
    const registeredUser = await registerUser(details)
    setUser(registeredUser)
    return registeredUser
  }

  const login = async (credentials) => {
    const authenticatedUser = await loginUser(credentials)
    setUser(authenticatedUser)
    return authenticatedUser
  }

  const logout = () => {
    logoutUser()
    setUser(null)
  }

  const updateUser = (updates) => {
    const updatedUser = updateCurrentUser(updates)
    setUser(updatedUser)
    return updatedUser
  }

  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), register, login, logout, updateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
