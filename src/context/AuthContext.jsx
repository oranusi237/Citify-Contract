import React, { createContext, useContext, useEffect, useState } from 'react'
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return

      setAuthLoading(true)
      setUser(firebaseUser ?? null)

      if (!firebaseUser) {
        if (isMounted) {
          setIsAdmin(false)
          setAuthLoading(false)
        }
        return
      }

      try {
        const tokenResult = await getIdTokenResult(firebaseUser, true)
        if (isMounted) {
          setIsAdmin(tokenResult.claims?.admin === true)
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false)
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
