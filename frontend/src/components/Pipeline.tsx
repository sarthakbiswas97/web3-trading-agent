import type { AgentStatus, PredictionResponse, EncryptStatus, DWalletStatus, ExecutorStatus } from "@/lib/types";

function Node({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub?: string; color: string; icon: string;
}) {
  const bg: Record<string, string> = {
    gray: "bg-gray-800/60 border-gray-700",
    amber: "bg-amber-500/10 border-amber-500/30",
    cyan: "bg-cyan-500/10 border-cyan-500/30",
    violet: "bg-violet-500/10 border-violet-500/30",
    emerald: "bg-emerald-500/10 border-emerald-500/30",
    red: "bg-red-500/10 border-red-500/30",
  };
  const text: Record<string, string> = {
    gray: "text-gray-300", amber: "text-amber-400", cyan: "text-cyan-400",
    violet: "text-violet-400", emerald: "text-emerald-400", red: "text-red-400",
  };

  return (
    <div className={`flex flex-col items-center justify-center w-36 h-24 rounded-xl border ${bg[color]} px-3`}>
      <span className="text-lg mb-1">{icon}</span>
      <span className={`text-xs font-semibold uppercase tracking-wider ${text[color]}`}>{label}</span>
      <span className="text-sm font-mono text-white mt-0.5">{value}</span>
      {sub && <span className="text-[10px] text-gray-500">{sub}</span>}
    </div>
  );
}

function Arrow({ color = "gray" }: { color?: string }) {
  const borderColor: Record<string, string> = {
    gray: "border-gray-700", amber: "border-amber-500/40",
    cyan: "border-cyan-500/40", violet: "border-violet-500/40",
  };
  return (
    <div className="flex items-center px-1">
      <div className={`w-8 border-t-2 border-dashed ${borderColor[color]} pipeline-line`} />
      <div className={`w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] ${
        color === "gray" ? "border-l-gray-600" :
        color === "amber" ? "border-l-amber-500/60" :
        color === "cyan" ? "border-l-cyan-500/60" :
        "border-l-violet-500/60"
      }`} />
    </div>
  );
}

export default function Pipeline({
  agent, prediction, encrypt, dwallet, executor,
}: {
  agent: AgentStatus | null;
  prediction: PredictionResponse | null;
  encrypt: EncryptStatus | null;
  dwallet: DWalletStatus | null;
  executor: ExecutorStatus | null;
}) {
  const connected = !!agent;
  const price = agent?.latest_price;
  const dir = prediction?.prediction?.direction;
  const conf = prediction?.prediction?.confidence;
  const encCount = encrypt?.encrypt?.encrypted_values_count ?? 0;
  const hasRejection = executor?.recent_trades?.some(t => !t.success);
  const lastTrade = executor?.recent_trades?.length
    ? executor.recent_trades[executor.recent_trades.length - 1]
    : null;

  const resultColor = lastTrade ? (lastTrade.success ? "emerald" : "red") : "gray";
  const resultValue = lastTrade
    ? (lastTrade.success ? lastTrade.action : "REJECTED")
    : "Waiting...";

  // Demo values for disconnected state
  const demoPrice = "$148.32";
  const demoPrediction = "UP 73%";
  const demoEncrypt = "3 encrypted";
  const demoRisk = "3/3 OK";
  const demoResult = "BUY";

  return (
    <div className="mb-6 p-5 bg-gray-900 rounded-2xl border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Trade Pipeline
        </h2>
        {!connected && (
          <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
            Demo preview
          </span>
        )}
      </div>
      <div className="flex items-center justify-center overflow-x-auto gap-0 py-2">
        <Node
          icon={"\u{1F4C8}"}
          label="Market Data"
          value={connected ? (price ? `$${price.toFixed(2)}` : "---") : demoPrice}
          sub="Birdeye / Jupiter"
          color={connected ? "gray" : "gray"}
        />
        <Arrow color="amber" />
        <Node
          icon={"\u{1F9E0}"}
          label="AI Prediction"
          value={connected ? (dir && conf ? `${dir} ${(conf * 100).toFixed(0)}%` : "---") : demoPrediction}
          sub="XGBoost + SHAP"
          color="amber"
        />
        <Arrow color="cyan" />
        <Node
          icon={"\u{1F512}"}
          label="Encrypt FHE"
          value={connected ? (encCount > 0 ? `${encCount} encrypted` : "Ready") : demoEncrypt}
          sub="Anti front-run"
          color="cyan"
        />
        <Arrow color="violet" />
        <Node
          icon={"\u{1F6E1}\uFE0F"}
          label="Risk Check"
          value={connected ? (executor?.risk?.trading_enabled ? "3/3 OK" : "HALTED") : demoRisk}
          sub="On-chain limits"
          color="violet"
        />
        <Arrow color={connected ? resultColor : "emerald"} />
        <Node
          icon={connected ? (lastTrade?.success ? "\u2705" : hasRejection ? "\u{1F6D1}" : "\u23F3") : "\u2705"}
          label={connected ? (lastTrade?.success ? "Executed" : hasRejection ? "Blocked" : "Result") : "Executed"}
          value={connected ? resultValue : demoResult}
          sub={connected ? (lastTrade?.success ? "Jupiter swap" : hasRejection ? "dWallet refused" : "") : "Jupiter swap"}
          color={connected ? resultColor : "emerald"}
        />
      </div>
      {!connected && (
        <p className="text-center text-[10px] text-gray-600 mt-3">
          Data flows left to right: market data feeds the AI model, predictions are encrypted via FHE,
          risk limits are checked on-chain, and trades execute through Jupiter.
        </p>
      )}
    </div>
  );
}
