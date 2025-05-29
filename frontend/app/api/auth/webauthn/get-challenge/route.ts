// app/api/auth/webauthn/get-challenge/route.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory store for users and their credentials (replace with a database in production)
const usersDb: Record<string, { userId: string; credentialId: string; publicKey: string }> = {};
const challengesDb: Record<string, string> = {};

// Base64 URL encoding utility
const bufferToBase64url = (buffer: Buffer): string => {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export async function POST(request: Request) {
  try {
    const { type, method } = await request.json();

    if (type !== 'login' || method !== 'touch') {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    // Simulate fetching user data (in production, fetch from a database)
    // For this example, we'll use a static user ID and credential
    const userId = 'user_123'; // Replace with actual user ID (e.g., from session or token)
    let user = usersDb[userId];

    if (!user) {
      // Simulate a user with a registered credential (in production, this would be after registration)
      const credentialId = bufferToBase64url(randomBytes(32)); // Generate a mock credential ID
      const publicKey = 'mock-public-key'; // In production, this would be the actual public key
      user = { userId, credentialId, publicKey };
      usersDb[userId] = user;
    }

    // Generate a challenge (random bytes)
    const challenge = bufferToBase64url(randomBytes(32));
    console.log("hello",challenge)
    challengesDb[userId] = challenge; // Store the challenge temporarily

    // Return the challenge and credential details
    return NextResponse.json({
      challenge,
      userId: bufferToBase64url(Buffer.from(userId)),
      credentialId: user.credentialId,
    });
  } catch (error) {
    console.error('Error generating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}