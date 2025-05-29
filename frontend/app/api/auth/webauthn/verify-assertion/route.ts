// app/api/auth/webauthn/verify-assertion/route.ts
import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { createHash, createVerify } from 'crypto';

// In-memory store for users and challenges (replace with a database in production)
const usersDb: Record<string, { userId: string; credentialId: string; publicKey: string }> = {};
const challengesDb: Record<string, string> = {};

// Base64 URL decoding utility
const base64urlToBuffer = (base64url: string): Buffer => {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
};

export async function POST(request: Request) {
  try {
    const { credentialId, authenticatorData, clientDataJSON, signature } = await request.json();

    if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the user by credentialId (in production, query the database)
    const user = Object.values(usersDb).find(u => u.credentialId === credentialId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Fetch the stored challenge for this user
    const storedChallenge = challengesDb[user.userId];
    if (!storedChallenge) {
      return NextResponse.json({ error: 'No challenge found for this user' }, { status: 401 });
    }

    // Decode the clientDataJSON and verify the challenge
    const clientData = JSON.parse(Buffer.from(base64urlToBuffer(clientDataJSON)).toString('utf-8'));
    const receivedChallenge = clientData.challenge;

    if (receivedChallenge !== storedChallenge) {
      return NextResponse.json({ error: 'Challenge mismatch' }, { status: 401 });
    }

    // Verify the origin (ensure it matches your domain)
    const expectedOrigin = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://yourdomain.com'; // Replace with your production domain
    if (clientData.origin !== expectedOrigin) {
      return NextResponse.json({ error: 'Origin mismatch' }, { status: 401 });
    }

    // Verify the type is "webauthn.get"
    if (clientData.type !== 'webauthn.get') {
      return NextResponse.json({ error: 'Invalid client data type' }, { status: 401 });
    }

    // Compute the hash of clientDataJSON
    const clientDataHash = createHash('SHA256')
      .update(base64urlToBuffer(clientDataJSON))
      .digest();

    // Concatenate authenticatorData and clientDataHash for verification
    const verificationData = Buffer.concat([
      base64urlToBuffer(authenticatorData),
      clientDataHash,
    ]);

    // Verify the signature using the stored public key (simplified for this example)
    // In production, use the actual public key in COSE format and a proper WebAuthn library
    const verifier = createVerify('SHA256');
    verifier.update(verificationData);
    const signatureBuffer = base64urlToBuffer(signature);
    const isSignatureValid = verifier.verify(user.publicKey, signatureBuffer);

    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    // Signature is valid, clear the challenge
    delete challengesDb[user.userId];

    // Create a JWT session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const sessionToken = await new jose.SignJWT({
      userId: user.userId,
      osId: `os_${user.userId}`,
      isSetupComplete: true, // Adjust based on your user setup flow
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // 30 days expiry
      .sign(secret);

    // Set the session cookie
    const response = NextResponse.json({
      message: 'Biometric authentication successful',
      session: {
        userId: user.userId,
        loggedInAt: new Date().toISOString(),
      },
    });
    response.cookies.set('onestep-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error verifying assertion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}