-- CreateTable
CREATE TABLE "suppliers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(100),
    "phone" VARCHAR(30),
    "address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT,
    "name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "stock" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "cost_per_unit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "min_stock_alert" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "production_date" DATE,
    "exp_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_raw_materials_supplier_id" ON "raw_materials"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_raw_materials_name" ON "raw_materials"("name");

-- CreateIndex
CREATE INDEX "idx_raw_materials_stock" ON "raw_materials"("stock");

-- CreateIndex
CREATE INDEX "idx_raw_materials_exp_date" ON "raw_materials"("exp_date");

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
