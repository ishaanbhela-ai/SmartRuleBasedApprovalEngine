import { Card, CardContent } from '../Card/Card'
import { cn } from '../../../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: number
        label: string
        positive?: boolean
    }
    className?: string
}

export function StatsCard({ title, value, icon: Icon, description, trend, className }: StatsCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary-600" />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                    {(description || trend) && (
                        <div className="flex items-center text-xs text-slate-500">
                            {trend && (
                                <span className={cn(
                                    "font-medium mr-2",
                                    trend.positive ? "text-emerald-600" : "text-red-600"
                                )}>
                                    {trend.positive ? "+" : ""}{trend.value}%
                                </span>
                            )}
                            {description && <span>{description}</span>}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
