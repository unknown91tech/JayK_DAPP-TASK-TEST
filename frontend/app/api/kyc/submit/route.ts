import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma, logSecurityEvent } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const formData = await request.formData()
    
    // Extract form fields
    const kycData = {
      fullName: formData.get('fullName') as string,
      middleName: formData.get('middleName') as string,
      nationality: formData.get('nationality') as string,
      occupation: formData.get('occupation') as string,
      streetAddress: formData.get('streetAddress') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postalCode: formData.get('postalCode') as string,
      country: formData.get('country') as string,
      documentType: formData.get('documentType') as string,
      documentNumber: formData.get('documentNumber') as string,
    }

    // Extract files
    const frontId = formData.get('frontId') as File
    const backId = formData.get('backId') as File
    const selfie = formData.get('selfie') as File

    // In a real implementation, you would:
    // 1. Upload files to secure storage (AWS S3, etc.)
    // 2. Send to KYC verification service (Jumio, Onfido, etc.)
    // 3. Store encrypted data in database

    // For demo purposes, we'll just update the user record
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        kycStatus: 'IN_PROGRESS',
        kycData: {
          ...kycData,
          submittedAt: new Date().toISOString(),
          documents: {
            frontId: frontId?.name,
            backId: backId?.name,
            selfie: selfie?.name
          }
        }
      }
    })

    // Log KYC submission
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    await logSecurityEvent({
      userId: user.userId,
      eventType: 'KYC_SUBMITTED',
      description: 'KYC information submitted for verification',
      metadata: { documentType: kycData.documentType },
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      riskLevel: 'LOW'
    })

    return NextResponse.json({
      success: true,
      message: 'KYC information submitted successfully'
    })

  } catch (error) {
    console.error('KYC submission error:', error)
    
    return NextResponse.json(
      { error: 'Failed to submit KYC information' },
      { status: 500 }
    )
  }
}