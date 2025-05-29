// sdk/core/client.test.ts
import fetchMock from 'jest-fetch-mock';
import { FlagClient } from '@/core/client'; // Adjust the import path as necessary
import { jest } from '@jest/globals';



const mockFlags = { feature_login: true, beta_user: false };



describe('FlagClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });
    it('fetches and returns feature flags', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ darkMode: true }));

        const client = new FlagClient({
            apiKey: 'test-api-key',
            context: { user_id: 'abc' },
        });

        const flags = await client.fetchFlags();

        expect(fetchMock).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-api-key',
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({ context: { user_id: 'abc' } }),
            })
        );

        expect(flags).toEqual({ darkMode: true });
        expect(client.getFlag('darkMode')).toBe(true);
    });
    it('fetches flags and stores them', async () => {
        fetchMock.mockResponseOnce(JSON.stringify(mockFlags));

        const client = new FlagClient({
            apiKey: 'test-api-key',
            context: { user_id: 'abc123' },
        });

        const result = await client.fetchFlags();

        expect(result).toEqual(mockFlags);
        expect(client.getFlag('feature_login')).toBe(true);
        expect(client.getFlag('beta_user')).toBe(false);
    });

    it('returns fallback when flag not present', () => {
        const client = new FlagClient({
            apiKey: 'test-api-key',
        });

        expect(client.getFlag('nonexistent', 'default')).toBe('default');
    });

    it('updates context correctly', () => {
        const client = new FlagClient({
            apiKey: 'test-api-key',
            context: { user_id: 'abc123' },
        });

        client.updateContext({ user_id: 'pro' });
        expect((client as any).context).toEqual({ user_id: 'pro' });
    });

    it('clears interval timer on destroy', () => {
        jest.useFakeTimers();
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

        const client = new FlagClient({
            apiKey: 'test-api-key',
            autoRefresh: true,
            refreshIntervalMs: 5000,
        });

        client.destroy();

        jest.runOnlyPendingTimers();
        expect(clearIntervalSpy).toHaveBeenCalled();

        clearIntervalSpy.mockRestore(); // Clean up
        jest.useRealTimers();
    });
});
