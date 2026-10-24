// Тайлангийн энгийн график — нэг цуваа, нэг өнгө (брэндийн ногоон; харанхуй горимд цайвар —
// карт дээр 3:1-ээс дээш тодролтой). Тэмдэглэгээ: багана ≤24px, дээд үзүүр 4px дугуй, суурь шулуун; утгыг hover/focus-оор.

const BAR = "bg-emerald-600 dark:bg-emerald-400";

/** Дээд утгаас дээш хамгийн ойр "цэвэр" тоо (106 → 120), хагас нь ч цэвэр гарна */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return [1, 1.2, 1.6, 2, 3, 4, 5, 6, 8, 10].map((s) => s * magnitude).find((s) => s >= value)!;
}

/** Сар бүрийн баганан график + хүснэгтээр харах */
export function MonthlyColumns({ data }: { data: { label: string; value: number }[] }) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [max, max / 2, 0];
  const peak = Math.max(...data.map((d) => d.value));
  const peakIndex = data.findIndex((d) => d.value === peak);

  return (
    <div>
      <div className="flex gap-2">
        {/* Y тэнхлэгийн утгууд */}
        <div className="flex h-48 flex-col justify-between py-0 text-right text-xs text-zinc-500 tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {t.toLocaleString("mn-MN")}
            </span>
          ))}
        </div>
        <div className="relative h-48 flex-1">
          {/* Сүлжээний шугам — 1px, бүдэг */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-zinc-200 dark:border-zinc-800"
              style={{ bottom: `${(t / max) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-0.5">
            {data.map((d, i) => {
              const showLabel = d.value > 0 && (i === peakIndex || i === data.length - 1);
              return (
                <div
                  key={d.label}
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.value} олголт`}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
                >
                  {showLabel && (
                    <span className="mb-1 text-xs font-medium text-zinc-700 tabular-nums dark:text-zinc-300">{d.value}</span>
                  )}
                  <div
                    className={`w-full max-w-6 rounded-t-[4px] ${BAR} transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80`}
                    style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
                  />
                  {/* Hover/focus tooltip */}
                  <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md group-hover:block group-focus-visible:block dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="text-zinc-500">{d.label}</span>{" "}
                    <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{d.value} олголт</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-0.5 pl-8 text-[11px] text-zinc-500">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center">
            {d.label.slice(5)}
          </span>
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Хүснэгтээр харах</summary>
        <table className="mt-2 w-full max-w-xs text-left">
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.map((d) => (
              <tr key={d.label}>
                <td className="py-1 text-zinc-500">{d.label}</td>
                <td className="py-1 text-right tabular-nums">{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Жагсаалт + нимгэн хэвтээ мөр (хэмжээ) — утга мөрийн үзүүрт */
export function RankedBars({ rows, unit }: { rows: { label: string; sublabel?: string; value: number }[]; unit: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-zinc-500">Мэдээлэл алга</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ol className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`} className="text-sm">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate">
              <span className="mr-2 text-zinc-400 tabular-nums">{i + 1}.</span>
              {r.label}
              {r.sublabel && <span className="ml-2 text-xs text-zinc-500">{r.sublabel}</span>}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {r.value} <span className="font-normal text-zinc-500">{unit}</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className={`h-2 rounded-full ${BAR}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
