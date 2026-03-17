import { clearAuthState, getAuthTokenForService, useAuthStore } from '@/lib/stores/auth';

describe('auth token selection', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            token: null,
            iamAccessToken: null,
            iamRefreshToken: null,
            isAuthenticated: false,
            isLoading: false,
        });
    });

    it('returns IAM token for cms service (unified auth)', () => {
        useAuthStore.setState({
            token: 'iam-token',
            iamAccessToken: 'iam-token',
        });

        expect(getAuthTokenForService('cms')).toBe('iam-token');
    });

    it('returns IAM access token for iam service', () => {
        useAuthStore.setState({
            token: 'iam-token',
            iamAccessToken: 'iam-token',
        });

        expect(getAuthTokenForService('iam')).toBe('iam-token');
    });

    it('clearAuthState clears all persisted tokens', () => {
        useAuthStore.setState({
            token: 'iam-token',
            iamAccessToken: 'iam-token',
            iamRefreshToken: 'refresh-token',
            isAuthenticated: true,
        });

        clearAuthState();

        const state = useAuthStore.getState();
        expect(state.token).toBeNull();
        expect(state.iamAccessToken).toBeNull();
        expect(state.iamRefreshToken).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });
});
