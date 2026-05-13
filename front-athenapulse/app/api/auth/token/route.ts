import { NextRequest, NextResponse } from 'next/server'
import { generateToken, JWTPayload } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, role, nom, prenom } = body
    
    if (!id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const payload: JWTPayload = { id, email, role, nom, prenom }
    const token = generateToken(payload)
    
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}