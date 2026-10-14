// Анхны админ бүртгэл үүсгэнэ. Нууц үгийг терминалд нуугдмал байдлаар асууна.
//   npm run create-admin
// Dev болон production нэг Neon DB ашиглаж байгаа тул шууд production-д үүснэ.
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { Pool } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const rl = createInterface({ input: stdin, output: stdout });
// Мөр уншигч: терминал болон pipe-аар өгсөн оролт хоёуланд ажиллана
const lines = rl[Symbol.asyncIterator]();
// readline бичсэн тэмдэгтийг _writeToOutput-аар хэвлэдэг — нууц үг асуух үед дарна
const echo = rl as unknown as { _writeToOutput: (s: string) => void };
const writeOriginal = echo._writeToOutput.bind(rl);
let muted = false;
echo._writeToOutput = (s) => {
  if (!muted) writeOriginal(s);
  else if (s.includes("\n") || s.includes("\r")) writeOriginal("\n");
};

async function ask(question: string, hidden = false) {
  stdout.write(question);
  muted = hidden;
  const { value } = await lines.next();
  muted = false;
  return String(value ?? "");
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL алга. --env-file=.env.local гэж ажиллуулна уу.");

const name = (await ask("Овог нэр: ")).trim();
const email = (await ask("Имэйл: ")).trim().toLowerCase();
const password = await ask("Нууц үг (8+ тэмдэгт): ", true);
const confirm = await ask("Нууц үг давтах: ", true);
rl.close();

if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Нэр эсвэл имэйл буруу байна.");
if (password.length < 8) throw new Error("Нууц үг дор хаяж 8 тэмдэгт байх ёстой.");
if (password !== confirm) throw new Error("Нууц үг таарахгүй байна.");

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const existing = await client.query('SELECT 1 FROM "user" WHERE email = $1', [email]);
  if (existing.rowCount) throw new Error("Энэ имэйлтэй хэрэглэгч аль хэдийн байна.");

  const userId = randomUUID();
  await client.query(
    `INSERT INTO "user" (id, name, email, email_verified, role, must_change_password, created_at, updated_at)
     VALUES ($1, $2, $3, true, 'admin', false, now(), now())`,
    [userId, name, email],
  );
  await client.query(
    `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
    [randomUUID(), userId, await hashPassword(password)],
  );
  await client.query("COMMIT");
  console.log(`Админ үүслээ: ${email}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
