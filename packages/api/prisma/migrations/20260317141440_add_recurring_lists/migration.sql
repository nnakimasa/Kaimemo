-- CreateTable
CREATE TABLE "recurring_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "group_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "weekday" INTEGER NOT NULL DEFAULT 5,
    "monthly_week" INTEGER NOT NULL DEFAULT 1,
    "days_before" INTEGER NOT NULL DEFAULT 2,
    "reminder_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "next_generation_at" TIMESTAMP(3),
    "last_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_items" (
    "id" TEXT NOT NULL,
    "recurring_list_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_lists_owner_id_idx" ON "recurring_lists"("owner_id");

-- CreateIndex
CREATE INDEX "recurring_lists_next_generation_at_idx" ON "recurring_lists"("next_generation_at");

-- CreateIndex
CREATE INDEX "recurring_items_recurring_list_id_idx" ON "recurring_items"("recurring_list_id");

-- AddForeignKey
ALTER TABLE "recurring_lists" ADD CONSTRAINT "recurring_lists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_lists" ADD CONSTRAINT "recurring_lists_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_recurring_list_id_fkey" FOREIGN KEY ("recurring_list_id") REFERENCES "recurring_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
