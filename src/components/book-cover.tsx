// Номын хавтас: зурагтай бол зураг, үгүй бол нэрээс нь үүсгэсэн өнгөт хавтас.
// Серверийн болон клиент компонентод аль алинд нь ажиллана.

// Хавтасны өнгө — бүгд цагаан бичигтэй 4.5:1+ тодролтой
const PALETTE = ["#065f46", "#1e3a8a", "#7c2d12", "#581c87", "#134e4a", "#831843", "#3f3f46", "#713f12"];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) | 0;
  return Math.abs(h);
}

export function coverUrl(bookId: number, version: number) {
  return `/covers/${bookId}?v=${version}`;
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
  const sizes = {
    xs: "w-10 text-[5px]",
    sm: "w-16 text-[9px]",
    md: "w-full text-xs",
    lg: "w-full text-base",
  }[size];
  const base = `relative aspect-[2/3] shrink-0 overflow-hidden rounded-md bg-zinc-200 shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10 ${sizes} ${className}`;

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
      </div>
    );
  }

  const color = PALETTE[hash(book.title) % PALETTE.length];
  const tiny = size === "xs";
  return (
    <div className={base} style={{ backgroundColor: color }} role="img" aria-label={`«${book.title}» (хавтасгүй)`}>
      {/* Нурууны зураас — номын мэдрэмж өгнө */}
      <div className="absolute inset-y-0 left-0 w-[6%] bg-black/20" />
      {!tiny && (
        <div className="absolute inset-0 flex flex-col justify-between p-[10%] pl-[14%] text-white">
          <p className="line-clamp-5 leading-tight font-semibold" style={{ fontSize: size === "lg" ? "1.35em" : "1.15em" }}>
            {book.title}
          </p>
          {book.author && <p className="line-clamp-2 leading-tight opacity-80">{book.author}</p>}
        </div>
      )}
    </div>
  );
}
