import {
  check,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

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
    // Хавтасны зураг солих бүрт нэмэгдэнэ → /covers/:id?v=N (CDN-д мөнхөд кэшлэнэ). null = зураггүй
    coverVersion: integer("cover_version"),
    ...timestamps,
  },
  (t) => [
    index("books_category_idx").on(t.categoryId),
    // pg_trgm: ILIKE '%...%' хайлтыг индексээр хурдасгана (кирилл ч ажиллана)
    index("books_title_trgm_idx").using("gin", t.title.op("gin_trgm_ops")),
    index("books_author_trgm_idx").using("gin", t.author.op("gin_trgm_ops")),
  ],
);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

// Номын хавтасны зураг (хөтөч дээр WebP болгож жижигрүүлсэн, ~50–150KB).
// Тусдаа хүснэгтэд — номын жагсаалт татахад зургийн өгөгдөл хамт ирэхгүй.
export const bookCovers = pgTable("book_covers", {
  bookId: integer("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Номын хувийн төлөв. "Олгосон" төлөв энд байхгүй — тэр нь буцаагдаагүй
// loans мөрөөс тодорхойлогдоно, тэгснээр хоёр эх сурвалж зөрөх боломжгүй.
export const copyStatus = pgEnum("copy_status", [
  "active", // Хэвийн, олгох боломжтой
  "damaged", // Гэмтсэн
  "lost", // Алдагдсан
  "withdrawn", // Хасагдсан
]);

// Бүртгэлийн дугаар DB дээр автоматаар олгогдоно — давхцах боломжгүй
export const inventoryNumberSeq = pgSequence("inventory_number_seq", { startWith: 1 });

// Номын хувь (физик хувь бүр тусдаа)
export const bookCopies = pgTable(
  "book_copies",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    bookId: integer("book_id")
      .notNull()
      // Ном устгахад хувиуд хамт устна; зээлийн түүхтэй хувь бол loans-ийн FK хориглоно
      .references(() => books.id, { onDelete: "cascade" }),
    inventoryNumber: text("inventory_number")
      .notNull()
      .default(sql`lpad(nextval('inventory_number_seq')::text, 6, '0')`),
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

// Ном гэрээр олголт. Буцаалт = returned_at бөглөгдөх; тусдаа хүснэгт хэрэггүй.
export const loans = pgTable(
  "loans",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    copyId: integer("copy_id")
      .notNull()
      .references(() => bookCopies.id, { onDelete: "restrict" }),
    readerId: text("reader_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    issuedBy: text("issued_by").references(() => user.id, { onDelete: "set null" }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    // Огноо (цаггүй): энэ өдрийн төгсгөл хүртэл буцааж болно, Улаанбаатарын цагаар
    dueDate: date("due_date").notNull(),
    renewalCount: smallint("renewal_count").default(0).notNull(),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
    returnedTo: text("returned_to").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    // Нэг хувь нэг зэрэг зөвхөн нэг идэвхтэй зээлтэй байна — DB түвшинд баталгаажна
    uniqueIndex("loans_one_active_per_copy_idx").on(t.copyId).where(sql`${t.returnedAt} IS NULL`),
    index("loans_reader_idx").on(t.readerId),
    index("loans_active_due_idx").on(t.dueDate).where(sql`${t.returnedAt} IS NULL`),
  ],
);

export const fineStatus = pgEnum("fine_status", ["unpaid", "paid", "waived"]);

// Хоцорсон буцаалтын торгууль — нэг зээлд нэг торгууль
export const fines = pgTable(
  "fines",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    loanId: integer("loan_id")
      .notNull()
      .unique()
      .references(() => loans.id, { onDelete: "restrict" }),
    readerId: text("reader_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    daysLate: smallint("days_late").notNull(),
    amount: integer("amount").notNull(),
    status: fineStatus("status").default("unpaid").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    index("fines_reader_idx").on(t.readerId),
    check("fines_positive", sql`${t.amount} > 0 AND ${t.daysLate} > 0`),
  ],
);

// Үйлдлийн бүртгэл: хэн, хэзээ, юу хийсэн. actor_name-ийг хуулж хадгална —
// ажилтны нэр солигдсон ч түүх өөрчлөгдөхгүй.
export const auditLog = pgTable(
  "audit_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
  },
  (t) => [index("audit_log_at_idx").on(t.at), index("audit_log_action_idx").on(t.action)],
);

export const reminderKind = pgEnum("reminder_kind", ["due_soon", "overdue"]);

// Илгээсэн сануулга — нэг зээлд нэг өдөр нэг төрлийн сануулга л явна (cron давтагдсан ч)
export const reminderLog = pgTable(
  "reminder_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    loanId: integer("loan_id")
      .notNull()
      .references(() => loans.id, { onDelete: "cascade" }),
    kind: reminderKind("kind").notNull(),
    sentOn: date("sent_on").notNull(),
    recipient: text("recipient").notNull(),
    // Resend-ээс буцсан алдаа (амжилттай бол null)
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("reminder_log_once_per_day_idx").on(t.loanId, t.kind, t.sentOn)],
);

// scripts/demo-data.mts-ийн үүсгэсэн мөрүүд — зөвхөн эдгээрийг цэвэрлэнэ
export const demoRecords = pgTable(
  "demo_records",
  {
    tableName: text("table_name").notNull(),
    recordId: text("record_id").notNull(),
  },
  (t) => [uniqueIndex("demo_records_pk").on(t.tableName, t.recordId)],
);

export * from "./auth-schema";
