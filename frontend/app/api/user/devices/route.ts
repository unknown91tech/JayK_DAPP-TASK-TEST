import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, getUserActiveDevices, logSecurityEvent } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { generateDeviceFingerprint, detectDeviceType } from '@/lib/utils/helpers'

const registerDeviceSchema = z.object({
  deviceName: z.string().min(1).max(100),
  fingerprint: z.string().optional()
})

// Get user's devices
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    
    const devices = await getUserActiveDevices(user.userId)
    
    return NextResponse.json({ devices })
    
  } catch (error) {
    console.error('Get devices error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

// Register a new device
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const body = await request.json()
    const { deviceName, fingerprint } = registerDeviceSchema.parse(body)
    
    const userAgent = request.headers.get('user-agent') || ''
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check if user already has maximum devices (5)
    const currentDevices = await getUserActiveDevices(user.userId)
    if (currentDevices.length >= 5) {
      return NextResponse.json(
        { error: 'Maximum number of devices (5) reached. Please remove a device first.' },
        { status: 400 }
      )
    }
    
    // Generate device fingerprint if not provided
    const deviceFingerprint = fingerprint || generateDeviceFingerprint(userAgent, clientIp)
    
    // Check if device is already registered
    const existingDevice = await prisma.device.findUnique({
      where: { fingerprint: deviceFingerprint }
    })
    
    if (existingDevice) {
      return NextResponse.json(
        { error: 'This device is already registered' },
        { status: 409 }
      )
    }
    
    // Detect device type
    const deviceType = detectDeviceType(userAgent)
    
    // Register the device
    const device = await prisma.device.create({
      data: {
        userId: user.userId,
        deviceName,
        deviceType,
        fingerprint: deviceFingerprint,
        userAgent,
        ipAddress: clientIp,
        lastUsedAt: new Date()
      }
    })
    
    // Log device registration
    await logSecurityEvent({
      userId: user.userId,
      eventType: 'DEVICE_REGISTERED',
      description: `New device registered: ${deviceName}`,
      metadata: { deviceId: device.id, deviceType, fingerprint: deviceFingerprint },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'MEDIUM'
    })
    
    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        createdAt: device.createdAt,
        lastUsedAt: device.lastUsedAt
      }
    })
    
  } catch (error) {
    console.error('Register device error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid device data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    )
  }
}

// Remove a device
export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }
    
    // Find the device
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        userId: user.userId
      }
    })
    
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Deactivate the device (don't actually delete for audit purposes)
    await prisma.device.update({
      where: { id: deviceId },
      data: { isActive: false }
    })
    
    // Log device removal
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      userId: user.userId,
      eventType: 'DEVICE_REMOVED',
      description: `Device removed: ${device.deviceName}`,
      metadata: { deviceId, deviceName: device.deviceName },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'MEDIUM'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Device removed successfully'
    })
    
  } catch (error) {
    console.error('Remove device error:', error)
    
    return NextResponse.json(
      { error: 'Failed to remove device' },
      { status: 500 }
    )
  }
}