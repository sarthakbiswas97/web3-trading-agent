# VAPM - Verifiable AI Portfolio Manager

> An autonomous AI trading agent with on-chain verifiable decisions on Solana.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

VAPM is a trustless AI trading system that combines machine learning prediction with blockchain-based verification. Every trading decision is logged, hashed, and stored on-chain via a Solana program, enabling anyone to verify the agent's behavior.

### Key Features

- **ML-Powered Trading**: XGBoost model predicting SOL/USDC price movements
- **Explainable Decisions**: SHAP values reveal why each trade was made
- **On-Chain Verification**: Decision hashes stored on Solana for transparency
- **Risk Management**: Hard limits on position size, daily loss, and drawdown
- **Jupiter Aggregator**: Best-price execution across all Solana DEXes

## Architecture

```
+----------------------------------------------------------+
|                    VAPM System                            |
+----------------------------------------------------------+
|  Market Data -> Feature Engine -> ML Model -> Strategy    |
|       (Birdeye/Jupiter)                       |           |
|  Solana <- Trade Executor <- Risk Guardian <--+           |
|    |              |                                       |
|    |         Jupiter API (swap execution)                 |
|    v                                                      |
|  Decision PDA (on-chain hash proofs)                      |
+----------------------------------------------------------+
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| ML | XGBoost, SHAP, scikit-learn |
| Backend | Python 3.11, FastAPI |
| Database | PostgreSQL + TimescaleDB, Redis |
| Blockchain | Anchor (Rust), solana-py, solders |
| DEX | Jupiter Aggregator API |
| Frontend | Next.js 14, Tailwind |

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Solana CLI + Anchor CLI (for program deployment)
- Solana Devnet SOL (free via `solana airdrop`)

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/vapm.git
cd vapm
cp .env.example .env
# Edit .env with your config
```

### 2. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup Solana Wallet

```bash
solana-keygen new -o ~/.config/solana/id.json
solana config set --url devnet
solana airdrop 2
```

### 5. Deploy Solana Program

```bash
anchor build
anchor deploy
# Copy program ID to .env as DECISION_PROGRAM_ID
```

### 6. Run the Agent

```bash
cd backend
python -m uvicorn main:app --reload
```

## Solana Program

### vapm_decisions (Anchor/Rust)

A single on-chain program (~80 lines) that provides:

- **AgentState PDA**: Agent identity with name and decision counter
- **DecisionRecord PDA**: SHA256 hash, model confidence, risk score, execution status
- **Instructions**: `initialize_agent`, `log_decision`, `mark_executed`

Decision hashes are stored on-chain; full decision data stays off-chain in PostgreSQL.

## Trade Execution

Trades are executed via Jupiter Aggregator API:
1. Agent calls Jupiter `/order` endpoint with swap parameters
2. Jupiter returns an assembled transaction
3. Agent signs with Ed25519 keypair and submits via `/execute`
4. Jupiter handles routing across all Solana DEXes for best price

No on-chain swap code needed.

## Decision Transparency

Every trade generates a Decision Record:

```json
{
  "timestamp": "2026-05-10T14:02:00Z",
  "market_state": {
    "price": 165.50,
    "rsi": 28.4,
    "volatility": 0.032
  },
  "model_output": {
    "probability_up": 0.72,
    "shap_values": {"rsi": 0.12, "volume": 0.08}
  },
  "strategy_decision": {
    "action": "BUY",
    "reason": "RSI oversold + high confidence"
  },
  "risk_validation": {
    "checks_passed": true,
    "risk_score": 0.31
  }
}
```

The SHA256 hash of this record is stored on-chain via the Anchor program.

## Risk Management

Hard limits that cannot be bypassed:

| Limit | Value |
|-------|-------|
| Max Position Size | 5% of capital |
| Max Daily Loss | 3% of capital |
| Max Drawdown | 10% of capital |
| Min Trade Interval | 60 seconds |

## API Endpoints

```
GET  /health                 # System health
GET  /agent/status           # Agent state, PnL
GET  /market/price           # Current SOL/USDC price
GET  /market/candles         # OHLCV candles
GET  /predict                # ML prediction with SHAP
GET  /trades/position        # Current position
GET  /trades/history         # Trade history
GET  /risk/state             # Risk metrics
GET  /agent/onchain          # Solana identity and decisions
POST /agent/register         # Register agent on-chain
GET  /verify/{decision_id}   # Verify decision hash
```

## Project Structure

```
vapm/
+-- programs/             # Anchor/Rust Solana program
|   +-- vapm_decisions/   # Decision hash storage
+-- backend/              # Python FastAPI backend
|   +-- models/           # Pydantic data models
|   +-- services/         # Business logic
|   +-- core/             # Technical indicators
|   +-- db/               # PostgreSQL models
|   +-- events/           # Redis pub/sub
+-- ml/                   # ML training & inference
+-- frontend/             # Next.js dashboard
```

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built for the Frontier Hackathon on Superteam Earn.
