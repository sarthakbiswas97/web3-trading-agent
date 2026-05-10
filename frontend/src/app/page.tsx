"use client";

import { useVAPMData } from "@/lib/api";
import HeroBanner from "@/components/HeroBanner";
import Pipeline from "@/components/Pipeline";
import RejectionShowcase from "@/components/RejectionShowcase";
import EncryptCard from "@/components/EncryptCard";
import DWalletCard from "@/components/DWalletCard";
import ActivityFeed from "@/components/ActivityFeed";

export default function Dashboard() {
  const data = useVAPMData();

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      {/* Zone 1: Hero */}
      <HeroBanner
        agent={data.agent}
        prediction={data.prediction}
        encrypt={data.encrypt}
        dwallet={data.dwallet}
      />

      {/* Zone 2: Pipeline */}
      <Pipeline
        agent={data.agent}
        prediction={data.prediction}
        encrypt={data.encrypt}
        dwallet={data.dwallet}
        executor={data.executor}
      />

      {/* Zone 3: Rejection Showcase */}
      <RejectionShowcase
        executor={data.executor}
        dwallet={data.dwallet}
      />

      {/* Zone 4: Integration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <EncryptCard
          encrypt={data.encrypt}
          prediction={data.prediction}
          live={data.live}
        />
        <DWalletCard
          dwallet={data.dwallet}
          executor={data.executor}
          live={data.live}
        />
      </div>

      {/* Zone 5: Activity Feed */}
      <ActivityFeed executor={data.executor} />

      {/* On-chain verification links */}
      {data.live?.agent && (
        <div className="mt-6 p-4 bg-gray-900 rounded-2xl border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Verify on Solana Explorer
          </h3>
          <div className="flex flex-wrap gap-3 text-xs">
            <a href={data.live.program_explorer ?? "#"} target="_blank" rel="noopener noreferrer"
               className="text-gray-400 hover:text-white underline decoration-dotted">
              Program
            </a>
            <a href={data.live.agent.explorer} target="_blank" rel="noopener noreferrer"
               className="text-violet-400 hover:text-violet-300 underline decoration-dotted">
              Agent PDA
            </a>
            <a href={data.live.agent.dwallet_explorer} target="_blank" rel="noopener noreferrer"
               className="text-violet-400 hover:text-violet-300 underline decoration-dotted">
              dWallet
            </a>
            {data.live.trades.map((t, i) => (
              <a key={i} href={t.explorer} target="_blank" rel="noopener noreferrer"
                 className={`underline decoration-dotted ${t.verdict_code === 1 ? "text-emerald-400" : t.verdict_code === 2 ? "text-red-400" : "text-gray-400"}`}>
                Trade #{t.index} ({t.verdict})
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Connection status */}
      {!data.connected && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg">
          Backend disconnected -- start with: cd backend && uvicorn main:app --port 8001
        </div>
      )}
    </main>
  );
}
