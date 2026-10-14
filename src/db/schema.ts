import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// Ангилал
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  ...timestamps,
});

// Ном (бүтээл) — нэг номын олон хувь book_copies-д хадгалагдана
export const books = pgTable(
  "books",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    // Хуучин монгол номонд ISBN байхгүй байж болно; NULL олон байж болох ч давхардахгүй
    isbn: text("isbn").unique(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    publisher: text("publisher"),
    publishedYear: smallint("published_year"),
    description: text("description"),
    ...timestamps,
  },
  (t) => [index("books_category_idx").on(t.categoryId)],
);

// Номын хувийн төлөв. "Олгосон" төлөв энд байхгүй — тэр нь буцаагдаагүй
// loans мөрөөс тодорхойлогдоно, тэгснээр хоёр эх сурвалж зөрөх боломжгүй.
export const copyStatus = pgEnum("copy_status", [
  "active", // Хэвийн, олгох боломжтой
  "damaged", // Гэмтсэн
  "lost", // Алдагдсан
  "withdrawn", // Хасагдсан
]);

// Номын хувь (физик хувь бүр тусдаа)
export const bookCopies = pgTable(
  "book_copies",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    inventoryNumber: text("inventory_number").notNull(),
    status: copyStatus("status").default("active").notNull(),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("book_copies_inventory_number_idx").on(t.inventoryNumber),
    index("book_copies_book_idx").on(t.bookId),
  ],
);

// Админы өөрчилдөг тохиргоо — үргэлж ганц мөр (id = 1)
export const settings = pgTable(
  "settings",
  {
    id: smallint("id").primaryKey().default(1),
    loanPeriodDays: smallint("loan_period_days").default(14).notNull(),
    maxActiveLoans: smallint("max_active_loans").default(3).notNull(),
    maxRenewals: smallint("max_renewals").default(1).notNull(),
    renewalDays: smallint("renewal_days").default(14).notNull(),
    // Мөнгөн дүн төгрөгөөр (бүхэл тоо)
    finePerDay: integer("fine_per_day").default(500).notNull(),
    // Төлөгдөөгүй торгууль энэ дүнд хүрвэл ном олгохгүй
    maxUnpaidFine: integer("max_unpaid_fine").default(5000).notNull(),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    check("settings_single_row", sql`${t.id} = 1`),
    check(
      "settings_positive",
      sql`${t.loanPeriodDays} > 0 AND ${t.maxActiveLoans} > 0 AND ${t.maxRenewals} >= 0
        AND ${t.renewalDays} > 0 AND ${t.finePerDay} >= 0 AND ${t.maxUnpaidFine} >= 0`,
    ),
  ],
);

export * from "./auth-schema";
