import axios from 'axios';

const HEALTH_ENDPOINT = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '/health');

/**
 * Service to warm up the backend (Render free tier cold start mitigation).
 * Pings the health endpoint once when initialized.
 */
class WarmupService {
    private static initiated = false;

    static async start() {
        if (this.initiated) return;
        this.initiated = true;

        console.log('[Warmup] Initializing backend wakeup protocol...');

        try {
            // Use a clean axios instance to avoid interceptors/auth
            await axios.get(HEALTH_ENDPOINT, { timeout: 30000 });
            console.log('[Warmup] Backend cluster reached successfully.');
        } catch (error) {
            console.warn('[Warmup] Initial ping failed (expected if backend is sleeping):', error);
        }
    }
}

export default WarmupService;
