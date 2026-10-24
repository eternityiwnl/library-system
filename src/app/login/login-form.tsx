"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, Notice } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { normalizePhone } from "@/lib/phone";

// Нэвтрэлтийг Server Action биш, /api/auth-аар дамжуулна — тэнд оролдлогын хязгаар (rate limit) ажиллана
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");

    // Имэйл биш бол утасны дугаар: "9911 2233", "+976 99112233" → "99112233"
    const isEmail = identifier.includes("@");
    const phone = isEmail ? null : normalizePhone(identifier);
    if (!isEmail && !phone) {
      setError("Утасны дугаараа 8 оронтойгоор оруулна уу.");
      return;
    }

    setPending(true);
    setError("");
    const { error } = isEmail
      ? await authClient.signIn.email({ email: identifier, password })
      : await authClient.signIn.username({ username: phone!, password });

    if (error) {
      setPending(false);
      if (error.status === 429) {
        setError("Хэт олон удаа оролдлоо. Нэг минутын дараа дахин оролдоно уу.");
      } else if (error.code === "BANNED_USER") {
        setError("Таны эрх идэвхгүй байна. Номын санчид хандана уу.");
      } else {
        setError("Нэвтрэх нэр эсвэл нууц үг буруу байна.");
      }
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <Notice tone="error">{error}</Notice>}
      <Field
        label="Утасны дугаар эсвэл имэйл"
        name="identifier"
        placeholder="9911 2233"
        autoComplete="username"
        autoCapitalize="none"
        required
        autoFocus
      />
      <Field label="Нууц үг" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={pending} size="lg" className="mt-2">
        {pending ? "Нэвтэрч байна…" : "Нэвтрэх"}
      </Button>
    </form>
  );
}
