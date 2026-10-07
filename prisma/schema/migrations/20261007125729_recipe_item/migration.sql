-- CreateTable
CREATE TABLE "recipe_items" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "raw_material_id" BIGINT NOT NULL,
    "quantity_required" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_recipe_product_material" ON "recipe_items"("product_id", "raw_material_id");

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
