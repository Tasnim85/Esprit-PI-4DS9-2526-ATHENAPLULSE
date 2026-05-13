import { useAuth } from '@/context/AuthContext'

export const useUserId = () => {
  const { userData, getUserId } = useAuth()
  
  // Get user ID from context or localStorage
  const userId = userData?.id || getUserId()
  
  return { userId, userData }
}