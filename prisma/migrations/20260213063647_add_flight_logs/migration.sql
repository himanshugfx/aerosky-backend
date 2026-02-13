-- CreateTable
CREATE TABLE "flight_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "takeoff_time" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "location_coords" TEXT,
    "location_name" TEXT,
    "pic_id" TEXT,
    "vo_id" TEXT,
    "mission_type" TEXT NOT NULL,
    "drone_id" TEXT NOT NULL,
    "serial_number" TEXT,
    "uin" TEXT,
    "technical_feedback" TEXT,
    "battery_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_drone_id_fkey" FOREIGN KEY ("drone_id") REFERENCES "drones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_pic_id_fkey" FOREIGN KEY ("pic_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_vo_id_fkey" FOREIGN KEY ("vo_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_battery_id_fkey" FOREIGN KEY ("battery_id") REFERENCES "batteries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
