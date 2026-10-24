import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-700 text-white shadow-sm shadow-emerald-950/15 inset-shadow-[0_1px_0_rgb(255_255_255/0.12)] hover:bg-emerald-800 disabled:bg-emerald-700/60 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 shadow-card hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
  danger: "bg-red-600 text-white shadow-sm shadow-red-950/15 hover:bg-red-700 disabled:bg-red-600/60",
};

type Size = "sm" | "md" | "lg";

// Хэмжээг className-аар биш size-аар өгнө — h-8/h-10 хоёр зэрэг байвал CSS-ийн дарааллаар аль нь ялах нь тодорхойгүй
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,transform] active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 [&>svg]:size-4";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${buttonBase} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${buttonBase} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
}

const controlBase =
  "rounded-lg border border-zinc-300 bg-white text-base text-zinc-900 shadow-[inset_0_1px_1px_rgb(16_36_28/0.04)] outline-none transition-[border-color,box-shadow] hover:border-zinc-400 focus:border-emerald-600 focus:ring-[3px] focus:ring-emerald-600/20 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 sm:text-sm";

const labelText = "font-medium text-zinc-800 dark:text-zinc-200";

export function Field({
  label,
  error,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; error?: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className={labelText}>
        {label}
        {props.required && <span className="text-red-600"> *</span>}
      </span>
      <input aria-invalid={error ? true : undefined} className={`h-10 px-3 ${controlBase}`} {...props} />
      {error ? (
        <span className="text-red-600 dark:text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Textarea({
  label,
  error,
  ...props
}: ComponentProps<"textarea"> & { label: string; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className={labelText}>{label}</span>
      <textarea aria-invalid={error ? true : undefined} rows={4} className={`px-3 py-2 ${controlBase}`} {...props} />
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: ComponentProps<"select"> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className={labelText}>{label}</span>
      <select
        // React 19 маягт илгээсний дараа анхны сонголт руу reset хийдэг; defaultValue
        // өөрчлөгдөхөд дахин mount хийснээр хадгалсан утга харагдана
        key={String(props.defaultValue)}
        className={`h-10 px-3 ${controlBase}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-card dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

const noticeStyles = {
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/70 dark:bg-red-950/60 dark:text-red-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-50",
  warning: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-50",
};

const noticeIcons = {
  error: <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />,
  success: <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />,
  warning: <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />,
};

export function Notice({ tone, children }: { tone: "error" | "success" | "warning"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${noticeStyles[tone]}`}
    >
      {noticeIcons[tone]}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** FormState-ийн error/warning/success-ийг харуулна */
export function StateNotice({ state }: { state: { error?: string; warning?: string; success?: string } }) {
  if (state.error) return <Notice tone="error">{state.error}</Notice>;
  if (state.warning) return <Notice tone="warning">{state.warning}</Notice>;
  if (state.success) return <Notice tone="success">{state.success}</Notice>;
  return null;
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-serif text-[1.75rem] leading-tight font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ tone, children }: { tone: "green" | "gray" | "red"; children: ReactNode }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-400/20",
    gray: "bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/10",
    red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-200 dark:ring-red-400/20",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${styles}`}
    >
      {tone !== "gray" && <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  );
}

const pageLink =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 shadow-card hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";

/** Хуудаслалт: href(p) нь p-р хуудасны холбоос */
export function Pagination({
  page,
  pages,
  href,
  total,
}: {
  page: number;
  pages: number;
  href: (page: number) => string;
  total?: number;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-5 flex flex-wrap items-center gap-3 text-sm" aria-label="Хуудаслалт">
      {page > 1 && (
        <Link href={href(page - 1)} className={pageLink}>
          <ChevronLeft className="size-4" aria-hidden /> Өмнөх
        </Link>
      )}
      <span className="text-zinc-500 tabular-nums">
        {page} / {pages} хуудас{total !== undefined && ` · нийт ${total}`}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className={pageLink}>
          Дараах <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}

/** Нэг удаа харуулах түр нууц үг */
export function PasswordReveal({ password }: { password: string }) {
  return (
    <Notice tone="success">
      <p>Түр нууц үг (зөвхөн одоо харагдана — хэрэглэгчид бичиж өгнө үү):</p>
      <p className="mt-2 inline-block rounded-md border border-dashed border-emerald-600/40 bg-white/70 px-3 py-1.5 font-mono text-xl tracking-wider select-all dark:bg-black/20">
        {password}
      </p>
      <p className="mt-2 text-xs opacity-80">Анх нэвтрэхэд шинэ нууц үг тохируулахыг шаардана.</p>
    </Notice>
  );
}
