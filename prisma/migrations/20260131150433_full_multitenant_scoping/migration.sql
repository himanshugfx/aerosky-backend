-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "batteries" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "drones" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "subcontractors" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "organization_id" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drones" ADD CONSTRAINT "drones_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batteries" ADD CONSTRAINT "batteries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
