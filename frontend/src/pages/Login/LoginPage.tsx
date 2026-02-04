import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card/Card'
import { Input } from '../../components/ui/Input/Input'
import { Button } from '../../components/ui/Button/Button'
import { Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BrandingHeader } from '../../components/ui/Header/BrandingHeader'
import { type LoginCredentials, LoginCredentialsSchema } from '../../models/Auth'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginCredentials>({
        resolver: zodResolver(LoginCredentialsSchema),
    })

    const onSubmit = async (data: LoginCredentials) => {
        setLoginError(null)
        setLoading(true)

        try {
            await login(data)

            // Navigate to dashboard
            navigate('/dashboard')
        } catch (err: any) {
            console.error(err)
            setLoginError(err.response?.data?.message || "Invalid email or password. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[440px] space-y-8">

                {/* Branding Header */}
                <BrandingHeader />

                {/* Login Card */}
                <Card className="shadow-xl shadow-slate-200/50 border-slate-100">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Sign In</CardTitle>
                        <CardDescription>
                            Access the rules and approval dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {loginError && (
                                <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{loginError}</span>
                                </div>
                            )}

                            <Input
                                label="Email Address"
                                placeholder="name@company.com"
                                type="email"
                                startIcon={<Mail className="h-4 w-4" />}
                                {...register('email')}
                                error={errors.email?.message}
                            />
                            <div className="space-y-2">
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    startIcon={<Lock className="h-4 w-4" />}
                                    {...register('password')}
                                    error={errors.password?.message}
                                />
                            </div>

                            <div className="flex justify-end">
                                <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                    Forgot Password?
                                </a>
                            </div>

                            <Button type="submit" variant="secondary" fullWidth size="lg" isLoading={loading}>
                                Sign In &rarr;
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Badge */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <span>Secure Admin Access</span>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 uppercase tracking-wider">
                    &copy; 2024 SmartRule Engine Enterprise v4.2.0
                </p>
            </div>
        </div>
    )
}
