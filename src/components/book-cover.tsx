// Номын хавтас: зурагтай бол зураг, үгүй бол нэрээс нь үүсгэсэн даавуун хавтас.
// Серверийн болон клиент компонентод аль алинд нь ажиллана.

// Хавтасны өнгө (даавуун хавтасны өнгөнүүд) — бүгд цагаан бичигтэй 4.5:1+ тодролтой
const PALETTE = ["#1f4d3a", "#1f3a5f", "#6e2a2a", "#4b2d52", "#1d4f55", "#7a2943", "#34373a", "#6b4a1f"];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) | 0;
  return Math.abs(h);
}

export function coverUrl(bookId: number, version: number) {
  return `/covers/${bookId}?v=${version}`;
}

/** Нурууны сүүдэр — зурагтай, зураггүй аль алинд номын мэдрэмж өгнө */
function Spine() {
  return (
    <>
      <div className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/30 to-black/10" />
      <div className="absolute inset-y-0 left-[7%] w-px bg-white/15" />
    </>
  );
}

/** Гуулин өнгийн давхар зураас (хавтасны чимэглэл) */
function Rule() {
  return (
    <div className="flex flex-col gap-[0.25em] opacity-70" aria-hidden>
      <div className="h-px bg-[#d4a95a]" />
      <div className="h-px bg-[#d4a95a]/60" />
    </div>
  );
}

export function BookCover({
  book,
  size = "md",
  className = "",
}: {
  book: { id: number; title: string; author?: string | null; coverVersion: number | null };
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const fontSize = { xs: "text-[5px]", sm: "text-[9px]", md: "text-xs", lg: "text-base" }[size];
  // Дуудагч өргөн (w-20, sm:w-24 г.м.) өгсөн бол өгөгдмөл өргөнийг нэмэхгүй — CSS-ийн дарааллаас болж зөрчилдөхгүй
  const width = /(^|\s)([\w-]+:)?w-/.test(className) ? "" : { xs: "w-10", sm: "w-16", md: "w-full", lg: "w-full" }[size];
  const sizes = `${width} ${fontSize}`;
  const base = `relative aspect-[2/3] shrink-0 overflow-hidden rounded-l-[3px] rounded-r-md bg-zinc-200 shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_16px_-6px_rgb(16_36_28/0.35)] ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10 ${sizes} ${className}`;

  if (book.coverVersion) {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element -- өөрийн кэштэй route-оос; Next-ийн зураг оновчлогч хэрэггүй */}
        <img
          src={coverUrl(book.id, book.coverVersion)}
          alt={`«${book.title}» номын хавтас`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-y-0 left-0 w-[5%] bg-gradient-to-r from-black/25 to-transparent" />
      </div>
    );
  }

  const color = PALETTE[hash(book.title) % PALETTE.length];
  const tiny = size === "xs";
  return (
    <div
      className={base}
      style={{
        backgroundColor: color,
        // Гэрлийн тусгал + доод талын сүүдэр — хавтгай өнгө биш даавуун хавтас шиг
        backgroundImage: "linear-gradient(140deg, rgb(255 255 255 / 0.12), transparent 38%, rgb(0 0 0 / 0.22))",
      }}
      role="img"
      aria-label={`«${book.title}» (хавтасгүй)`}
    >
      <Spine />
      {!tiny && (
        <div className="absolute inset-0 flex flex-col py-[11%] pr-[10%] pl-[17%] text-white">
          <Rule />
          <p
            className="mt-[0.7em] line-clamp-5 font-serif leading-[1.15] font-semibold text-balance"
            style={{ fontSize: size === "lg" ? "1.45em" : "1.2em" }}
          >
            {book.title}
          </p>
          {book.author && (
            <p className="mt-auto mb-[0.6em] line-clamp-2 leading-tight tracking-wide text-white/75">{book.author}</p>
          )}
          <Rule />
        </div>
      )}
    </div>
  );
}
