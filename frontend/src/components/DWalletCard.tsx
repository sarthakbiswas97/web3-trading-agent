import type { DWalletStatus, ExecutorStatus, LiveOnChainData } from "@/lib/types";

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
        <div className={`h-full rounded-full transition-all duration-500 ${danger ? "bg-red-500" : warning ? "bg-amber-500" : "bg-violet-500"}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ExplorerLink({ pubkey, label }: { pubkey: string; label?: string }) {
  const short = pubkey.slice(0, 8) + "..." + pubkey.slice(-4);
  return (
    <a href={`https://explorer.solana.com/address/${pubkey}?cluster=devnet`}
       target="_blank" rel="noopener noreferrer"
       className="text-violet-400 hover:text-violet-300 font-mono text-xs underline decoration-dotted">
      {label || short}
    </a>
  );
}

export default function DWalletCard({
  dwallet, executor, live,
}: {
  dwallet: DWalletStatus | null;
  executor: ExecutorStatus | null;
  live: LiveOnChainData | null;
}) {
  if (!dwallet) return null;
  const limits = dwallet.risk_limits;
  const agent = live?.agent;

  return (
    <div className="bg-gray-900 rounded-2xl border border-violet-500/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\u{1F6E1}\uFE0F"}</span>
          <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Ika dWallet</h2>
        </div>
        <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full ring-1 ring-violet-500/30">
          {agent ? "Live on Devnet" : "Unbypassable"}
        </span>
      </div>

      {agent ? (
        <>
          {/* Real on-chain data */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-400">dWallet</span>
              <ExplorerLink pubkey={agent.dwallet} />
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-400">Agent PDA</span>
              <ExplorerLink pubkey={agent.pda} />
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-400">Trades</span>
              <span className="text-xs font-mono">
                <span className="text-emerald-400">{agent.trades_approved} approved</span>
                {" / "}
                <span className="text-red-400">{agent.trades_rejected} rejected</span>
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <RiskBar label="Position Size" current={executor?.has_position ? 5.0 : 0} max={limits.max_position_bps / 100} />
          <RiskBar label="Daily Loss" current={Math.abs(executor?.daily_pnl_pct ?? 0) * 100} max={limits.max_daily_loss_bps / 100} />
          <RiskBar label="Drawdown" current={(executor?.risk?.current_drawdown_pct ?? 0) * 100} max={limits.max_drawdown_bps / 100} />
        </>
      )}

      {/* Encrypted limits */}
      {agent && (
        <div className="mt-3 p-2.5 bg-violet-500/5 rounded-lg border border-violet-500/10">
          <div className="text-[10px] text-violet-300 font-semibold mb-1.5">Encrypted Risk Limits (on-chain)</div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-gray-500">max_position</span>
              <span className="text-cyan-400 font-mono">{agent.enc_max_position.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">max_daily_loss</span>
              <span className="text-cyan-400 font-mono">{agent.enc_max_daily_loss.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">max_drawdown</span>
              <span className="text-cyan-400 font-mono">{agent.enc_max_drawdown.slice(0, 12)}...</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <div className="w-8 h-9 flex items-center justify-center rounded-b-xl rounded-t-lg bg-violet-500/10 border border-violet-500/30">
          <span className="text-violet-400 text-[10px] font-bold">MPC</span>
        </div>
        <div>
          <div className="text-xs text-gray-400">Custody</div>
          <div className="text-xs font-medium text-violet-300">
            {agent ? "dWallet Active (2PC-MPC)" : "Fallback Mode"}
          </div>
        </div>
      </div>
    </div>
  );
}
