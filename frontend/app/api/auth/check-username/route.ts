import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isUsernameAvailable } from '@/lib/db/prisma'

const checkUsernameSchema = z.object({
  username: z.string().min(6).max(20)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = checkUsernameSchema.parse(body)
    
    // Check if username meets basic requirements
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { available: false, reason: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }
    
    // Check availability in database with error handling
    try {
      const available = await isUsernameAvailable(username)
      return NextResponse.json({
        available,
        username
      })
    } catch (dbError) {
      console.error('Database error during username check:', dbError)
      return NextResponse.json(
        { available: false, reason: 'Database temporarily unavailable' },
        { status: 503 }
      )
    }
    
  } catch (error) {
    console.error('Username check error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { available: false, reason: 'Invalid username format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { available: false, reason: 'Failed to check username availability' },
      { status: 500 }
    )
  }
}