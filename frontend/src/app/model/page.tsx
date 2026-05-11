"use client";

import { useState, useEffect, useCallback } from "react";
import ShapChart from "@/components/ShapChart";
import type { PredictionResponse } from "@/lib/types";

const API = "http://localhost:8001";

interface ModelInfo {
  name: string;
  version: string;
  accuracy: number;
  feature_count: number;
  feature_importance?: Record<string, number>;
}

// Demo SHAP data to show when backend is disconnected
const DEMO_SHAP: Record<string, { value: number; impact: string }> = {
  rsi_14: { value: 0.0823, impact: "positive" },
  macd_signal: { value: -0.0612, impact: "negative" },
  volume_sma_ratio: { value: 0.0445, impact: "positive" },
  bb_width: { value: -0.0389, impact: "negative" },
  price_momentum_5: { value: 0.0312, impact: "positive" },
  atr_14: { value: -0.0267, impact: "negative" },
  ema_cross_12_26: { value: 0.0198, impact: "positive" },
  obv_slope: { value: 0.0156, impact: "positive" },
};

const DEMO_IMPORTANCE: [string, number][] = [
  ["rsi_14", 0.1432],
  ["macd_signal", 0.1187],
  ["volume_sma_ratio", 0.0934],
  ["bb_width", 0.0821],
  ["price_momentum_5", 0.0756],
  ["atr_14", 0.0689],
  ["ema_cross_12_26", 0.0612],
  ["obv_slope", 0.0534],
  ["stoch_k", 0.0467],
  ["adx_14", 0.0398],
];

export default function ModelPage() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [predRes, modelRes] = await Promise.all([
        fetch(`${API}/predict`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${API}/predict/model`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      setPrediction(predRes);
      setModelInfo(modelRes);
      setError(predRes || modelRes ? null : "Backend unavailable");
    } catch {
      setError("Failed to fetch model data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
          Loading model data...
        </div>
      </main>
    );
  }

  const connected = !!prediction || !!modelInfo;
  const pred = prediction?.prediction;
  const shap = pred?.shap_explanation;

  // Sort feature importance if available
  const sortedImportance = modelInfo?.feature_importance
    ? Object.entries(modelInfo.feature_importance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
    : [];

  const maxImportance =
    sortedImportance.length > 0
      ? Math.max(...sortedImportance.map(([, v]) => v))
      : 0;

  // Demo importance for disconnected state
  const displayImportance = sortedImportance.length > 0 ? sortedImportance : (connected ? [] : DEMO_IMPORTANCE);
  const displayMaxImportance = displayImportance.length > 0
    ? Math.max(...displayImportance.map(([, v]) => v))
    : 0;

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Model</h1>
        <p className="text-xs text-gray-500 mt-1">
          {connected ? "Prediction details and SHAP explanations" : "XGBoost prediction model with SHAP explainability"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Current Prediction */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Current Prediction
          </h2>
          {pred ? (
            <div className="space-y-4">
              {/* Direction + Confidence */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    pred.direction === "UP"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}
                >
                  {pred.direction === "UP" ? "\u2191" : "\u2193"}
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{pred.direction}</div>
                  <div className="text-sm text-gray-400">
                    {(pred.confidence * 100).toFixed(1)}% confidence
                  </div>
                </div>
              </div>

              {/* Probability bar */}
              <div>
                <div className="flex justify-between mb-1 text-xs text-gray-500">
                  <span>P(DOWN)</span>
                  <span>P(UP)</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${(1 - pred.probability_up) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${pred.probability_up * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs font-mono">
                  <span className="text-red-400">
                    {((1 - pred.probability_up) * 100).toFixed(1)}%
                  </span>
                  <span className="text-emerald-400">
                    {(pred.probability_up * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Symbol */}
              <div className="pt-2 border-t border-gray-800 text-xs text-gray-500">
                Symbol: <span className="text-white font-mono">{prediction?.symbol}</span>
              </div>
            </div>
          ) : (
            /* Disconnected prediction preview */
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 opacity-50">
                  {"\u2191"}
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-500">UP</div>
                  <div className="text-sm text-gray-600">73.2% confidence</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-xs text-gray-600">
                  <span>P(DOWN)</span>
                  <span>P(UP)</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex opacity-40">
                  <div className="h-full bg-red-500" style={{ width: "26.8%" }} />
                  <div className="h-full bg-emerald-500" style={{ width: "73.2%" }} />
                </div>
                <div className="flex justify-between mt-1 text-xs font-mono text-gray-600">
                  <span>26.8%</span>
                  <span>73.2%</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <p className="text-[10px] text-gray-600">
                  Demo preview -- live predictions appear when the backend is running
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Model Info */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Model Info
          </h2>
          {modelInfo ? (
            <div className="space-y-3">
              <InfoRow label="Name" value={modelInfo.name} />
              <InfoRow label="Version" value={modelInfo.version} />
              <InfoRow
                label="Accuracy"
                value={`${(modelInfo.accuracy * 100).toFixed(1)}%`}
                color={
                  modelInfo.accuracy >= 0.6
                    ? "text-emerald-400"
                    : "text-amber-400"
                }
              />
              <InfoRow
                label="Features"
                value={String(modelInfo.feature_count)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Name" value="XGBoost Classifier" color="text-gray-500" />
              <InfoRow label="Version" value="v3 (latest)" color="text-gray-500" />
              <InfoRow label="Accuracy" value="~62%" color="text-gray-500" />
              <InfoRow label="Features" value="23 technical indicators" color="text-gray-500" />
              <div className="pt-3 border-t border-gray-800/50">
                <p className="text-xs text-gray-500 leading-relaxed">
                  The model uses 23 technical features (RSI, MACD, Bollinger Bands, volume ratios, etc.)
                  to predict short-term SOL/USDC price direction.
                  SHAP values explain each prediction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SHAP Explanation */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            SHAP Feature Explanation
          </h2>
          {!shap && !connected && (
            <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
              Demo data
            </span>
          )}
        </div>
        <ShapChart shapExplanation={shap ?? (connected ? null : DEMO_SHAP)} maxFeatures={10} />
      </div>

      {/* Feature Importance */}
      {displayImportance.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Feature Importance (Global)
            </h2>
            {!connected && (
              <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                Demo data
              </span>
            )}
          </div>
          <div className="space-y-2">
            {displayImportance.map(([feature, importance]) => {
              const barWidth =
                displayMaxImportance > 0 ? (importance / displayMaxImportance) * 100 : 0;
              return (
                <div key={feature} className={!connected ? "opacity-60" : ""}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-mono text-gray-300 truncate">
                      {feature}
                    </span>
                    <span className="text-xs font-mono text-amber-400 shrink-0 ml-2">
                      {importance.toFixed(4)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500/70 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

function InfoRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-mono ${color ?? "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
