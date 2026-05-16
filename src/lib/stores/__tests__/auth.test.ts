import { clearAuthState, useAuthStore } from '@/lib/stores/auth';

describe('auth store', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    });

    it('clearAuth resets the store to the empty state', () => {
        useAuthStore.setState({
            user: { id: 'u1', email: 'a@b.c', role: 'admin', permissions: [] },
            isAuthenticated: true,
        });

        clearAuthState();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });

    it('does not persist any token fields on the store shape', () => {
        const state = useAuthStore.getState() as unknown as Record<string, unknown>;
        expect(state).not.toHaveProperty('token');
        expect(state).not.toHaveProperty('iamAccessToken');
        expect(state).not.toHaveProperty('iamRefreshToken');
    });
});
