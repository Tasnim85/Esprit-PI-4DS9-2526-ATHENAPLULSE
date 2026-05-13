export type UserRole = 'pharmacien' | 'parapharmacien' | 'docteur' | 'delegue'

export interface User {
  id: string
  nom: string
  prenom: string
  adresse: string
  numTel: string
  email: string
  role: UserRole
  specialite?: string // Only for doctors
  createdAt: Date
  updatedAt: Date
}

export interface DoctorUser extends User {
  role: 'docteur'
  specialite: string
}