-- Migration: Add client_preferences table
-- Run this manually if prisma migrate dev times out

CREATE TABLE IF NOT EXISTS "client_preferences" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "ai_risk_alerts" BOOLEAN NOT NULL DEFAULT true,
    "weekly_report" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_preferences_pkey" PRIMARY KEY ("id")
);

-- Create unique index on client_id
CREATE UNIQUE INDEX IF NOT EXISTS "client_preferences_client_id_key" ON "client_preferences"("client_id");

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'client_preferences_client_id_fkey'
    ) THEN
        ALTER TABLE "client_preferences" 
        ADD CONSTRAINT "client_preferences_client_id_fkey" 
        FOREIGN KEY ("client_id") 
        REFERENCES "clients"("client_id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;
