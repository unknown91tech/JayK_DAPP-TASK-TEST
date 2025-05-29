-- CreateEnum
CREATE TYPE "SocialProvider" AS ENUM ('TELEGRAM');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'SIGNUP', 'RESET_PASSWORD', 'VERIFY_PHONE', 'VERIFY_EMAIL');

-- CreateEnum
CREATE TYPE "SecurityEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_RESET', 'BIOMETRIC_SETUP', 'BIOMETRIC_AUTH', 'SUSPICIOUS_ACTIVITY', 'DEVICE_REGISTERED', 'DEVICE_REMOVED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AvvCheckType" AS ENUM ('PASSCODE_STRENGTH', 'PASSCODE_PERSONAL_DATA', 'BIOMETRIC_QUALITY', 'DEVICE_TRUST', 'BEHAVIORAL_PATTERN');

-- CreateEnum
CREATE TYPE "AvvResult" AS ENUM ('PASS', 'FAIL', 'WARNING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone_number" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "passcode_hash" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kyc_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_logins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_data" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_logins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "device_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "biometric_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" "SecurityEvent" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avv_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "check_type" "AvvCheckType" NOT NULL,
    "input" TEXT,
    "result" "AvvResult" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avv_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "dapp_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_os_id_key" ON "users"("os_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "social_logins_provider_provider_id_key" ON "social_logins"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_fingerprint_key" ON "devices"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_credentials_credential_id_key" ON "biometric_credentials"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "sso_sessions_session_token_key" ON "sso_sessions"("session_token");

-- AddForeignKey
ALTER TABLE "social_logins" ADD CONSTRAINT "social_logins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_credentials" ADD CONSTRAINT "biometric_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avv_logs" ADD CONSTRAINT "avv_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
