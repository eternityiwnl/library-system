// Танилцуулгад зориулсан жишээ өгөгдөл.
//   npm run demo:seed    — нэмнэ (дахин ажиллуулбал эхлээд хуучнаа цэвэрлэнэ)
//   npm run demo:clear   — зөвхөн энэ скриптийн нэмсэн мөрүүдийг устгана
// Үүсгэсэн мөр бүрийг demo_records хүснэгтэд бичдэг тул таны оруулсан бодит өгөгдөлд хүрэхгүй.
import { randomBytes, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { Pool, type PoolClient } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const command = process.argv[2];
if (command !== "seed" && command !== "clear") {
  console.error("Хэрэглээ: node --env-file=.env.local scripts/demo-data.mts seed|clear");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL алга. --env-file=.env.local гэж ажиллуулна уу.");

// Давтагдах боломжтой санамсаргүй тоо (mulberry32) — демо бүрт ижил дүр зураг
let seed = 20261014;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];

const CATALOG: Record<string, [title: string, author: string, year: number | null][]> = {
  "Монгол уран зохиол": [
    ["Тунгалаг Тамир", "Ч. Лодойдамба", 1962],
    ["Ламбугайн нулимс", "Д. Нацагдорж", 1930],
    ["Үүрийн туяа", "Б. Ринчен", 1951],
    ["Миний нутаг", "Д. Нацагдорж", 1933],
    ["Учиртай гурван толгой", "Д. Нацагдорж", 1934],
  ],
  "Дэлхийн сонгодог": [
    ["Гэмт хэрэг ба шийтгэл", "Ф. Достоевский", 1866],
    ["Дайн ба энх", "Л. Толстой", 1869],
    ["Анна Каренина", "Л. Толстой", 1877],
    ["Өвгөн ба тэнгис", "Э. Хемингуэй", 1952],
    ["Зуун жилийн ганцаардал", "Г. Г. Маркес", 1967],
    ["Мастер ба Маргарита", "М. Булгаков", 1967],
    ["1984", "Ж. Орвелл", 1949],
    ["Амьтны ферм", "Ж. Орвелл", 1945],
    ["Алхимич", "П. Коэльо", 1988],
    ["Гамлет", "В. Шекспир", 1603],
    ["Шерлок Холмсын адал явдал", "А. Конан Дойл", 1892],
  ],
  "Хүүхдийн ном": [
    ["Бяцхан хунтайж", "А. де Сент-Экзюпери", 1943],
    ["Алиса гайхамшгийн оронд", "Л. Кэрролл", 1865],
    ["Пиноккиогийн адал явдал", "К. Коллоди", 1883],
    ["Винни Пух", "А. А. Милн", 1926],
    ["Гарри Поттер ба шидэт чулуу", "Ж. К. Роулинг", 1997],
  ],
  Түүх: [
    ["Монголын нууц товчоо", "Тодорхойгүй", null],
    ["Чингис хаан ба орчин үеийн ертөнц", "Ж. Уэтерфорд", 2004],
    ["Сапиенс: Хүн төрөлхтний товч түүх", "Ю. Н. Харари", 2011],
  ],
  "Шинжлэх ухаан": [
    ["Цаг хугацааны товч түүх", "С. Хокинг", 1988],
    ["Хувиа хичээгч ген", "Р. Докинз", 1976],
    ["Зүйлийн гарал үүсэл", "Ч. Дарвин", 1859],
    ["Космос", "К. Саган", 1980],
  ],
  "Өөрийгөө хөгжүүлэх": [
    ["Баян аав, ядуу аав", "Р. Кийосаки", 1997],
    ["Атомын зуршил", "Ж. Клир", 2018],
    ["Өндөр үр дүнтэй хүмүүсийн 7 зуршил", "С. Кови", 1989],
    ["Сэтгэж бод, баяж", "Н. Хилл", 1937],
  ],
  "Компьютер, программчлал": [
    ["Цэвэр код", "Р. Мартин", 2008],
    ["Прагматик программист", "Э. Хант, Д. Томас", 1999],
  ],
};

const READER_NAMES = [
  "Бат-Эрдэнэ Ганбаатар", "Сарантуяа Дорж", "Тэмүүжин Болд", "Номин-Эрдэнэ Сүх", "Энхжин Мөнх",
  "Ганзориг Пүрэв", "Оюунчимэг Бат", "Мөнх-Очир Гантулга", "Анужин Төмөр", "Билгүүн Эрдэнэ",
  "Хулан Батсайхан", "Тэнгис Отгон", "Солонго Цэрэн", "Өлзий-Орших Даваа", "Үнэнбат Жаргал",
  "Нандин-Эрдэнэ Ганболд", "Цолмон Баяр", "Мишээл Энхбаяр", "Ариунаа Наран", "Дөлгөөн Ганзул",
  "Төгөлдөр Сэргэлэн", "Маралмаа Хүрэл", "Батхүү Алтан", "Индра Мягмар", "Эрдэнэбилэг Шинэ",
];

const LOAN_DAYS = 14;
const FINE_PER_DAY = 500;
const MAX_ACTIVE = 3;

type Tracked = { table: string; id: string | number };

async function clear(client: PoolClient) {
  const ids = async (table: string) =>
    (await client.query("SELECT record_id FROM demo_records WHERE table_name = $1", [table])).rows.map((r) => r.record_id);
  const del = async (table: string, column = "id", cast = "") => {
    const list = await ids(table);
    if (list.length === 0) return 0;
    const { rowCount } = await client.query(`DELETE FROM "${table}" WHERE ${column}${cast} = ANY($1)`, [list]);
    return rowCount ?? 0;
  };
  // Демо ном/уншигч дээр хожим хийгдсэн олголт, торгууль (жишээ нь танилцуулгын үеэр)
  // демо мөрийг устгахад саад болно — тэдгээрийг хамт устгана.
  const demoUsers = await ids("user");
  const demoCopies = await ids("book_copies");
  const { rows: attached } = await client.query(
    "SELECT id FROM loans WHERE reader_id = ANY($1) OR copy_id::text = ANY($2)",
    [demoUsers, demoCopies],
  );
  const attachedLoans = attached.map((r) => r.id);
  await client.query("DELETE FROM fines WHERE loan_id = ANY($1) OR reader_id = ANY($2)", [attachedLoans, demoUsers]);
  await client.query("DELETE FROM loans WHERE id = ANY($1)", [attachedLoans]);

  const result = {
    audit: await del("audit_log", "id", "::text"),
    fines: await del("fines", "id", "::text"),
    loans: attachedLoans.length,
    copies: await del("book_copies", "id", "::text"),
    books: await del("books", "id", "::text"),
    categories: await del("categories", "id", "::text"),
    users: await del("user"),
  };
  await client.query("DELETE FROM demo_records");
  // Каталог бүрэн хоосон бол дугаарлалтыг 1-ээс эхлүүлнэ (бодит өгөгдөл байвал хөндөхгүй)
  const { rows: [left] } = await client.query(
    "SELECT (SELECT count(*) FROM book_copies)::int AS copies, (SELECT count(*) FROM loans)::int AS loans",
  );
  if (left.copies === 0 && left.loans === 0) {
    await client.query("ALTER SEQUENCE inventory_number_seq RESTART WITH 1");
    for (const table of ["book_copies", "books", "loans", "fines"]) {
      await client.query(`ALTER TABLE ${table} ALTER COLUMN id RESTART WITH 1`);
    }
  }
  return result;
}

async function seedData(client: PoolClient) {
  const tracked: Tracked[] = [];
  const track = (table: string, id: string | number) => tracked.push({ table, id });
  const { rows: [{ today }] } = await client.query(
    "SELECT (now() AT TIME ZONE 'Asia/Ulaanbaatar')::date::text AS today",
  );
  const day = (offset: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  // Улаанбаатарын ажлын цагт (09–18) болсон мэт timestamp
  const at = (offset: number) => `${day(offset)}T${String(int(9, 17)).padStart(2, "0")}:${String(int(0, 59)).padStart(2, "0")}:00+08:00`;

  // Ажилтан ба уншигчид
  const credentials: string[] = [];
  const password = () => randomBytes(9).toString("base64url");
  const librarianId = randomUUID();
  const librarianPassword = password();
  await client.query(
    `INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
     VALUES ($1, 'Демо Номын санч', 'demo-librarian@example.com', true, 'librarian', now() - interval '400 days', now())`,
    [librarianId],
  );
  await client.query(
    `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
    [randomUUID(), librarianId, await hashPassword(librarianPassword)],
  );
  track("user", librarianId);
  credentials.push(`Номын санч   имэйл: demo-librarian@example.com   нууц үг: ${librarianPassword}`);

  const readers: { id: string; name: string; phone: string }[] = [];
  for (const [i, name] of READER_NAMES.entries()) {
    const id = randomUUID();
    // Демо утас: 8800 0001 … — уншигчийн нэвтрэх нэр
    const phone = `8800${String(i + 1).padStart(4, "0")}`;
    if ((await client.query('SELECT 1 FROM "user" WHERE phone = $1 OR username = $1', [phone])).rowCount) {
      throw new Error(`${phone} утас аль хэдийн бүртгэлтэй — демо уншигч үүсгэх боломжгүй`);
    }
    // Эхний 8 уншигч имэйлтэй — сануулгын демо-д хэрэгтэй
    const email = i < 8 ? `demo-reader-${i + 1}@example.com` : `${phone}@no-email.invalid`;
    await client.query(
      `INSERT INTO "user" (id, name, email, email_verified, role, username, phone, created_at, updated_at)
       VALUES ($1, $2, $3, false, 'reader', $4, $4, $5, now())`,
      [id, name, email, phone, at(-int(200, 380))],
    );
    track("user", id);
    readers.push({ id, name, phone });
  }
  const shownPhone = (p: string) => `${p.slice(0, 4)} ${p.slice(4)}`;
  const readerPassword = password();
  await client.query(
    `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
    [randomUUID(), readers[0].id, await hashPassword(readerPassword)],
  );
  credentials.push(`Уншигч       утас: 8800 0001   нууц үг: ${readerPassword}`);

  // Каталог
  const copies: { id: number; title: string; inventory: string }[] = [];
  for (const [categoryName, titles] of Object.entries(CATALOG)) {
    const existing = await client.query("SELECT id FROM categories WHERE name = $1", [categoryName]);
    let categoryId: number;
    if (existing.rows[0]) {
      categoryId = existing.rows[0].id; // Танай ангиллыг дахин ашиглана, устгахгүй
    } else {
      categoryId = (await client.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [categoryName])).rows[0].id;
      track("categories", categoryId);
    }
    for (const [title, author, year] of titles) {
      const { rows: [book] } = await client.query(
        `INSERT INTO books (title, author, category_id, published_year, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
        [title, author, categoryId, year, at(-int(300, 370))],
      );
      track("books", book.id);
      const n = pick([1, 2, 2, 3, 3, 4]);
      const { rows } = await client.query(
        "INSERT INTO book_copies (book_id) SELECT $1 FROM generate_series(1, $2::int) RETURNING id, inventory_number",
        [book.id, n],
      );
      for (const r of rows) {
        track("book_copies", r.id);
        copies.push({ id: r.id, title, inventory: r.inventory_number });
      }
    }
  }

  // Зээлийн түүх: хувь бүрийг цаг хугацаагаар явуулж давхцахгүй байлгана
  const active = new Map<string, number>(); // уншигч → идэвхтэй зээлийн тоо
  const audits: [string, string, string, string][] = []; // at, action, summary, actor
  let loanCount = 0;
  let fineCount = 0;
  const popular = new Set(copies.filter(() => rand() < 0.3).map((c) => c.id));

  for (const copy of copies) {
    let t = -365 + int(0, 40);
    while (t < 0) {
      const reader = pick(readers);
      const issued = t;
      const renewed = rand() < 0.15;
      const due = issued + LOAN_DAYS * (renewed ? 2 : 1);
      // Ихэнх нь хугацаандаа, зарим нь хоцорч буцаана
      const late = rand() < 0.18 ? int(1, 12) : 0;
      const returned = late ? due + late : issued + int(3, LOAN_DAYS * (renewed ? 2 : 1));
      const stillOut = returned >= 0;

      if (stillOut) {
        // Одоо зээлэгдсэн: уншигчийн 3 номын хязгаарыг баримтална
        const holder = readers.find((r) => (active.get(r.id) ?? 0) < MAX_ACTIVE && r === reader) ??
          readers.find((r) => (active.get(r.id) ?? 0) < MAX_ACTIVE);
        if (!holder || rand() < 0.35) break; // Зарим хувь тавиур дээр үлдэнэ
        active.set(holder.id, (active.get(holder.id) ?? 0) + 1);
        // Цөөн хэдэн зээлийг маргааш дуусах болгоно (сануулгын демо)
        const dueDay = rand() < 0.12 ? 1 : due;
        const { rows: [loan] } = await client.query(
          `INSERT INTO loans (copy_id, reader_id, issued_by, issued_at, due_date, renewal_count)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [copy.id, holder.id, librarianId, at(issued), day(dueDay), renewed ? 1 : 0],
        );
        track("loans", loan.id);
        audits.push([at(issued), "loan.issue", `«${copy.title}» (${copy.inventory}) → ${holder.name} (${shownPhone(holder.phone)})`, librarianId]);
        loanCount++;
        break;
      }

      const { rows: [loan] } = await client.query(
        `INSERT INTO loans (copy_id, reader_id, issued_by, issued_at, due_date, renewal_count, returned_at, returned_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $3) RETURNING id`,
        [copy.id, reader.id, librarianId, at(issued), day(due), renewed ? 1 : 0, at(returned)],
      );
      track("loans", loan.id);
      loanCount++;
      audits.push([at(issued), "loan.issue", `«${copy.title}» (${copy.inventory}) → ${reader.name} (${shownPhone(reader.phone)})`, librarianId]);
      audits.push([at(returned), "loan.return", `«${copy.title}» (${copy.inventory}) ← ${reader.name}${late ? `, ${late} хоног хоцорсон` : ""}`, librarianId]);

      if (late) {
        // Хуучин торгууль ихэнхдээ төлөгдсөн; сүүлийн сарынх төлөгдөөгүй байж болно
        const status = returned > -30 && rand() < 0.6 ? "unpaid" : rand() < 0.12 ? "waived" : "paid";
        const resolved = status === "unpaid" ? null : at(Math.min(returned + int(0, 10), -1));
        const { rows: [fine] } = await client.query(
          `INSERT INTO fines (loan_id, reader_id, days_late, amount, status, created_at, resolved_at, resolved_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [loan.id, reader.id, late, late * FINE_PER_DAY, status, at(returned), resolved, status === "unpaid" ? null : librarianId],
        );
        track("fines", fine.id);
        fineCount++;
      }
      // Алдартай номыг илүү ойр ойрхон зээлнэ
      t = returned + (popular.has(copy.id) ? int(0, 6) : int(2, 40));
    }
  }

  // Хугацаа хэтэрсэн зээлтэй уншигчийн дүр зураг: хэд хэдэн идэвхтэй зээлийг хоцроо
  await client.query(
    `UPDATE loans SET due_date = (now() AT TIME ZONE 'Asia/Ulaanbaatar')::date - (3 + (id % 9))
     WHERE id IN (SELECT id FROM loans WHERE returned_at IS NULL AND id = ANY($1) ORDER BY id LIMIT 5)`,
    [tracked.filter((r) => r.table === "loans").map((r) => Number(r.id))],
  );

  // Хэдэн хувийг гэмтсэн/алдагдсан болгоно (зээлэгдээгүйнээс)
  await client.query(
    `UPDATE book_copies SET status = CASE WHEN id % 2 = 0 THEN 'damaged' ELSE 'lost' END::copy_status,
       note = CASE WHEN id % 2 = 0 THEN 'Хавтас урагдсан' ELSE 'Уншигч алдсан' END
     WHERE id IN (
       SELECT c.id FROM book_copies c
       WHERE c.id = ANY($1) AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.copy_id = c.id AND l.returned_at IS NULL)
       ORDER BY c.id DESC LIMIT 3)`,
    [copies.map((c) => c.id)],
  );

  // Үйлдлийн бүртгэл (сүүлийн 60 хоногийнх)
  const recent = audits.filter(([ts]) => ts >= day(-60));
  for (let i = 0; i < recent.length; i += 200) {
    const chunk = recent.slice(i, i + 200);
    const values = chunk.map((_, j) => `($${j * 4 + 1}::timestamptz, $${j * 4 + 2}, 'Демо Номын санч', $${j * 4 + 3}, $${j * 4 + 4})`);
    const { rows } = await client.query(
      `INSERT INTO audit_log (at, actor_id, actor_name, action, summary) VALUES ${values.join(", ")} RETURNING id`,
      chunk.flatMap(([ts, action, summary, actor]) => [ts, actor, action, summary]),
    );
    for (const r of rows) track("audit_log", r.id);
  }

  // Бүгдийг бүртгэнэ
  for (let i = 0; i < tracked.length; i += 500) {
    const chunk = tracked.slice(i, i + 500);
    const values = chunk.map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2})`);
    await client.query(
      `INSERT INTO demo_records (table_name, record_id) VALUES ${values.join(", ")}`,
      chunk.flatMap((r) => [r.table, String(r.id)]),
    );
  }

  return { readers: readers.length, books: tracked.filter((r) => r.table === "books").length, copies: copies.length, loans: loanCount, fines: fineCount, credentials };
}

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const cleared = await clear(client);
  if (command === "clear") {
    await client.query("COMMIT");
    console.log("Демо өгөгдлийг устгалаа:", cleared);
  } else {
    const result = await seedData(client);
    await client.query("COMMIT");
    // Нууц үгийг дэлгэцэнд биш, git-д орохгүй файлд бичнэ
    writeFileSync(
      ".demo-credentials.txt",
      `Демо нэвтрэх эрхүүд (${new Date().toISOString().slice(0, 10)})\n\n${result.credentials.join("\n")}\n`,
    );
    console.log(
      `Демо өгөгдөл нэмлээ: ${result.books} ном, ${result.copies} хувь, ${result.readers} уншигч, ${result.loans} зээл, ${result.fines} торгууль.`,
    );
    console.log("Нэвтрэх эрхүүд: .demo-credentials.txt");
  }
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
