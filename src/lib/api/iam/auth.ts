import axios from 'axios';
import type {
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    MeResponse,
    RefreshTokenRequest,
    TokenResponse,
} from './types';

const IAM_BASE_URL = process.env.NEXT_PUBLIC_IAM_BASE_URL;

interface IamErrorPayload {
    message?: string;
    error?: string;
    code?: string;
}

function ensureIamBaseUrl(): string {
    if (!IAM_BASE_URL) {
        throw {
            message: 'NEXT_PUBLIC_IAM_BASE_URL is not configured.',
            status: 500,
            code: 'IAM_BASE_URL_MISSING',
        };
    }
    return IAM_BASE_URL;
}

function authHeaders(accessToken?: string) {
    if (!accessToken) {
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
    };
}

function normalizeIamApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
        const payload = error.response?.data as IamErrorPayload | undefined;
        throw {
            message: payload?.message || payload?.error || error.message || 'IAM request failed',
            status: error.response?.status || 500,
            code: payload?.code || error.code,
        };
    }

    throw {
        message: 'IAM request failed',
        status: 500,
    };
}

export async function login(request: LoginRequest): Promise<TokenResponse> {
    try {
        const response = await axios.post<TokenResponse>(
            `${ensureIamBaseUrl()}/api/v1/auth/login`,
            request,
            {
                headers: authHeaders(),
            }
        );
        return response.data;
    } catch (error) {
        normalizeIamApiError(error);
    }
}

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
    try {
        const response = await axios.post<RegisterResponse>(
            `${ensureIamBaseUrl()}/api/v1/auth/register`,
            request,
            {
                headers: authHeaders(),
            }
        );
        return response.data;
    } catch (error) {
        normalizeIamApiError(error);
    }
}

export async function refresh(request: RefreshTokenRequest): Promise<TokenResponse> {
    try {
        const response = await axios.post<TokenResponse>(
            `${ensureIamBaseUrl()}/api/v1/auth/refresh`,
            request,
            {
                headers: authHeaders(),
            }
        );
        return response.data;
    } catch (error) {
        normalizeIamApiError(error);
    }
}

export async function getMyAccess(accessToken: string): Promise<MeResponse> {
    try {
        const response = await axios.get<MeResponse>(
            `${ensureIamBaseUrl()}/api/v1/roles/me`,
            {
                headers: authHeaders(accessToken),
            }
        );
        return response.data;
    } catch (error) {
        normalizeIamApiError(error);
    }
}
