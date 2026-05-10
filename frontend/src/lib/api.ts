"use client";

import { useState, useEffect, useCallback } from "react";
import type { VAPMData } from "./types";

const API = "http://localhost:8001";

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function useVAPMData(): VAPMData {
  const [data, setData] = useState<VAPMData>({
    agent: null,
    dwallet: null,
    encrypt: null,
    executor: null,
    prediction: null,
    onchain: null,
    live: null,
    connected: false,
  });

  const poll = useCallback(async () => {
    const [agent, dwallet, encrypt, executor, prediction, onchain, live] =
      await Promise.all([
        fetchJSON(`${API}/agent/status`),
        fetchJSON(`${API}/agent/dwallet`),
        fetchJSON(`${API}/agent/encrypt`),
        fetchJSON(`${API}/trades/status`),
        fetchJSON(`${API}/predict`),
        fetchJSON(`${API}/agent/onchain`),
        fetchJSON(`${API}/agent/live`),
      ]);

    setData({
      agent: agent as VAPMData["agent"],
      dwallet: dwallet as VAPMData["dwallet"],
      encrypt: encrypt as VAPMData["encrypt"],
      executor: executor as VAPMData["executor"],
      prediction: prediction as VAPMData["prediction"],
      onchain: onchain as VAPMData["onchain"],
      live: live as VAPMData["live"],
      connected: agent !== null,
    });
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [poll]);

  return data;
}
