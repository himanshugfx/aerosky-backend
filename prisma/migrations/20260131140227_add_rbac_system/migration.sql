-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'QA_MANAGER', 'PILOT', 'TECHNICIAN', 'VIEWER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "team_member_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "access_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "position" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontractors" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contact_person" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "agreement_date" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drones" (
    "id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "image" TEXT,
    "accountable_manager_id" TEXT,
    "web_portal_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recurring_data" JSONB,

    CONSTRAINT "drones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufactured_units" (
    "id" TEXT NOT NULL,
    "drone_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "uin" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufactured_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drone_uploads" (
    "id" TEXT NOT NULL,
    "drone_id" TEXT NOT NULL,
    "upload_type" TEXT NOT NULL,
    "file_data" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drone_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batteries" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "rated_capacity" TEXT NOT NULL,
    "battery_number_a" TEXT NOT NULL,
    "battery_number_b" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_segment" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "estimated_completion_date" TIMESTAMP(3),
    "contract_value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "revenue_recognition_status" TEXT NOT NULL DEFAULT 'Pending',
    "drone_model" TEXT NOT NULL,
    "drone_type" TEXT NOT NULL,
    "weight_class" TEXT NOT NULL,
    "payload_configuration" TEXT,
    "flight_endurance_requirements" TEXT,
    "software_ai_tier" TEXT,
    "dgca_faa_certification_status" TEXT NOT NULL DEFAULT 'Pending',
    "uin" TEXT,
    "export_license_status" TEXT,
    "geofencing_requirements" TEXT,
    "bom_readiness" TEXT NOT NULL DEFAULT 'Not Ready',
    "manufacturing_stage" TEXT NOT NULL DEFAULT 'In Design',
    "calibration_test_logs" TEXT,
    "after_sales_amc" TEXT,
    "coc_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_team_member_id_key" ON "users"("team_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_id_key" ON "role_permissions"("role", "permission_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_access_id_key" ON "team_members"("access_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_contract_number_key" ON "orders"("contract_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drones" ADD CONSTRAINT "drones_accountable_manager_id_fkey" FOREIGN KEY ("accountable_manager_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufactured_units" ADD CONSTRAINT "manufactured_units_drone_id_fkey" FOREIGN KEY ("drone_id") REFERENCES "drones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drone_uploads" ADD CONSTRAINT "drone_uploads_drone_id_fkey" FOREIGN KEY ("drone_id") REFERENCES "drones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
