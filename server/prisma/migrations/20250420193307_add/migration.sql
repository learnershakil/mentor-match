-- CreateEnum
CREATE TYPE "subject" AS ENUM ('GeneralInquiry', 'TechnicalSupport', 'BillingQuestion', 'PartnershipOppurtunity', 'Feedback');

-- CreateTable
CREATE TABLE "contactUs" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" "subject" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contactUs_pkey" PRIMARY KEY ("id")
);
