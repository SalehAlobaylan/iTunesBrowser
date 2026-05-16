import { useAuthStore } from '@/lib/stores/auth';

/**
 * Hook to access auth state and methods
 * Provides a convenient API for components to interact with authentication
 */
export function useAuth() {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isLoading = useAuthStore((state) => state.isLoading);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);
    const checkAuth = useAuthStore((state) => state.checkAuth);

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
    };
}
