import { Logo } from '../Logo/Logo'

export interface BrandingHeaderProps {
    title?: string;
    subtitle?: string;
}

export function BrandingHeader({
    title = "SmartRule Engine",
    subtitle = "Enterprise Approval Administration"
}: BrandingHeaderProps) {
    return (
        <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-200">
                <Logo className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
            </h1>
            <p className="text-sm text-slate-500">
                {subtitle}
            </p>
        </div>
    )
}
