'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUserByEmail } from '@/lib/firebase/firestore'
import { User } from '@/types/user'

interface AuthContextType {
  user: FirebaseUser | null
  userData: User | null
  token: string | null
  loading: boolean
  signOut: () => Promise<void>
  getUserId: () => string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  token: null,
  loading: true,
  signOut: async () => {},
  getUserId: () => null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser?.email) {
        const userDataFromDb = await getUserByEmail(firebaseUser.email)
        setUserData(userDataFromDb)
        
        if (userDataFromDb) {
          // Generate JWT via API route (server-side)
          try {
            const response = await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userDataFromDb.id,
                email: userDataFromDb.email,
                role: userDataFromDb.role,
                nom: userDataFromDb.nom,
                prenom: userDataFromDb.prenom,
              }),
            })
            
            if (response.ok) {
              const { token: jwtToken } = await response.json()
              setToken(jwtToken)
              localStorage.setItem('auth_token', jwtToken)
            }
          } catch (error) {
            console.error('Failed to generate JWT:', error)
          }
          
          localStorage.setItem('user_data', JSON.stringify(userDataFromDb))
        }
      } else {
        setUserData(null)
        setToken(null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setToken(null)
    setUserData(null)
  }

  const getUserId = (): string | null => {
    if (userData?.id) return userData.id
    const storedUser = localStorage.getItem('user_data')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      return parsed.id
    }
    return null
  }

  return (
    <AuthContext.Provider value={{ user, userData, token, loading, signOut, getUserId }}>
      {children}
    </AuthContext.Provider>
  )
}