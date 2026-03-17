import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { login as iamLogin, refresh as iamRefresh, getMyAccess as getIamMyAccess } from '@/lib/api/iam/auth';
import type { User } from '@/lib/api/cms/types';
import type { MeResponse as IamMeResponse } from '@/lib/api/iam/types';

const ROLE_PRIORITY = ['admin', 'manager', 'editor', 'agent', 'user'] as const;

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

const EMPTY_AUTH = {
    user: null,
    token: null,
    iamAccessToken: null,
    iamRefreshToken: null,
    isAuthenticated: false,
    isLoading: false,
};

interface AuthState {
    user: User | null;
    token: string | null;
    iamAccessToken: string | null;
    iamRefreshToken: string | null;
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
            iamAccessToken: null,
            iamRefreshToken: null,
            isAuthenticated: false,
            isLoading: true,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const iamTokens = await iamLogin({ email, password });
                    const iamMe = await getIamMyAccess(iamTokens.access_token);

                    set({
                        token: iamTokens.access_token,
                        iamAccessToken: iamTokens.access_token,
                        iamRefreshToken: iamTokens.refresh_token,
                        user: mapIamUser(iamMe),
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set(EMPTY_AUTH);
                    throw toAuthError(error);
                }
            },

            logout: () => {
                set(EMPTY_AUTH);
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            },

            checkAuth: async () => {
                let accessToken = get().iamAccessToken;
                const refreshToken = get().iamRefreshToken;

                if (!accessToken) {
                    set({ ...EMPTY_AUTH });
                    return;
                }

                let iamMe: IamMeResponse | null = null;
                try {
                    iamMe = await getIamMyAccess(accessToken);
                } catch {
                    if (!refreshToken) {
                        set(EMPTY_AUTH);
                        return;
                    }

                    try {
                        const refreshed = await iamRefresh({ refresh_token: refreshToken });
                        accessToken = refreshed.access_token;
                        iamMe = await getIamMyAccess(accessToken);
                        set({
                            iamAccessToken: refreshed.access_token,
                            iamRefreshToken: refreshed.refresh_token,
                        });
                    } catch {
                        set(EMPTY_AUTH);
                        return;
                    }
                }

                set({
                    token: accessToken,
                    user: iamMe ? mapIamUser(iamMe) : null,
                    isAuthenticated: Boolean(iamMe),
                    isLoading: false,
                });
            },

            clearAuth: () => {
                set(EMPTY_AUTH);
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },
        }),
        {
            name: 'platform-console-auth',
            partialize: (state) => ({
                token: state.token,
                iamAccessToken: state.iamAccessToken,
                iamRefreshToken: state.iamRefreshToken,
                user: state.user,
            }),
        }
    )
);

export function getToken(): string | null {
    return useAuthStore.getState().token;
}

// Both CMS and IAM API clients use the same IAM token.
export function getAuthTokenForService(_service: 'cms' | 'iam'): string | null {
    return useAuthStore.getState().iamAccessToken;
}

export function clearAuthState(): void {
    useAuthStore.getState().clearAuth();
}
