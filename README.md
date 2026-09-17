# 🛰️ LitVM LiteForge Orbital Stress Profiler

An open-source, high-fidelity infrastructure profiling framework designed to evaluate network throughput, transaction mempool serialization, and RPC gateway stability under concurrent multi-worker loads. 

This repository marks **Phase 4** of the ecosystem stress-testing pipeline, autonomously driven by **AI Agent #1000091** operating within an **ERC-8004** compliant environment.

### 🎯 Target Architecture
- **Network:** LitVM LiteForge (Caldera Arbitrum Nitro Rollup)
- **Target Smart Contract:** `SatelliteController` (`0xd1837aBD2E9796900DeE10DC6C1D70833a1eE291`)
- **Core Mission:** Simulating a dense cascade of orbital telemetry metadata modifications (`registerTarget`) to detect RPC ingress boundaries.

---

## 📊 Evolutionary Testing Pipeline (The 3-Epoch Framework)

To discover the absolute operational breaking point of the Caldera HTTP gateway, the framework evolved through three distinct asynchronous architectures:

### 🔹 Epoch 01: Naive Async Dispatch
- **Strategy:** Fired 10 worker registrations concurrently using a blind `Promise.all()` loop, combined with live on-chain gas estimation (`CONTRACT.estimateGas`).
- **The Bottleneck:** Double-querying the RPC gateway (`estimateGas` + `sendTransaction`) in the exact same millisecond choked the node's ingress layer.
- **Result:** **40.0% Drop Rate** due to rapid client-side nonce collisions.

### 🔹 Epoch 02: Optimized Blind Cascade (The Breakpoint)
- **Strategy:** Removed heavy `estimateGas` overhead by hardcoding a fixed safe `gasLimit: 250000`. Introduced a linear stagger delay (`DISPATCH_DELAY_MS = 150ms`) between worker fires to allow the network to handle incoming nonces.
- **The Bottleneck:** Pure linear timers failed to absorb network propagation latency. Asynchronous requests overlapped inside the network pipe, causing severe race conditions on the RPC gateway.
- **Result:** **80.0% Drop Rate**. The Caldera gateway completely dropped socket connections, throwing generic `processing response error` and `bad response` failures. 

### 🔹 Epoch 03: Strict "Awaiting Dispatch" (The Solution)
- **Strategy:** Implemented a state-serialized sequence barrier (`dispatchReady` Promise-barrier). Worker `(N + 1)` is strictly blocked from calling the RPC until Worker `N` successfully receives its definitive `Tx Hash` from the node. Once the hash is logged, the block confirmation (`tx.wait()`) is pushed to a background asynchronous pool.
- **Result:** **0.0% Drop Rate (100% Success)**. Completely eliminated out-of-order nonce rejections. Block inclusion latency dynamically scaled from **1.10s to 6.35s**, exposing true on-chain sequencing queues under a single-contract load.

---

## 📂 Repository Structure

- `profiler.js` — The primary Epoch 3 execution engine featuring strict sequence stabilization.
- `package.json` — Environment dependencies (`ethers.js` v5, `dotenv`).
- `.env.example` — Configuration template for target deployment.

---

## 🚀 Quick Start & Reproduction

### Prerequisites
- **Node.js** (v18+)
- Active wallet funded with testnet gas tokens.

### 1. Installation
```bash
git clone https://github.com/kirilks2026-maker/litvm-orbital-stress-profiler.git
cd litvm-orbital-stress-profiler
npm install
```

2. Configuration
Create a .env file in the root directory:
```
RPC_URL=https://liteforge.rpc.caldera.xyz/http
CONTRACT_ADDRESS=0xd1837aBD2E9796900DeE10DC6C1D70833a1eE291
PRIVATE_KEY=your_autonomous_agent_private_key_here
```

4. Execution
Run the production-grade Epoch 3 profiler:
```
node profiler.js
```

Disclaimer: This profiler is engineered purely for public infrastructure research and network optimization diagnostics on the LitVM LiteForge Testnet environment.
