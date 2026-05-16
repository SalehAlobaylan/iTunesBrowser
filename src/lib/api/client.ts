import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';
import { getAuthTokenForService, clearAuthState } from '@/lib/stores/auth';

// API Error type
export interface ApiError {
    message: string;
    status: number;
    code?: string;
}

// ApiClient interface as defined in the refactoring plan
export interface ApiClient {
    get<T>(url: string, params?: object): Promise<T>;
    post<T>(url: string, data?: object): Promise<T>;
    put<T>(url: string, data?: object): Promise<T>;
    patch<T>(url: string, data?: object): Promise<T>;
    delete<T>(url: string): Promise<T>;
}

type AuthService = 'cms' | 'iam';

// Error handler function type for custom error handling
type ErrorHandler = (error: ApiError) => void;

// Default error handlers
let on401Handler: ErrorHandler = () => {
    // Clear auth state and redirect to login
    clearAuthState();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};

let on403Handler: ErrorHandler = (error) => {
    // Permission denied - will be overridden by AuthProvider to show toast
    console.error('Permission denied:', error.message);
};

// Set custom error handlers
export function setErrorHandlers(handlers: {
    on401?: ErrorHandler;
    on403?: ErrorHandler;
}) {
    if (handlers.on401) on401Handler = handlers.on401;
    if (handlers.on403) on403Handler = handlers.on403;
}

// Create an axios instance with interceptors
function createAxiosInstance(baseURL: string, service: AuthService): AxiosInstance {
    const instance = axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor - inject JWT token
    instance.interceptors.request.use(
        (config) => {
            const token = getAuthTokenForService(service);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor - handle errors
    instance.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError<{ message?: string }>) => {
            const apiError: ApiError = {
                message: error.response?.data?.message || error.message || 'An error occurred',
                status: error.response?.status || 500,
                code: error.code,
            };

            // Handle specific status codes
            if (apiError.status === 401) {
                on401Handler(apiError);
            } else if (apiError.status === 403) {
                on403Handler(apiError);
            }

            return Promise.reject(apiError);
        }
    );

    return instance;
}

// Create an API client from an axios instance
function createApiClient(axiosInstance: AxiosInstance): ApiClient {
    return {
        async get<T>(url: string, params?: object): Promise<T> {
            const config: AxiosRequestConfig = params ? { params } : {};
            const response = await axiosInstance.get<T>(url, config);
            return response.data;
        },

        async post<T>(url: string, data?: object): Promise<T> {
            const response = await axiosInstance.post<T>(url, data);
            return response.data;
        },

        async put<T>(url: string, data?: object): Promise<T> {
            const response = await axiosInstance.put<T>(url, data);
            return response.data;
        },

        async patch<T>(url: string, data?: object): Promise<T> {
            const response = await axiosInstance.patch<T>(url, data);
            return response.data;
        },

        async delete<T>(url: string): Promise<T> {
            const response = await axiosInstance.delete<T>(url);
            return response.data;
        },
    };
}

// Environment variables for base URLs.
// Dev fallback only — production builds must set both env vars explicitly so a
// missing config doesn't silently point at a developer's laptop. Falls back
// to a placeholder string (not '') so axios doesn't normalize requests to the
// current page origin at runtime if the env is genuinely missing; the
// placeholder URL is obviously bogus and will fail fast on first call.
//
// The previous version threw at module load, which broke `next build`'s
// static-page prerender step in container orchestrators that inject env at
// runtime only. We log a warning instead and let calls fail with a real
// network error at request time.
const isDev = process.env.NODE_ENV === 'development';
const PLACEHOLDER_URL = 'http://cms-base-url-not-configured.invalid';

const CMS_BASE_URL =
    process.env.NEXT_PUBLIC_CMS_BASE_URL ||
    (isDev ? 'http://localhost:8080' : PLACEHOLDER_URL);
const IAM_BASE_URL =
    process.env.NEXT_PUBLIC_IAM_BASE_URL ||
    (isDev ? 'http://localhost:4003' : PLACEHOLDER_URL);

if (typeof window === 'undefined' && !isDev) {
    if (CMS_BASE_URL === PLACEHOLDER_URL) {
        console.warn(
            '[platform-console] NEXT_PUBLIC_CMS_BASE_URL is not set; CMS calls will fail at runtime.'
        );
    }
    if (IAM_BASE_URL === PLACEHOLDER_URL) {
        console.warn(
            '[platform-console] NEXT_PUBLIC_IAM_BASE_URL is not set; IAM calls will fail at runtime.'
        );
    }
}

// Create axios instances
const cmsAxios = createAxiosInstance(CMS_BASE_URL, 'cms');
const iamAxios = createAxiosInstance(IAM_BASE_URL, 'iam');

// Export pre-configured API clients
export const cmsClient: ApiClient = createApiClient(cmsAxios);
export const iamClient: ApiClient = createApiClient(iamAxios);

// Export a function to create custom clients if needed
export function createClient(baseURL: string, service: AuthService = 'cms'): ApiClient {
    return createApiClient(createAxiosInstance(baseURL, service));
}
