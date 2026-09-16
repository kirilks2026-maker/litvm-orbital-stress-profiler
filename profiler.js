const { ethers } = require("ethers");
require("dotenv").config();

// Исправлен дефолтный RPC-эндпоинт
const RPC_URL = process.env.RPC_URL || "https://liteforge.rpc.caldera.xyz/http";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xd1837aBD2E9796900DeE10DC6C1D70833a1eE291";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("❌ ERROR: PRIVATE_KEY is missing in .env file!");
    process.exit(1);
}

const PROVIDER = new ethers.providers.JsonRpcProvider(RPC_URL, "any");
const WALLET = new ethers.Wallet(PRIVATE_KEY, PROVIDER);

const CONTRACT_ABI = [
    "function registerTarget(uint256 _targetId, uint32 _length, uint32 _width, uint32 _height, uint32 _weightKg, uint8 _aluminumPercent, uint256 _estRemovalCost, bytes32 _telemetryMerkleRoot) external",
    "function startMadKingProtocol(uint256 targetId) external"
];

const CONTRACT = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, WALLET);
const START_TIME = Date.now();

function getTimelineMark() {
    const elapsed = Date.now() - START_TIME;
    const minutes = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    const ms = String(elapsed % 1000).padStart(3, '0');
    return `[+${minutes}:${seconds}.${ms}]`;
}

function formatLog(workerId, action, status, details) {
    const timeMark = getTimelineMark();
    const pWorker = String(workerId).padStart(2, '0');
    const pAction = String(action).padEnd(16, ' ');
    const pStatus = String(status).padEnd(9, ' ');
    return `${timeMark} [Worker #${pWorker} | ${pAction}] ${pStatus}: ${details}`;
}

async function runRegistrationWorker(workerId, targetId, customNonce, onDispatchReady) {
    const length = 150;
    const width = 100;
    const height = 80;
    const weightKg = Math.floor(100 + Math.random() * 400);
    const aluminumPercent = Math.floor(10 + Math.random() * 30);
    const estRemovalCost = ethers.utils.parseEther("0.001");
    const fakeMerkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));

    const sendTime = Date.now();
    let tx;

    try {
        tx = await CONTRACT.registerTarget(
            targetId, length, width, height, weightKg, aluminumPercent, estRemovalCost, fakeMerkleRoot,
            { nonce: customNonce, gasLimit: 250000 }
        );

        console.log(formatLog(workerId, "registerTarget", "Sent", `Tx Hash: ${tx.hash.substring(0, 14)}... (Nonce: ${customNonce})`));
        onDispatchReady(); 

    } catch (sendError) {
        const reason = sendError.reason || sendError.data?.message || sendError.message;
        const errMsg = reason.includes("429") ? "HTTP 429 Rate Limit" : reason.substring(0, 45);
        console.log(formatLog(workerId, "registerTarget", "Failed Send", `🛑 ${errMsg}`));
        
        onDispatchReady(); 
        return { success: false, targetId };
    }

    try {
        const receipt = await tx.wait();
        const duration = ((Date.now() - sendTime) / 1000).toFixed(2);

        console.log(formatLog(workerId, "registerTarget", "Included", `Block #${receipt.blockNumber} in ${duration}s`));
        return { success: true, targetId };
    } catch (miningError) {
        console.log(formatLog(workerId, "registerTarget", "Failed Mine", `🛑 Mining error`));
        return { success: false, targetId };
    }
}

(async () => {
    console.log(`${getTimelineMark()} 🚀 [LitVM Orbital Stress Profiler] Initializing Core Framework...`);
    console.log(`${getTimelineMark()} 🛸 AI Agent #1000091 active (ERC-8004 telemetry binding).`);

    try {
        let currentNonce = await PROVIDER.getTransactionCount(WALLET.address, "pending");
        const WORKER_COUNT = 10;
        const startTargetId = Math.floor(Date.now() / 1000);

        console.log(`${getTimelineMark()} ➔ 🧭 Base Account Nonce: ${currentNonce}`);
        console.log(`${getTimelineMark()} ➔ 🔥 Launching Cascade Batch #1 [${WORKER_COUNT} Parallel Orbital Registrations]`);

        const workerPromises = [];
        let failedCount = 0;
        let isCircuitBreakerTripped = false;

        for (let i = 0; i < WORKER_COUNT; i++) {
            if (isCircuitBreakerTripped) {
                console.log(`${getTimelineMark()} ⚡ [Circuit Breaker] Dispatch halted due to error threshold (>40%).`);
                break;
            }

            const workerNonce = currentNonce + i;
            const targetId = startTargetId + i;
            const workerId = i + 1;

            let resolveDispatch;
            const dispatchReadyPromise = new Promise(resolve => { resolveDispatch = resolve; });

            const promise = runRegistrationWorker(workerId, targetId, workerNonce, resolveDispatch).then((res) => {
                if (!res.success) {
                    failedCount++;
                    if (failedCount / WORKER_COUNT >= 0.4) {
                        isCircuitBreakerTripped = true;
                    }
                }
                return res;
            });

            workerPromises.push(promise);
            await dispatchReadyPromise; 
        }

        const results = await Promise.all(workerPromises);

        const totalFailed = results.filter((r) => !r.success).length;
        const dropRate = ((totalFailed / results.length) * 100).toFixed(1);

        console.log(`\n--------------------------------------------------------------------------------`);
        console.log(`${getTimelineMark()} 📊 BATCH TELEMETRY SUMMARY:`);
        console.log(`${getTimelineMark()} ➔ Total Executed: ${results.length} / ${WORKER_COUNT}`);
        console.log(`${getTimelineMark()} ➔ Failed/Dropped:  ${totalFailed}`);
        console.log(`${getTimelineMark()} ➔ Drop Rate:       ${dropRate}%`);
        if (isCircuitBreakerTripped || dropRate >= 40) {
            console.log(`${getTimelineMark()} 🛑 CIRCUIT BREAKER TRIGGERED: Network breakpoint reached!`);
        }
        console.log(`--------------------------------------------------------------------------------\n`);

    } catch (criticalError) {
        console.error(`[🚨 CRITICAL SYSTEM FAILURE] ${criticalError.message}`);
    }
})();
