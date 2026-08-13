-- CreateTable
CREATE TABLE "ApplicationService" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "ApplicationService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationService_applicationId_idx" ON "ApplicationService"("applicationId");

-- AddForeignKey
ALTER TABLE "ApplicationService" ADD CONSTRAINT "ApplicationService_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
