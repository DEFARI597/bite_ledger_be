-- CreateTable
CREATE TABLE "expenses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "description" TEXT,
    "expense_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_expenses_user_id" ON "expenses"("user_id");

-- CreateIndex
CREATE INDEX "idx_expenses_category" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "idx_expenses_expense_date" ON "expenses"("expense_date" DESC);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
