'use client';

import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { LoginForm } from '@/components/auth';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from '@/components/ui/toast';

function WahbLoginMark() {
    return (
        <>
            <span
                aria-hidden="true"
                className="block h-8 w-8 rounded-lg bg-cover bg-center dark:hidden"
                style={{ backgroundImage: "url('/images/wahb_favicon_white_bg.png')" }}
            />
            <span
                aria-hidden="true"
                className="hidden h-8 w-8 rounded-lg bg-cover bg-center dark:block"
                style={{ backgroundImage: "url('/images/wahb_favicon_dark_bg.png')" }}
            />
            <span className="sr-only">Wahb</span>
        </>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const handleQuickLogin = async () => {
        try {
            await login('admin@gmail.com', 'admin');
            toast({
                title: 'Welcome back!',
                description: 'Quick sign-in successful.',
                variant: 'success',
            });
            router.push('/');
        } catch (err) {
            console.error('[quick-login] failed:', err);
            const e = err as { message?: string; status?: number; code?: string };
            toast({
                title: 'Quick login failed',
                description: e?.message || 'Could not sign in with default credentials.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="w-full max-w-sm px-4">
            <div className="mb-8 flex flex-col items-center gap-3">
                <button
                    type="button"
                    onClick={handleQuickLogin}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-sm transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                    title="Quick sign in"
                >
                    <WahbLoginMark />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-semibold tracking-tight">Platform Console</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Wahb Content Management</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-lg text-center">Sign in</CardTitle>
                    <CardDescription className="text-center text-xs">
                        Enter your credentials to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    );
}
