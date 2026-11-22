/**
 * Render.com Keep-Alive Service
 *
 * Render.com free-tier web services automatically spin down after 15 minutes of inactivity
 * when no inbound HTTP requests are received.
 *
 * This background service runs on the backend every 30 seconds since server startup,
 * sending an HTTP request to the keep-alive API endpoint to register external traffic
 * and ensure the instance stays awake.
 *
 * On Render.com, `process.env.RENDER_EXTERNAL_URL` is automatically injected by the platform
 * (e.g. "https://salon-queue-server.onrender.com"). When pinging this external URL, the request
 * routes through Render's reverse proxy / load balancer, preventing the service from sleeping.
 * If running locally or on custom setups, it falls back to SERVER_URL, BACKEND_URL, or 127.0.0.1.
 */

let keepAliveInterval = null;
let pingCount = 0;
let errorCount = 0;
let lastPingTime = null;
let lastStatus = null;
let currentTargetUrl = '';

/**
 * Returns diagnostic stats about keep-alive pings
 */
export const getKeepAliveStats = () => ({
  enabled: process.env.ENABLE_KEEP_ALIVE !== 'false',
  pingCount,
  errorCount,
  lastPingTime: lastPingTime ? lastPingTime.toISOString() : null,
  lastStatus,
  targetUrl: currentTargetUrl,
  intervalSeconds: (parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || 30000) / 1000
});

/**
 * Executes a single ping to the keep-alive endpoint
 */
const pingServer = async (targetUrl) => {
  try {
    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Render-KeepAlive-Worker/1.0',
        'Cache-Control': 'no-cache',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const duration = Date.now() - startTime;
    pingCount++;
    lastPingTime = new Date();
    lastStatus = response.status;

    if (response.ok) {
      console.log(`[Keep-Alive] Ping #${pingCount} successful (${response.status} OK, ${duration}ms) -> ${targetUrl}`);
    } else {
      console.warn(`[Keep-Alive] Ping #${pingCount} returned status: ${response.status} -> ${targetUrl}`);
    }
  } catch (error) {
    errorCount++;
    lastStatus = error.message;
    console.warn(`[Keep-Alive] Ping failed: ${error.message} -> ${targetUrl}`);
  }
};

/**
 * Starts the keep-alive runner every 30 seconds since server starts
 * @param {number|string} port - Server port
 */
export const startKeepAlive = (port = 5000) => {
  if (process.env.ENABLE_KEEP_ALIVE === 'false') {
    console.log('[Keep-Alive] Service disabled via ENABLE_KEEP_ALIVE=false');
    return null;
  }

  // Clear existing interval if re-initialized
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }

  // Resolve base URL:
  // Render.com automatically provides RENDER_EXTERNAL_URL
  const rawBaseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    process.env.BACKEND_URL ||
    `http://127.0.0.1:${port}`;

  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  currentTargetUrl = `${baseUrl}/api/keep-alive`;

  const intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || 30000; // 30 seconds default

  console.log(`⏱️  Keep-Alive service initialized`);
  console.log(`   ➜ Target:   ${currentTargetUrl}`);
  console.log(`   ➜ Interval: Every ${intervalMs / 1000} seconds\n`);

  // Start recurring interval every 30 seconds since server starts
  keepAliveInterval = setInterval(() => {
    pingServer(currentTargetUrl);
  }, intervalMs);

  // Return teardown function for graceful shutdown
  return () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };
};
