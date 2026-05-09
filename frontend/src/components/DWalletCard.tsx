import type { DWalletStatus, ExecutorStatus } from "@/lib/types";

function RiskBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const danger = pct > 80;
  const warning = pct > 50;

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs font-mono ${danger ? "text-red-400" : warning ? "text-amber-400" : "text-gray-300"}`}>
          {current.toFixed(1)}% / {max.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            danger ? "bg-red-500" : warning ? "bg-amber-500" : "bg-violet-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DWalletCard({
  dwallet, executor,
}: {
  dwallet: DWalletStatus | null;
  executor: ExecutorStatus | null;
}) {
  if (!dwallet) return null;

  const limits = dwallet.risk_limits;
  const approved = executor?.recent_trades?.filter(t => t.success).length ?? 0;
  const rejected = executor?.recent_trades?.filter(t => !t.success).length ?? 0;

  return (
    <div className="bg-gray-900 rounded-2xl border border-violet-500/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\u{1F6E1}\uFE0F"}</span>
          <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">
            Ika dWallet
          </h2>
        </div>
        <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full ring-1 ring-violet-500/30">
          Unbypassable
        </span>
      </div>

      {/* Risk bars */}
      <RiskBar
        label="Position Size"
        current={executor?.has_position ? 5.0 : 0}
        max={limits.max_position_bps / 100}
      />
      <RiskBar
        label="Daily Loss"
        current={Math.abs(executor?.daily_pnl_pct ?? 0) * 100}
        max={limits.max_daily_loss_bps / 100}
      />
      <RiskBar
        label="Drawdown"
        current={(executor?.risk?.current_drawdown_pct ?? 0) * 100}
        max={limits.max_drawdown_bps / 100}
      />

      {/* MPC Shield + counters */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-9 flex items-center justify-center rounded-b-xl rounded-t-lg bg-violet-500/10 border border-violet-500/30">
            <span className="text-violet-400 text-[10px] font-bold">MPC</span>
          </div>
          <div>
            <div className="text-xs text-gray-400">Custody Mode</div>
            <div className="text-xs font-medium text-violet-300">
              {dwallet.dwallet.initialized ? "dWallet Active" : "Fallback (Local)"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400">{approved} approved</span>
            <span className="text-red-400">{rejected} rejected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
