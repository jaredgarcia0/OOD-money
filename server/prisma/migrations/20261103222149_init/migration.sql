-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('owner', 'member');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "savings_goal_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "household_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("household_id","user_id")
);

-- CreateTable
CREATE TABLE "paychecks" (
    "id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "pay_date" DATE NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "paychecks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_expenses" (
    "id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "due_day" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fixed_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "purchase_date" DATE NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "household_members_user_id_idx" ON "household_members"("user_id");

-- CreateIndex
CREATE INDEX "paychecks_household_id_pay_date_idx" ON "paychecks"("household_id", "pay_date");

-- CreateIndex
CREATE INDEX "fixed_expenses_household_id_idx" ON "fixed_expenses"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_household_id_name_key" ON "categories"("household_id", "name");

-- CreateIndex
CREATE INDEX "purchases_household_id_purchase_date_idx" ON "purchases"("household_id", "purchase_date");

-- CreateIndex
CREATE INDEX "purchases_category_id_idx" ON "purchases"("category_id");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paychecks" ADD CONSTRAINT "paychecks_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_expenses" ADD CONSTRAINT "fixed_expenses_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Data rules carried over from the old SQLite schema (Prisma can't express CHECK constraints,
-- so they live only in this migration).
ALTER TABLE "households" ADD CONSTRAINT "households_savings_goal_cents_check" CHECK ("savings_goal_cents" >= 0);
ALTER TABLE "paychecks" ADD CONSTRAINT "paychecks_amount_cents_check" CHECK ("amount_cents" > 0);
ALTER TABLE "fixed_expenses" ADD CONSTRAINT "fixed_expenses_amount_cents_check" CHECK ("amount_cents" >= 0);
ALTER TABLE "fixed_expenses" ADD CONSTRAINT "fixed_expenses_due_day_check" CHECK ("due_day" BETWEEN 1 AND 31);
ALTER TABLE "categories" ADD CONSTRAINT "categories_percent_check" CHECK ("percent" BETWEEN 0 AND 100);
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_amount_cents_check" CHECK ("amount_cents" > 0);
