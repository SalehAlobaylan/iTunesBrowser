import Image from 'next/image';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { LoginForm } from '@/components/auth';

export default function LoginPage() {
    return (
        <div className="w-full max-w-md px-4">
            <div className="flex justify-center mb-8">
                <div className="flex items-center gap-3">
                    <Image src="/images/Wahb-logo-black.png" alt="Wahb" width={36} height={36} className="dark:hidden object-contain" />
                    <Image src="/images/Wahb-logo-White.png" alt="Wahb" width={36} height={36} className="hidden dark:block object-contain" />
                    <span className="text-2xl font-bold">Platform Console</span>
                </div>
            </div>

            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Sign in</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access the admin console
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    );
}
