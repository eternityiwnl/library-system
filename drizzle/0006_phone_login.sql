-- Картын дугаарын оронд утасны дугаараар нэвтэрнэ.
-- 1) Утасыг цифр болгож цэвэрлэнэ ("+976 9911-2233" → "99112233")
UPDATE "user" SET "phone" = right(regexp_replace("phone", '\D', '', 'g'), 8)
WHERE "phone" IS NOT NULL AND length(regexp_replace("phone", '\D', '', 'g')) IN (8, 11);
--> statement-breakpoint
-- 2) Уншигчийн нэвтрэх нэр = утас. Утасгүй (хуучин картын дугаартай) уншигч хэвээр үлдэнэ —
--    номын санч утсыг нь бөглөхөд шинэчлэгдэнэ.
UPDATE "user" SET "username" = "phone"
WHERE "role" = 'reader' AND "phone" ~ '^\d{8}$'
  AND NOT EXISTS (SELECT 1 FROM "user" u2 WHERE u2."username" = "user"."phone" AND u2."id" <> "user"."id");
--> statement-breakpoint
-- 3) Ажилтанд нэвтрэх нэр хэрэггүй (имэйлээр нэвтэрнэ)
UPDATE "user" SET "username" = NULL WHERE "role" <> 'reader';
