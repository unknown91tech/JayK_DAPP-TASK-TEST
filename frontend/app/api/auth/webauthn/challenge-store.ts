// Shared challenge store for WebAuthn operations

// Define the challenge data structure
export interface ChallengeData {
  challenge: string;
  timestamp: number;
}

// In-memory store for challenges (in production, use Redis or database)
export const challengesDb: Record<string, ChallengeData> = {}

// Function to get challenge for a user
export function getChallengeForUser(userIdentifier: string): ChallengeData | undefined {
  return challengesDb[userIdentifier]
}

// Function to store a challenge
export function storeChallenge(userIdentifier: string, challenge: string): void {
  challengesDb[userIdentifier] = {
    challenge,
    timestamp: Date.now()
  }
}

// Function to clean expired challenges
export function cleanupExpiredChallenges(expirationMs: number = 5 * 60 * 1000): void {
  const expirationTime = Date.now() - expirationMs
  Object.keys(challengesDb).forEach(key => {
    if (challengesDb[key].timestamp < expirationTime) {
      delete challengesDb[key]
      console.log('🧹 Cleaned up expired challenge for:', key)
    }
  })
}