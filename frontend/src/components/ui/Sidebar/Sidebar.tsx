import { LayoutDashboard, FileText, Users, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import { Logo } from '../Logo/Logo'
import { useAuth } from '../../../context/AuthContext'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Requests', href: '/dashboard/requests', icon: FileText },
    { name: 'Request Types', href: '/dashboard/request-types', icon: FileText },
    { name: 'Rules', href: '/dashboard/rules', icon: Shield },
    { name: 'Users', href: '/dashboard/users', icon: Users },
]

export function Sidebar() {
    const { user } = useAuth()
    const userRole = user?.role || 'user'

    // Filter navigation based on role
    const filteredNavigation = navigation.filter(item => {
        // Admin sees everything
        if (userRole === 'admin') return true;

        // Approver & User see Dashboard, Requests, Rules, Settings
        if (userRole === 'approver' || userRole === 'user') {
            return ['Dashboard', 'Requests', 'Rules'].includes(item.name);
        }

        return false;
    });

    return (
        <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
            <div className="flex h-16 items-center px-6 border-b border-slate-200">
                <Logo className="h-6 w-6 mr-2" />
                <span className="text-lg font-bold text-slate-900">SmartRule</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {filteredNavigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.end}
                        className={({ isActive }) =>
                            cn(
                                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0",
                                        isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-500"
                                    )}
                                />
                                {item.name}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="border-t border-slate-200 p-4">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase">
                        {user?.name?.slice(0, 2) || 'US'}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-slate-700 truncate w-40">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
