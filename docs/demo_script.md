# VAPM Demo Video Script (< 5 minutes)

## Setup Before Recording

Terminal 1: `docker-compose up -d postgres redis`
Terminal 2: `cd backend && ../venv/bin/python -m uvicorn main:app --port 8001`
Terminal 3: `cd frontend && bun run dev`
Terminal 4: Ready for E2E binary

Browser: Open http://localhost:3000 (dashboard) + Solana Explorer tab

---

## Script

### 0:00 - 0:30 | Problem (show architecture slide or just speak)

"AI trading agents have three critical vulnerabilities.
First, risk parameters are stored as plaintext on-chain -- anyone can read
the agent's position limits and exploit its boundaries.
Second, risk limits are enforced in software -- a malicious operator can
bypass them by modifying the code.
Third, the agent's private key is a single point of compromise."

### 0:30 - 1:00 | Solution (show dashboard)

"VAPM solves all three using two Solana-native primitives.

Encrypt FHE encrypts both the risk limits AND the trade parameters.
The program compares encrypted values using Fully Homomorphic Encryption --
it computes 'encrypted position less-than-or-equal encrypted max' without
ever decrypting either side. Only the boolean result is revealed.

Ika dWallet holds the agent's signing key as a distributed MPC key.
No single party has the private key. The on-chain program must call
approve_message before the Ika network will produce a signature.

Remove either one and the system breaks."

### 1:00 - 3:00 | Live Demo (Terminal 4)

"Let me show the full lifecycle running against Solana devnet."

Run: `cd e2e-ika && cargo run`

Narrate each step as it appears:

Step 1-2: "The binary connects to Ika's gRPC service and creates a real
dWallet using Distributed Key Generation. That's a real Ed25519 key pair
where neither party holds the full private key."

Step 3: "Now the dWallet's authority is transferred to our program's
CPI authority PDA. Only our program can approve trades from here."

Step 4: "The agent is initialized on-chain. Notice the encrypted risk
limits -- those are Pubkey references to Encrypt ciphertext accounts.
The actual values are never stored in plaintext."

Step 5: "A trade proposal is submitted with encrypted parameters --
position size, daily PnL, drawdown -- all encrypted."

Step 6: "finalize_trade is called. The program does CPI to Ika's
approve_message. You can see the real transaction hash and the
MessageApproval PDA that was created on-chain."

Step 7: "Presign is allocated via gRPC, and the sign request is sent
through the MPC protocol."

### 3:00 - 3:30 | Explorer Verification (Browser)

Switch to browser. Open Solana Explorer links from the E2E output.

"Let me verify this on Solana Explorer."

Click the dWallet PDA link: "Here's the real dWallet account on devnet.
You can see it's owned by the Ika program."

Click the Agent PDA link: "Here's the agent state. The authority,
dWallet reference, and encrypted limit refs are all real on-chain data."

Click the Trade PDA link: "And here's the trade proposal with its
verdict -- Approved."

### 3:30 - 3:45 | Dashboard (Browser)

Switch to http://localhost:3000

"The dashboard reads this data live from devnet. You can see the real
dWallet PDA, the encrypted ciphertext references, and clickable
Explorer links for everything."

### 3:45 - 4:00 | Close

"VAPM is an AI trading agent where the strategy is encrypted and
the risk limits are cryptographically enforced. Removing Encrypt
breaks the risk checks. Removing Ika breaks the signing. Both are
structurally required.

Built for the Frontier Hackathon, Encrypt plus Ika track."

---

## Key Points to Emphasize

1. The E2E binary runs against REAL devnet services (not mocked)
2. The dWallet is a REAL distributed key (DKG happened via gRPC)
3. The program does REAL CPI to Ika approve_message (verifiable TX hash)
4. Risk limits are ENCRYPTED on-chain (ciphertext refs, not plaintext)
5. Everything is verifiable on Solana Explorer

## Recording Tips

- Keep terminal font size large (14pt+) so judges can read
- Don't rush the E2E output -- let each step be visible for 2-3 seconds
- Have Explorer tabs pre-loaded so you don't wait for page loads
- Total target: 4 minutes max
