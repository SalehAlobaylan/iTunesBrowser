import { clearAuthState, getAuthTokenForService, useAuthStore } from '@/lib/stores/auth';

describe('auth token selection', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            token: null,
            cmsToken: null,
            iamAccessToken: null,
            iamRefreshToken: null,
            isAuthenticated: false,
            isLoading: false,
        });
    });

    it('returns CMS token for cms service', () => {
        useAuthStore.setState({
            token: 'legacy-token',
            cmsToken: 'cms-token',
            iamAccessToken: 'iam-token',
        });

        expect(getAuthTokenForService('cms')).toBe('cms-token');
    });

    it('falls back to legacy token when cms token is missing', () => {
        useAuthStore.setState({
            token: 'legacy-token',
            cmsToken: null,
            iamAccessToken: 'iam-token',
        });

        expect(getAuthTokenForService('cms')).toBe('legacy-token');
    });

    it('returns IAM access token for iam service', () => {
        useAuthStore.setState({
            token: 'legacy-token',
            cmsToken: 'cms-token',
            iamAccessToken: 'iam-token',
        });

        expect(getAuthTokenForService('iam')).toBe('iam-token');
    });

    it('clearAuthState clears all persisted tokens', () => {
        useAuthStore.setState({
            token: 'legacy-token',
            cmsToken: 'cms-token',
            iamAccessToken: 'iam-token',
            iamRefreshToken: 'refresh-token',
            isAuthenticated: true,
        });

        clearAuthState();

        const state = useAuthStore.getState();
        expect(state.token).toBeNull();
        expect(state.cmsToken).toBeNull();
        expect(state.iamAccessToken).toBeNull();
        expect(state.iamRefreshToken).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });
});

