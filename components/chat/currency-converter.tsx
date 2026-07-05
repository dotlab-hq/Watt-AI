"use client";

const FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CNY: "🇨🇳",
  INR: "🇮🇳", CAD: "🇨🇦", AUD: "🇦🇺", CHF: "🇨🇭", KRW: "🇰🇷",
  BRL: "🇧🇷", MXN: "🇲🇽", SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰",
  SGD: "🇸🇬", HKD: "🇭🇰", THB: "🇹🇭", ZAR: "🇿🇦", RUB: "🇷🇺",
  PLN: "🇵🇱", CZK: "🇨🇿", TRY: "🇹🇷", ARS: "🇦🇷", EGP: "🇪🇬",
  NGN: "🇳🇬", KES: "🇰🇪", GHS: "🇬🇭", PHP: "🇵🇭", IDR: "🇮🇩",
  MYR: "🇲🇾", VND: "🇻🇳", TWD: "🇹🇼", NZD: "🇳🇿", SAR: "🇸🇦",
  AED: "🇦🇪", ILS: "🇮🇱", PKR: "🇵🇰", BDT: "🇧🇩", LKR: "🇱🇰",
};

export function CurrencyConverter({
  result,
}: {
  result:
    | { amount: number; from: string; to: string; rate: number; result: number; date?: string }
    | { error: string };
}) {
  if ("error" in result) {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-4">
        <div className="mb-2 text-muted-foreground text-xs">Currency Converter</div>
        <div className="text-destructive text-sm">{result.error}</div>
      </div>
    );
  }

  const fmt = (val: number, code: string) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-4">
      <div className="mb-3 text-muted-foreground text-xs">Currency Converter</div>

      <div className="flex items-center gap-4">
        {/* From */}
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">{FLAGS[result.from] || "💱"}</span>
            <span className="font-medium text-sm">{result.from}</span>
          </div>
          <div className="font-light text-2xl text-foreground">
            {fmt(result.amount, result.from)}
          </div>
        </div>

        {/* Arrow */}
        <div className="shrink-0 text-muted-foreground text-xl">→</div>

        {/* To */}
        <div className="flex-1 text-right">
          <div className="mb-1 flex items-center justify-end gap-2">
            <span className="font-medium text-sm">{result.to}</span>
            <span className="text-lg">{FLAGS[result.to] || "💱"}</span>
          </div>
          <div className="font-light text-2xl text-emerald-600 dark:text-emerald-400">
            {fmt(result.result, result.to)}
          </div>
        </div>
      </div>

      <div className="mt-3 border-border/50 border-t pt-2 text-center text-muted-foreground text-xs">
        1 {result.from} = {result.rate.toFixed(4)} {result.to}
        {result.date && <span className="ml-2">({result.date})</span>}
      </div>
    </div>
  );
}
