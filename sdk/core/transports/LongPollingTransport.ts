// core/transports/LongPollingTransport.ts
import type { Transport } from './Transport';

export class LongPollingTransport<C, T> implements Transport<C, T> {
    constructor(private endpoint: string, private apiKey: string) { }

    async init() {
        // No-op for polling
    }

    async fetchFlags(context: C): Promise<Record<string, T>> {
        const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context }),
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error('Unauthorized: Invalid API key');
        }

        if (!res.ok) {
            throw new Error(`Unexpected response: ${res.status}`);
        }
        return await res.json();
    }

    destroy() {
        // No-op
    }
}
