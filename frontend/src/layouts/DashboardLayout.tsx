import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/ui/Sidebar/Sidebar'

export default function DashboardLayout() {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
