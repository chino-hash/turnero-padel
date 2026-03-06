-- AlterTable
ALTER TABLE "public"."Consumible" ADD COLUMN IF NOT EXISTS "productoId" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Consumible_productoId_idx" ON "public"."Consumible"("productoId");

-- AddForeignKey (only if Producto.id exists; Consumible.productoId references Producto.id)
ALTER TABLE "public"."Consumible" ADD CONSTRAINT "Consumible_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "public"."Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
