import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 401 })
    }
    
    const payload = verifyToken(token)
    
    if (payload) {
      return NextResponse.json({ valid: true, user: payload })
    } else {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 })
  }
}