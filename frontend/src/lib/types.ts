export interface AgentStatus {
  agent_name: string;
  status: string;
  latest_price: number;
  symbol: string;
}

export interface DWalletStatus {
  dwallet: {
    enabled: boolean;
    initialized: boolean;
    dwallet_address: string | null;
    ika_program: string | null;
    cpi_authority: string | null;
  };
  risk_limits: {
    max_position_bps: number;
    max_daily_loss_bps: number;
    max_drawdown_bps: number;
  };
}

export interface EncryptStatus {
  encrypt: {
    enabled: boolean;
    initialized: boolean;
    encrypt_program: string;
    encrypted_values_count: number;
  };
  encrypted_decisions: Array<{
    ciphertext_account: string;
    fhe_type: number;
    type_name: string;
  }>;
}

export interface TradeResult {
  success: boolean;
  action: string;
  amount: number;
  price: number;
  reason: string;
  pnl: number | null;
}

export interface ExecutorStatus {
  running: boolean;
  has_position: boolean;
  position: Record<string, unknown> | null;
  capital: { current: number; base: number; peak: number };
  risk: {
    current_drawdown_pct: number;
    max_drawdown_pct: number;
    throttle_factor: number;
    trading_enabled: boolean;
  };
  trades_today: number;
  daily_pnl_pct: number;
  recent_trades: TradeResult[];
}

export interface PredictionResponse {
  symbol: string;
  prediction: {
    direction: string;
    confidence: number;
    probability_up: number;
    shap_explanation: Record<string, { value: number; impact: string }>;
  };
}

export interface OnchainStatus {
  blockchain: {
    enabled: boolean;
    initialized: boolean;
    address: string | null;
    network: string | null;
    program: { decision_program: string | null };
    decision_count: number;
  };
  agent: {
    pubkey: string;
    name: string;
    decision_count: number;
  } | null;
}

export interface VAPMData {
  agent: AgentStatus | null;
  dwallet: DWalletStatus | null;
  encrypt: EncryptStatus | null;
  executor: ExecutorStatus | null;
  prediction: PredictionResponse | null;
  onchain: OnchainStatus | null;
  connected: boolean;
}
