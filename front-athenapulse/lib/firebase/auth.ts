import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from './config'
import { getUserByEmail, createUser } from './firestore'
import { User } from '@/types/user'

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = await getUserByEmail(email)
    return { user: userCredential.user, userData: user }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export const registerWithEmail = async (
  email: string, 
  password: string, 
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'email'>
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await createUser({
      ...userData,
      id: userCredential.user.uid,
      email: email,
    })
    return userCredential.user
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

export const logout = async () => {
  await signOut(auth)
}

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}