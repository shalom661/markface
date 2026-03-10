import axios from 'axios';

const HEALTH_ENDPOINT = '/api/health-check';

/**
 * Service to warm up the backend and keep it alive.
 * Pings the health endpoint periodically to mitigate Vercel cold starts.
 */
class WarmupService {
    private static initiated = false;
    private static intervalId: number | null = null;

    static async start() {
        if (this.initiated) return;
        this.initiated = true;

        console.log('[Warmup] Initializing Vercel keep-alive protocol...');

        // Initial ping
        this.ping();

        // Keep-alive ping every 5 minutes while the tab is open
        if (!this.intervalId) {
            this.intervalId = window.setInterval(() => {
                this.ping();
            }, 5 * 60 * 1000);
        }
    }

    private static async ping() {
        try {
            await axios.get(HEALTH_ENDPOINT, {
                timeout: 15000,
                headers: { 'Cache-Control': 'no-cache' }
            });
            console.log('[Warmup] Backend heartbeat successful.');
        } catch (error) {
            console.warn('[Warmup] Heartbeat failed:', error);
        }
    }
}

export default WarmupService;
