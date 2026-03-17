-- CreateTable
CREATE TABLE "list_share_tokens" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "list_share_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "list_share_tokens_token_key" ON "list_share_tokens"("token");

-- CreateIndex
CREATE INDEX "list_share_tokens_list_id_idx" ON "list_share_tokens"("list_id");

-- AddForeignKey
ALTER TABLE "list_share_tokens" ADD CONSTRAINT "list_share_tokens_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_share_tokens" ADD CONSTRAINT "list_share_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
