import { LogOut, Plus } from 'lucide-react'
import { Button } from '../Button/Button'
import { useAuth } from '../../../context/AuthContext'

interface DashboardHeaderProps {
    title: string
    description?: string
    onLogout?: () => void
    actionLabel?: string
    onAction?: () => void
}

export function DashboardHeader({ title, description, onLogout, actionLabel, onAction }: DashboardHeaderProps) {
    const { logout } = useAuth()

    const handleLogout = () => {
        if (onLogout) {
            onLogout()
        } else {
            logout()
        }
    }

    return (
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
                {description && <p className="text-slate-500">{description}</p>}
            </div>
            <div className="flex space-x-3 items-center">
                {actionLabel && onAction && (
                    <Button onClick={onAction}>
                        <Plus className="mr-2 h-4 w-4" />
                        {actionLabel}
                    </Button>
                )}
                <Button variant="secondary" onClick={handleLogout} className="text-slate-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
