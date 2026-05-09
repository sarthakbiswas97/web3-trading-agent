import type { ExecutorStatus } from "@/lib/types";

export default function ActivityFeed({ executor }: { executor: ExecutorStatus | null }) {
  const trades = executor?.recent_trades?.slice().reverse().slice(0, 8) ?? [];

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Activity Feed
      </h2>

      {trades.length > 0 ? (
        <div className="space-y-1.5 max-h-44 overflow-y-auto">
          {trades.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-800/30 text-xs"
            >
              {/* Badge */}
              <span
                className={`px-2 py-0.5 rounded font-semibold shrink-0 ${
                  !t.success
                    ? "bg-red-500/15 text-red-400"
                    : t.action === "BUY"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {t.success ? t.action : "REJECTED"}
              </span>

              {/* Ika tag on rejections */}
              {!t.success && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30 shrink-0">
                  Ika
                </span>
              )}

              {/* Details */}
              {t.success && (
                <span className="font-mono text-gray-300 shrink-0">
                  {t.amount.toFixed(4)} SOL @ ${t.price.toFixed(2)}
                </span>
              )}

              {/* Reason */}
              <span className="text-gray-500 truncate flex-1">{t.reason}</span>

              {/* PnL */}
              {t.pnl !== null && (
                <span className={`font-mono shrink-0 ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-600 text-sm">
          No trades yet. The agent will start trading when market conditions meet entry criteria.
        </div>
      )}

      {/* Summary bar */}
      {executor && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
          <span>Capital: <span className="text-white font-mono">${executor.capital.current.toLocaleString()}</span></span>
          <span>Trades today: <span className="text-white font-mono">{executor.trades_today}</span></span>
          <span>
            Daily PnL:{" "}
            <span className={`font-mono ${executor.daily_pnl_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {(executor.daily_pnl_pct * 100).toFixed(2)}%
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
