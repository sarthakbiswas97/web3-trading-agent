import type { EncryptStatus, PredictionResponse } from "@/lib/types";

export default function EncryptCard({
  encrypt, prediction,
}: {
  encrypt: EncryptStatus | null;
  prediction: PredictionResponse | null;
}) {
  const conf = prediction?.prediction?.confidence;
  const count = encrypt?.encrypt?.encrypted_values_count ?? 0;
  const program = encrypt?.encrypt?.encrypt_program ?? "";
  const decisions = encrypt?.encrypted_decisions ?? [];

  return (
    <div className="bg-gray-900 rounded-2xl border border-cyan-500/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\u{1F512}"}</span>
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
            Encrypt FHE
          </h2>
        </div>
        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full ring-1 ring-cyan-500/30">
          Anti Front-Running
        </span>
      </div>

      {/* Plaintext vs Ciphertext visual */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-lg">
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 uppercase mb-0.5">Confidence Score</div>
            <div className="text-sm font-mono text-gray-300 blur-[3px] select-none">
              {conf ? (conf * 100).toFixed(1) + "%" : "72.4%"}
            </div>
          </div>
          <div className="text-gray-600">{"\u2192"}</div>
          <div className="flex-1 text-right">
            <div className="text-[10px] text-gray-500 uppercase mb-0.5">On-Chain (FHE)</div>
            <div className="text-sm font-mono text-cyan-400 truncate">
              {decisions.length > 0 ? decisions[0].ciphertext_account.slice(0, 16) + "..." : "0x7f3a...e9c2"}
            </div>
          </div>
          <span className="text-cyan-400 text-xs">{"\u{1F512}"}</span>
        </div>

        <div className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-lg">
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 uppercase mb-0.5">Risk Score</div>
            <div className="text-sm font-mono text-gray-300 blur-[3px] select-none">
              0.31
            </div>
          </div>
          <div className="text-gray-600">{"\u2192"}</div>
          <div className="flex-1 text-right">
            <div className="text-[10px] text-gray-500 uppercase mb-0.5">On-Chain (FHE)</div>
            <div className="text-sm font-mono text-cyan-400 truncate">
              {decisions.length > 1 ? decisions[1].ciphertext_account.slice(0, 16) + "..." : "0x2b1c...a4f7"}
            </div>
          </div>
          <span className="text-cyan-400 text-xs">{"\u{1F512}"}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div>
          <span className="text-2xl font-bold text-white">{count}</span>
          <span className="text-xs text-gray-500 ml-1.5">values encrypted</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-600">Encrypt Program</div>
          <code className="text-[10px] text-cyan-500/70">{program ? program.slice(0, 12) + "..." : "---"}</code>
        </div>
      </div>
    </div>
  );
}
