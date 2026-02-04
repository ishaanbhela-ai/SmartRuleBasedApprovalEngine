import { useEffect, useState } from 'react'
import { FileText, Users, Shield, Clock } from 'lucide-react'
import { StatsCard } from '../../components/ui/StatsCard/StatsCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card/Card'
import { Badge } from '../../components/ui/Badge/Badge'
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader'
import { reportsService } from '../../services/reports'
import { requestsService } from '../../services/requests'
import { authService } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'
import type { ReportSummary } from '../../models/Report'
import type { Request as RequestItem } from '../../models/Request'

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<ReportSummary | null>(null)
    const [requests, setRequests] = useState<RequestItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                let requestsData: RequestItem[] = []
                const userRole = user?.role || 'user'

                if (userRole === 'approver') {
                    requestsData = await requestsService.getPendingRequests()
                } else if (userRole === 'admin') {
                    requestsData = await requestsService.getAllRequests()
                } else {
                    requestsData = await requestsService.getMyRequests()
                }

                const statsData = await reportsService.getSummary()

                setStats(statsData)
                setRequests(requestsData)
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-slate-500">Loading dashboard data...</p>
                </div>
            </div>
        )
    }

    const statCards = [
        {
            title: "Pending Requests",
            value: stats?.status_breakdown['submitted'] || 0,
            icon: Clock,
            description: "Awaiting review"
        },
        {
            title: "Active Rules",
            value: Object.keys(stats?.rule_hit_counts || {}).length,
            icon: Shield,
            description: "Active in system"
        },
        {
            title: "Total Requests",
            value: stats?.total_requests || 0,
            icon: FileText,
            description: "All time processed"
        },
        {
            title: "Approval Rate",
            value: `${Math.round(((stats?.decision_breakdown['approved'] || 0) / (stats?.total_requests || 1)) * 100)}%`,
            icon: Users,
            description: " acceptance rate"
        },
    ]

    function handleLogout(): void {
        authService.logout()
    }

    return (
        <div className="space-y-8">
            <DashboardHeader
                title="Dashboard"
                description="Overview of your validation and approval system."
                onLogout={handleLogout}
                actionLabel="Download Report"
                onAction={() => console.log("Download report")}
            />

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <StatsCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No recent requests found.</div>
                        ) : (
                            <div className="space-y-8">
                                {requests.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none text-slate-900">Request #{item.id}</p>
                                            <p className="text-xs text-slate-500">{item.type} • {item.requested_value}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <Badge variant={
                                                item.status === 'approved' ? 'success' :
                                                    item.status === 'rejected' ? 'destructive' : 'warning'
                                            }>
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions / Side Panel Placeholder */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-900">Rule Engine</p>
                                    <p className="text-xs text-slate-500">Operational</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-900">Database</p>
                                    <p className="text-xs text-slate-500">Connected</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-900">API Gateway</p>
                                    <p className="text-xs text-slate-500">Operational</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
