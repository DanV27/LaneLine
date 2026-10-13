-- CreateEnum
CREATE TYPE "PoolCourse" AS ENUM ('SCY', 'SCM', 'LCM');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('BEGINNER', 'AGE_GROUP', 'HIGH_SCHOOL', 'COLLEGE_ELITE', 'MASTERS');

-- CreateEnum
CREATE TYPE "Focus" AS ENUM ('AEROBIC', 'THRESHOLD', 'SPRINT', 'IM', 'KICK', 'PULL', 'TECHNIQUE', 'TAPER', 'RECOVERY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pool" "PoolCourse" NOT NULL,
    "level" "Level" NOT NULL,
    "focus" "Focus" NOT NULL,
    "totalDistance" INTEGER NOT NULL,
    "estimatedSeconds" INTEGER,
    "content" JSONB NOT NULL,
    "params" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Workout_userId_createdAt_idx" ON "Workout"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
