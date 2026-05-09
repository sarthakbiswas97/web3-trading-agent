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
        />
        <DWalletCard
          dwallet={data.dwallet}
          executor={data.executor}
        />
      </div>

      {/* Zone 5: Activity Feed */}
      <ActivityFeed executor={data.executor} />

      {/* Connection status */}
      {!data.connected && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg">
          Backend disconnected -- start with: cd backend && uvicorn main:app --port 8001
        </div>
      )}
    </main>
  );
}
