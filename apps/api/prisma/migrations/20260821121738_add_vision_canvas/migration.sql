-- CreateTable
CREATE TABLE "VisionCanvas" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "targetGroup" TEXT,
    "needs" TEXT,
    "product" TEXT,
    "businessGoals" TEXT,
    "competitors" TEXT,
    "revenueStreams" TEXT,
    "costFactors" TEXT,
    "channels" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisionCanvas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisionCanvas_organisationId_key" ON "VisionCanvas"("organisationId");

-- AddForeignKey
ALTER TABLE "VisionCanvas" ADD CONSTRAINT "VisionCanvas_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
