import type { ExecutorStatus, DWalletStatus } from "@/lib/types";

export default function RejectionShowcase({
  executor, dwallet,
}: {
  executor: ExecutorStatus | null;
  dwallet: DWalletStatus | null;
}) {
  const rejection = executor?.recent_trades
    ?.slice()
    .reverse()
    .find(t => !t.success);

  const maxPos = dwallet?.risk_limits?.max_position_bps ?? 500;

  return (
    <div className={`mb-6 rounded-2xl border-l-4 ${
      rejection ? "border-l-red-500 bg-gray-900" : "border-l-gray-700 bg-gray-900/50"
    } border border-gray-800 p-5`}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Narrative */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{rejection ? "\u{1F6D1}" : "\u{1F6E1}\uFE0F"}</span>
            <h2 className={`text-lg font-bold ${rejection ? "text-red-400" : "text-gray-500"}`}>
              {rejection ? "Trade Rejected" : "Risk Guardrails Active"}
            </h2>
            {rejection && (
              <span className="text-[10px] bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full ring-1 ring-violet-500/30">
                Ika Enforced
              </span>
            )}
          </div>

          {rejection ? (
            <p className="text-sm text-gray-300 leading-relaxed">
              The AI wanted to{" "}
              <span className="text-amber-400 font-medium">{rejection.action}</span>{" "}
              <span className="font-mono text-white">{rejection.amount.toFixed(4)} SOL</span>{" "}
              at <span className="font-mono text-white">${rejection.price.toFixed(2)}</span>,
              but the on-chain risk check{" "}
              <span className="text-red-400 font-semibold">blocked it</span> because{" "}
              <span className="text-violet-400">{rejection.reason}</span>.
            </p>
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">
              The on-chain program checks every trade against{" "}
              <span className="text-violet-400">dWallet-enforced limits</span> before
              allowing execution. Trades that exceed position size, daily loss, or
              drawdown limits are <span className="text-red-400">cryptographically blocked</span> --
              the MPC wallet physically cannot sign the transaction.
            </p>
          )}
        </div>

        {/* Right: Visual risk bar */}
        <div className="w-full md:w-64 flex flex-col justify-center">
          <div className="text-xs text-gray-500 mb-1.5">Position Size Limit</div>
          <div className="relative h-6 bg-gray-800 rounded-full overflow-visible">
            {/* Max limit line */}
            <div
              className="absolute top-0 h-full border-r-2 border-dashed border-violet-400 z-10"
              style={{ left: `${Math.min(100, (maxPos / 100))}%` }}
            />
            <div
              className="absolute -top-5 text-[10px] text-violet-400 font-mono"
              style={{ left: `${Math.min(95, (maxPos / 100) - 2)}%` }}
            >
              {(maxPos / 100).toFixed(0)}% max
            </div>
            {/* Current/attempted bar */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                rejection ? "bg-red-500" : "bg-emerald-500/60"
              }`}
              style={{
                width: rejection
                  ? `${Math.min(100, (maxPos / 100) + 30)}%`
                  : `${Math.min(100, executor?.has_position ? 40 : 10)}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-gray-600 mt-1 text-right">
            {rejection ? "Attempted size exceeded limit" : "Within safe range"}
          </div>
        </div>
      </div>
    </div>
  );
}
