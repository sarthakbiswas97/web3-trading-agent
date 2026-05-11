import type { EncryptStatus, PredictionResponse, LiveOnChainData } from "@/lib/types";

export default function EncryptCard({
  encrypt, prediction, live,
}: {
  encrypt: EncryptStatus | null;
  prediction: PredictionResponse | null;
  live: LiveOnChainData | null;
}) {
  const agent = live?.agent;
  const trades = live?.trades ?? [];
  const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;

  // Show card even when disconnected -- with explanatory content
  const connected = !!encrypt;

  return (
    <div className="bg-gray-900 rounded-2xl border border-cyan-500/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\u{1F512}"}</span>
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Encrypt FHE</h2>
        </div>
        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full ring-1 ring-cyan-500/30">
          {agent ? "Live Ciphertexts" : "Anti Front-Running"}
        </span>
      </div>

      {connected ? (
        <>
          {/* Encrypted values visualization */}
          <div className="space-y-2 mb-4">
            {lastTrade ? (
              <>
                <div className="text-[10px] text-gray-500 uppercase mb-1">Latest Trade -- Encrypted Parameters</div>
                <EncRow label="position_size" plaintext="***" ct={lastTrade.enc_position} />
                <EncRow label="daily_pnl" plaintext="***" ct={lastTrade.enc_pnl} />
                <EncRow label="drawdown" plaintext="***" ct={lastTrade.enc_drawdown} />
              </>
            ) : (
              <>
                <div className="text-[10px] text-gray-500 uppercase mb-1">Risk Limits -- Encrypted On-Chain</div>
                <EncRow label="max_position" plaintext="***" ct={agent?.enc_max_position} />
                <EncRow label="max_daily_loss" plaintext="***" ct={agent?.enc_max_daily_loss} />
                <EncRow label="max_drawdown" plaintext="***" ct={agent?.enc_max_drawdown} />
              </>
            )}
          </div>

          {/* FHE computation results */}
          {lastTrade && lastTrade.fhe_pos_ok !== "11111111111111111111111111111111" && (
            <div className="p-2.5 bg-cyan-500/5 rounded-lg border border-cyan-500/10 mb-3">
              <div className="text-[10px] text-cyan-300 font-semibold mb-1">FHE Risk Check Results</div>
              <div className="space-y-1 text-[10px]">
                <FheResult label="position <= max" ct={lastTrade.fhe_pos_ok} />
                <FheResult label="daily_pnl <= max" ct={lastTrade.fhe_pnl_ok} />
                <FheResult label="drawdown <= max" ct={lastTrade.fhe_dd_ok} />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div>
              <span className="text-2xl font-bold text-white">{agent?.decision_count ?? 0}</span>
              <span className="text-xs text-gray-500 ml-1.5">proposals</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600">Encrypt Program</div>
              <code className="text-[10px] text-cyan-500/70">
                {live?.encrypt_program ? live.encrypt_program.slice(0, 8) + "..." : "---"}
              </code>
            </div>
          </div>
        </>
      ) : (
        /* Disconnected state: explain what Encrypt does */
        <>
          <div className="space-y-2 mb-4">
            <div className="text-[10px] text-gray-500 uppercase mb-1">How Encrypt FHE Works</div>
            <EncRow label="confidence" plaintext="0.73" ct="Enc(0x3a7f...)" />
            <EncRow label="position_bps" plaintext="350" ct="Enc(0x8b2c...)" />
            <EncRow label="drawdown_pct" plaintext="1.2" ct="Enc(0xd1e9...)" />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Trading signals are encrypted before on-chain storage using fully homomorphic encryption.
            Risk checks run on ciphertexts -- the program verifies limits without ever seeing plaintext values.
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div>
              <span className="text-2xl font-bold text-gray-600">--</span>
              <span className="text-xs text-gray-600 ml-1.5">proposals</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600">Encrypt Program</div>
              <code className="text-[10px] text-gray-600">Awaiting connection</code>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EncRow({ label, plaintext, ct }: { label: string; plaintext: string; ct?: string }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
      <div className="flex-1">
        <div className="text-[10px] text-gray-500 uppercase mb-0.5">{label}</div>
        <div className="text-sm font-mono text-gray-300 blur-[3px] select-none">{plaintext}</div>
      </div>
      <div className="text-gray-600">{"\u2192"}</div>
      <div className="flex-1 text-right">
        <div className="text-[10px] text-gray-500 uppercase mb-0.5">On-Chain (FHE)</div>
        <div className="text-xs font-mono text-cyan-400 truncate">
          {ct && ct !== "11111111111111111111111111111111" ? ct.slice(0, 12) + "..." : "pending"}
        </div>
      </div>
      <span className="text-cyan-400 text-xs">{"\u{1F512}"}</span>
    </div>
  );
}

function FheResult({ label, ct }: { label: string; ct: string }) {
  const isSet = ct !== "11111111111111111111111111111111";
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono ${isSet ? "text-emerald-400" : "text-gray-600"}`}>
        {isSet ? ct.slice(0, 8) + "..." : "pending"}
      </span>
    </div>
  );
}
