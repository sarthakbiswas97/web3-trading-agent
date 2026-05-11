import type { ExecutorStatus } from "@/lib/types";

export default function ActivityFeed({ executor }: { executor: ExecutorStatus | null }) {
  const trades = executor?.recent_trades?.slice().reverse().slice(0, 8) ?? [];
  const connected = !!executor;

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
        <div className="py-6">
          {connected ? (
            <p className="text-center text-sm text-gray-600">
              No trades yet. The agent will start trading when market conditions meet entry criteria.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Demo trades to show what the feed looks like */}
              <DemoTrade action="BUY" amount="0.3400 SOL @ $148.32" reason="High confidence UP signal" pnl={null} />
              <DemoTrade action="REJECTED" amount="" reason="Position exceeds max_position_bps (500)" pnl={null} ika />
              <DemoTrade action="SELL" amount="0.3400 SOL @ $151.07" reason="Take profit target reached" pnl={2.75} />
              <p className="text-center text-[10px] text-gray-700 mt-3">
                Example trades shown above -- live data appears when the backend is running
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary bar */}
      {connected && executor && (
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

function DemoTrade({
  action, amount, reason, pnl, ika,
}: {
  action: string; amount: string; reason: string; pnl: number | null; ika?: boolean;
}) {
  const isRejected = action === "REJECTED";
  const isBuy = action === "BUY";

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-800/20 text-xs opacity-60">
      <span
        className={`px-2 py-0.5 rounded font-semibold shrink-0 ${
          isRejected
            ? "bg-red-500/15 text-red-400"
            : isBuy
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-amber-500/15 text-amber-400"
        }`}
      >
        {action}
      </span>
      {ika && (
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30 shrink-0">
          Ika
        </span>
      )}
      {amount && <span className="font-mono text-gray-400 shrink-0">{amount}</span>}
      <span className="text-gray-600 truncate flex-1">{reason}</span>
      {pnl !== null && (
        <span className={`font-mono shrink-0 ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
        </span>
      )}
    </div>
  );
}
