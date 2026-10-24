import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const ROLES = ["admin", "librarian", "reader"] as const;
export type Role = (typeof ROLES)[number];

export const PRODUCTION_URL = "https://library-system-nine-pink.vercel.app";

export const auth = betterAuth({
  appName: "Номын сан",
  baseURL: {
    // Зөвхөн өөрийн хаягууд. "*.vercel.app" гэвэл бусдын сайт ч итгэмжлэгдэнэ.
    allowedHosts: [
      "library-system-nine-pink.vercel.app",
      "library-system-git-main-nity2.vercel.app",
      "localhost:3000",
      "localhost:3100",
    ],
    fallback: PRODUCTION_URL,
    protocol: process.env.NODE_ENV === "production" ? "https" : "http",
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Уншигчийг номын санч бүртгэнэ — өөрөө бүртгүүлэх боломжгүй
    disableSignUp: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: false },
      mustChangePassword: { type: "boolean", defaultValue: false, input: false },
    },
  },
  // Хэрэглэгч өөрийн мэдээллийг өөрчлөх, бүртгэлээ устгах, имэйлээр нууц үг
  // сэргээх замуудыг хаана. Эдгээрийг ажилтнууд серверийн талаас хийнэ.
  disabledPaths: [
    "/sign-up/email",
    "/update-user",
    "/change-email",
    "/delete-user",
    "/request-password-reset",
    "/reset-password",
    "/is-username-available",
    // Admin plugin-ийн HTTP замууд. Хэрэглэгч үүсгэх г.м.-ийг манай Server Action-ууд
    // auth.api-аар серверээс дууддаг (энэ жагсаалт зөвхөн хөтчөөс ирэх хүсэлтийг хаана).
    // Хаахгүй бол админ эрхтэй сесс аудитын бүртгэлгүйгээр хэрэглэгч устгах, эрх солих,
    // өөр хүн болж нэвтрэх (impersonate) боломжтой.
    ...[
      "ban-user",
      "create-user",
      "get-user",
      "has-permission",
      "impersonate-user",
      "list-user-sessions",
      "list-users",
      "remove-user",
      "revoke-user-session",
      "revoke-user-sessions",
      "set-role",
      "set-user-password",
      "stop-impersonating",
      "unban-user",
      "update-user",
    ].map((name) => `/admin/${name}`),
  ],
  rateLimit: {
    // Serverless дээр санах ой хуваалцагдахгүй тул DB-д хадгална
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/username": { window: 60, max: 5 },
    },
  },
  plugins: [
    // username = уншигчийн утасны дугаар (8 оронтой цифр, normalizePhone-оор цэвэрлэсэн)
    username({
      minUsernameLength: 8,
      maxUsernameLength: 8,
      usernameValidator: (value) => /^\d{8}$/.test(value),
      immutableUsername: true,
      displayUsername: false,
    }),
    admin({ defaultRole: "reader", adminRoles: ["admin"] }),
    // Server Action дотор cookie тохируулахад хэрэгтэй — үргэлж хамгийн сүүлд
    nextCookies(),
  ],
});
