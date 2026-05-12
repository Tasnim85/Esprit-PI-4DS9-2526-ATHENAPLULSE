import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore'
import { db } from './config'
import { User, UserRole } from '@/types/user'

const USERS_COLLECTION = 'users'

export const createUser = async (user: Omit<User, 'createdAt' | 'updatedAt'>) => {
  const userRef = doc(db, USERS_COLLECTION, user.id)
  const now = new Date().toISOString()
  await setDoc(userRef, {
    ...user,
    createdAt: now,
    updatedAt: now,
  })
  return { ...user, createdAt: now, updatedAt: now }
}

export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    const data = userSnap.data()
    return {
      id: userSnap.id,
      nom: data.nom,
      prenom: data.prenom,
      adresse: data.adresse,
      numTel: data.numTel,
      email: data.email,
      role: data.role,
      specialite: data.specialite,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as User
  }
  return null
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = collection(db, USERS_COLLECTION)
  const q = query(usersRef, where('email', '==', email))
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      nom: data.nom,
      prenom: data.prenom,
      adresse: data.adresse,
      numTel: data.numTel,
      email: data.email,
      role: data.role,
      specialite: data.specialite,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as User
  }
  return null
}

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, USERS_COLLECTION)
  const q = query(usersRef, orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      nom: data.nom,
      prenom: data.prenom,
      adresse: data.adresse,
      numTel: data.numTel,
      email: data.email,
      role: data.role,
      specialite: data.specialite,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as User
  })
}

export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  const usersRef = collection(db, USERS_COLLECTION)
  const q = query(usersRef, where('role', '==', role))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      nom: data.nom,
      prenom: data.prenom,
      adresse: data.adresse,
      numTel: data.numTel,
      email: data.email,
      role: data.role,
      specialite: data.specialite,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as User
  })
}

export const updateUser = async (userId: string, updates: Partial<User>) => {
  const userRef = doc(db, USERS_COLLECTION, userId)
  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export const deleteUser = async (userId: string) => {
  const userRef = doc(db, USERS_COLLECTION, userId)
  await deleteDoc(userRef)
}