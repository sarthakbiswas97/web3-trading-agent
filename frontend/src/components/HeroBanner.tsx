import type { AgentStatus, PredictionResponse, EncryptStatus, DWalletStatus } from "@/lib/types";

function Pill({ color, label, active }: { color: string; label: string; active: boolean }) {
  const colors: Record<string, string> = {
    amber: active ? "bg-amber-500/15 text-amber-400 ring-amber-500/30" : "bg-gray-800 text-gray-500 ring-gray-700",
    cyan: active ? "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30" : "bg-gray-800 text-gray-500 ring-gray-700",
    violet: active ? "bg-violet-500/15 text-violet-400 ring-violet-500/30" : "bg-gray-800 text-gray-500 ring-gray-700",
  };
  const dotColor: Record<string, string> = {
    amber: active ? "bg-amber-400" : "bg-gray-600",
    cyan: active ? "bg-cyan-400" : "bg-gray-600",
    violet: active ? "bg-violet-400" : "bg-gray-600",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${colors[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[color]} ${active ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

export default function HeroBanner({
  agent, prediction, encrypt, dwallet,
}: {
  agent: AgentStatus | null;
  prediction: PredictionResponse | null;
  encrypt: EncryptStatus | null;
  dwallet: DWalletStatus | null;
}) {
  const connected = !!agent;
  const price = agent?.latest_price ?? 0;
  const dir = prediction?.prediction?.direction;
  const conf = prediction?.prediction?.confidence;

  return (
    <div className="relative mb-6">
      <div className="px-6 py-6 bg-gray-900 rounded-2xl border border-gray-800">
        {/* Top row: Title + Status pills */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">VAPM</h1>
            <p className="text-sm text-gray-400 mt-1">Verifiable AI Portfolio Manager</p>
            <p className="text-xs text-gray-500 mt-1.5 max-w-md leading-relaxed">
              Autonomous SOL/USDC trading agent with XGBoost ML predictions,
              Encrypt FHE privacy (anti-front-running), and Ika dWallet custody
              (cryptographically enforced risk limits).
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Pill color="amber" label="AI Model" active={!!prediction} />
            <Pill color="cyan" label="Encrypt FHE" active={!!encrypt?.encrypt?.initialized} />
            <Pill color="violet" label="Ika dWallet" active={!!dwallet?.dwallet?.initialized} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mb-5" />

        {connected ? (
          /* Connected: Price + Prediction */
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">SOL / USDC</p>
              <p className="text-4xl font-mono font-bold text-white tabular-nums">
                ${price > 0 ? price.toFixed(2) : "---"}
              </p>
            </div>
            <div className="text-right">
              {dir && conf !== undefined ? (
                <>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prediction</p>
                  <p className={`text-2xl font-bold ${dir === "UP" ? "text-emerald-400" : "text-red-400"}`}>
                    {dir === "UP" ? "\u2191" : "\u2193"} {dir}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {(conf * 100).toFixed(0)}% confidence
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prediction</p>
                  <p className="text-sm text-gray-600">Awaiting model output...</p>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Disconnected: Architecture overview */
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Demo Mode -- Backend Offline</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ArchCard
                accent="amber"
                title="ML Prediction"
                description="XGBoost model with 23 technical features. SHAP explainability shows why each trade is proposed."
              />
              <ArchCard
                accent="cyan"
                title="Encrypt FHE"
                description="Confidence scores encrypted on-chain via fully homomorphic encryption. Prevents front-running."
              />
              <ArchCard
                accent="violet"
                title="Ika dWallet"
                description="MPC distributed custody. Risk limits enforced cryptographically -- the wallet physically cannot sign bad trades."
              />
            </div>
          </div>
        )}
      </div>
      {/* Gradient underline */}
      <div className="h-0.5 bg-gradient-to-r from-amber-500 via-cyan-500 to-violet-500 rounded-full mx-4 -mt-0.5" />
    </div>
  );
}

function ArchCard({ accent, title, description }: { accent: string; title: string; description: string }) {
  const border: Record<string, string> = {
    amber: "border-amber-500/20",
    cyan: "border-cyan-500/20",
    violet: "border-violet-500/20",
  };
  const text: Record<string, string> = {
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
  };
  const bg: Record<string, string> = {
    amber: "bg-amber-500/5",
    cyan: "bg-cyan-500/5",
    violet: "bg-violet-500/5",
  };

  return (
    <div className={`rounded-xl border ${border[accent]} ${bg[accent]} p-4`}>
      <h3 className={`text-sm font-semibold ${text[accent]} mb-1.5`}>{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
