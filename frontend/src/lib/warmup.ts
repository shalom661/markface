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

        // Initial burst: ping once every 5 seconds until success, or for 30 seconds
        let burstAttempts = 0;
        const burstInterval = window.setInterval(async () => {
            const success = await this.ping();
            burstAttempts++;
            if (success || burstAttempts >= 6) {
                window.clearInterval(burstInterval);
                console.log('[Warmup] Initial burst completed.');
            }
        }, 5000);

        // Long-term keep-alive: ping every 5 minutes while the tab is open
        if (!this.intervalId) {
            this.intervalId = window.setInterval(() => {
                this.ping();
            }, 5 * 60 * 1000);
        }
    }

    private static async ping(): Promise<boolean> {
        try {
            await axios.get(HEALTH_ENDPOINT, {
                timeout: 10000,
                headers: { 'Cache-Control': 'no-cache' }
            });
            console.log('[Warmup] Backend heartbeat successful.');
            return true;
        } catch (error) {
            console.warn('[Warmup] Heartbeat failed (potentially cold start):', error);
            return false;
        }
    }
}

export default WarmupService;
