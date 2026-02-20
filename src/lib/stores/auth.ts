import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { login as cmsLogin, getMe as getCmsMe } from '@/lib/api/cms/auth';
import { login as iamLogin, refresh as iamRefresh, getMyAccess as getIamMyAccess } from '@/lib/api/iam/auth';
import type { User, MeResponse as CmsMeResponse } from '@/lib/api/cms/types';
import type { MeResponse as IamMeResponse } from '@/lib/api/iam/types';

export type AuthMode = 'cms' | 'bridge' | 'iam';

const AUTH_MODE: AuthMode = (() => {
    const mode = process.env.NEXT_PUBLIC_AUTH_MODE?.toLowerCase();
    if (mode === 'cms' || mode === 'bridge' || mode === 'iam') {
        return mode;
    }
    return 'bridge';
})();

const ROLE_PRIORITY = ['admin', 'manager', 'agent', 'user'] as const;

function selectPrimaryRole(roles: string[], isAdmin: boolean): string {
    const normalized = roles.map((role) => role.toLowerCase());
    if (isAdmin || normalized.includes('admin')) {
        return 'admin';
    }
    for (const role of ROLE_PRIORITY) {
        if (normalized.includes(role)) {
            return role;
        }
    }
    return normalized[0] || 'user';
}

function mapIamUser(me: IamMeResponse): User {
    return {
        id: me.user_id,
        email: me.email,
        role: me.role || selectPrimaryRole(me.roles, me.is_admin),
        permissions: me.permissions || [],
    };
}

function mapCmsUser(me: CmsMeResponse): User {
    return {
        id: me.id,
        email: me.email,
        role: me.role,
        permissions: me.permissions,
    };
}

interface AuthErrorShape {
    message: string;
    status: number;
    code?: string;
}

function toAuthError(error: unknown): AuthErrorShape {
    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    ) {
        const maybeStatus = (error as { status?: unknown }).status;
        const maybeCode = (error as { code?: unknown }).code;
        return {
            message: (error as { message: string }).message,
            status: typeof maybeStatus === 'number' ? maybeStatus : 500,
            code: typeof maybeCode === 'string' ? maybeCode : undefined,
        };
    }

    if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as { message?: string; error?: string; code?: string } | undefined;
        return {
            message: errorData?.message || errorData?.error || error.message || 'An error occurred',
            status: error.response?.status || 500,
            code: errorData?.code,
        };
    }

    return {
        message: 'An error occurred',
        status: 500,
    };
}

interface AuthState {
    user: User | null;
    // Backward-compatible token field used by existing hooks/components.
    token: string | null;
    // CMS token used for CMS + CRM APIs during bridge mode.
    cmsToken: string | null;
    // IAM access/refresh tokens used for IAM authentication.
    iamAccessToken: string | null;
    iamRefreshToken: string | null;
    authMode: AuthMode;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            cmsToken: null,
            iamAccessToken: null,
            iamRefreshToken: null,
            authMode: AUTH_MODE,
            isAuthenticated: false,
            isLoading: true, // Start as loading until checkAuth completes

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const { authMode } = get();

                    if (authMode === 'cms') {
                        const response = await cmsLogin({ email, password });
                        set({
                            token: response.token,
                            cmsToken: response.token,
                            iamAccessToken: null,
                            iamRefreshToken: null,
                            user: {
                                id: response.user.id,
                                email: response.user.email,
                                role: response.user.role,
                            },
                            isAuthenticated: true,
                            isLoading: false,
                        });
                        return;
                    }

                    const iamTokens = await iamLogin({ email, password });
                    const iamMe = await getIamMyAccess(iamTokens.access_token);

                    if (authMode === 'iam') {
                        set({
                            token: iamTokens.access_token,
                            cmsToken: null,
                            iamAccessToken: iamTokens.access_token,
                            iamRefreshToken: iamTokens.refresh_token,
                            user: mapIamUser(iamMe),
                            isAuthenticated: true,
                            isLoading: false,
                        });
                        return;
                    }

                    const cmsSession = await cmsLogin({ email, password }).catch(() => {
                        throw {
                            message: 'IAM login succeeded, but CMS bridge login failed. Ensure IAM and CMS credentials are mirrored.',
                            status: 401,
                            code: 'BRIDGE_CMS_LOGIN_FAILED',
                        } as AuthErrorShape;
                    });

                    set({
                        token: cmsSession.token,
                        cmsToken: cmsSession.token,
                        iamAccessToken: iamTokens.access_token,
                        iamRefreshToken: iamTokens.refresh_token,
                    });

                    const cmsMe = await getCmsMe().catch(() => {
                        throw {
                            message: 'IAM login succeeded, but CMS bridge session validation failed.',
                            status: 401,
                            code: 'BRIDGE_CMS_SESSION_INVALID',
                        } as AuthErrorShape;
                    });

                    set({
                        user: mapCmsUser(cmsMe),
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        user: null,
                        token: null,
                        cmsToken: null,
                        iamAccessToken: null,
                        iamRefreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    throw toAuthError(error);
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    cmsToken: null,
                    iamAccessToken: null,
                    iamRefreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
                // Redirect to login page
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            },

            checkAuth: async () => {
                const { authMode } = get();

                if (authMode === 'cms') {
                    const activeCmsToken = get().cmsToken || get().token;

                    if (!activeCmsToken) {
                        set({ isLoading: false, isAuthenticated: false });
                        return;
                    }

                    set({ token: activeCmsToken, cmsToken: activeCmsToken });

                    try {
                        const user = await getCmsMe();
                        set({
                            user: mapCmsUser(user),
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } catch {
                        set({
                            user: null,
                            token: null,
                            cmsToken: null,
                            iamAccessToken: null,
                            iamRefreshToken: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    }
                    return;
                }

                let iamAccessToken = get().iamAccessToken;
                const iamRefreshToken = get().iamRefreshToken;

                if (!iamAccessToken) {
                    set({
                        user: null,
                        token: null,
                        cmsToken: null,
                        iamAccessToken: null,
                        iamRefreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    return;
                }

                let iamMe: IamMeResponse | null = null;
                try {
                    iamMe = await getIamMyAccess(iamAccessToken);
                } catch {
                    if (!iamRefreshToken) {
                        set({
                            user: null,
                            token: null,
                            cmsToken: null,
                            iamAccessToken: null,
                            iamRefreshToken: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                        return;
                    }

                    try {
                        const refreshed = await iamRefresh({ refresh_token: iamRefreshToken });
                        iamAccessToken = refreshed.access_token;
                        iamMe = await getIamMyAccess(iamAccessToken);
                        set({
                            iamAccessToken: refreshed.access_token,
                            iamRefreshToken: refreshed.refresh_token,
                        });
                    } catch {
                        set({
                            user: null,
                            token: null,
                            cmsToken: null,
                            iamAccessToken: null,
                            iamRefreshToken: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                        return;
                    }
                }

                if (authMode === 'iam') {
                    set({
                        token: iamAccessToken,
                        user: iamMe ? mapIamUser(iamMe) : null,
                        isAuthenticated: Boolean(iamMe),
                        isLoading: false,
                    });
                    return;
                }

                const activeCmsToken = get().cmsToken || get().token;
                if (!activeCmsToken) {
                    set({
                        user: null,
                        token: null,
                        cmsToken: null,
                        iamAccessToken: null,
                        iamRefreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    return;
                }

                set({ token: activeCmsToken, cmsToken: activeCmsToken });

                try {
                    const cmsMe = await getCmsMe();
                    set({
                        user: mapCmsUser(cmsMe),
                        token: activeCmsToken,
                        cmsToken: activeCmsToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch {
                    set({
                        user: null,
                        token: null,
                        cmsToken: null,
                        iamAccessToken: null,
                        iamRefreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            },

            // Clear auth without redirect (used by 401 handler)
            clearAuth: () => {
                set({
                    user: null,
                    token: null,
                    cmsToken: null,
                    iamAccessToken: null,
                    iamRefreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },
        }),
        {
            name: 'platform-console-auth',
            partialize: (state) => ({
                token: state.token,
                cmsToken: state.cmsToken,
                iamAccessToken: state.iamAccessToken,
                iamRefreshToken: state.iamRefreshToken,
                user: state.user,
            }),
        }
    )
);

// Helper function to get token outside of React components
export function getToken(): string | null {
    return useAuthStore.getState().token;
}

// Helper function to retrieve service-specific tokens for API clients.
export function getAuthTokenForService(service: 'cms' | 'crm' | 'iam'): string | null {
    const state = useAuthStore.getState();
    if (service === 'iam') {
        return state.iamAccessToken;
    }
    return state.cmsToken || state.token;
}

// Helper function to clear auth from outside React (used by API client)
export function clearAuthState(): void {
    useAuthStore.getState().clearAuth();
}
