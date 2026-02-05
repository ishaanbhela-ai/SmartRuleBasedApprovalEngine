import { useEffect, useState } from 'react'
import { FileText, Users, Shield, Clock } from 'lucide-react'
import { StatsCard } from '../../components/ui/StatsCard/StatsCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card/Card'
import { Badge } from '../../components/ui/Badge/Badge'
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader'
import { reportsService } from '../../services/reports'
import { requestsService } from '../../services/requests'
import { useAuth } from '../../context/AuthContext'
import type { ReportSummary, UserReport, ApproverReport, ReportData } from '../../models/Report'
import type { Request as RequestItem } from '../../models/Request'

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<ReportData | null>(null) // Updated type
    const [requests, setRequests] = useState<RequestItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                let requestsData: RequestItem[] = []
                let statsData: ReportData

                const userRole = user?.role || 'user'

                if (userRole === 'admin') {
                    // Admin fetches global summary
                    statsData = await reportsService.getSummary();
                    requestsData = await requestsService.getAllRequests();
                } else {
                    // Everyone else fetches their own report
                    statsData = await reportsService.getMyReport();

                    if (userRole === 'approver') {
                        const pendingRequests = await requestsService.getPendingRequests()
                        requestsData = pendingRequests.map(req => ({
                            ...req,
                            type: req.request_type.name,
                            approval: null,
                            requester: { ...req.requester, email: '' }
                        })) as unknown as RequestItem[]
                    } else {
                        requestsData = await requestsService.getMyRequests()
                    }
                }

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

    // Determine Stats Cards based on Role
    let statCards: any[] = []; // Using any for flexibility in icon types, or define specific interface

    if (user?.role === 'admin' && stats && !('role' in stats)) { // Check for ReportSummary structure (no role field)
        const s = stats as ReportSummary;
        statCards = [
            {
                title: "Pending Requests",
                value: (s.status_breakdown['submitted'] || 0) + (s.status_breakdown['pending_approval'] || 0),
                icon: Clock,
                description: "Awaiting review"
            },
            {
                title: "Active Rules",
                value: Object.keys(s.rule_hit_counts || {}).length,
                icon: Shield,
                description: "Active in system"
            },
            {
                title: "Total Requests",
                value: s.total_requests || 0,
                icon: FileText,
                description: "All time processed"
            },
            {
                title: "Approval Rate",
                value: `${Math.round(((s.decision_breakdown['approved'] || 0) / (s.total_requests || 1)) * 100)}%`,
                icon: Users,
                description: " acceptance rate"
            },
        ]
    } else if (user?.role === 'approver' && stats && 'role' in stats && stats.role === 'approver') {
        const s = stats as ApproverReport;
        statCards = [
            { title: "Pending Inbox", value: s.pending_inbox, icon: Clock, description: "Needs your approval" },
            { title: "Total Reviewed", value: s.total_reviewed, icon: FileText, description: "Requests processed" },
            { title: "Approved By Me", value: s.approved_by_me, icon: Users, description: "Decisions made" },
            { title: "Rejected By Me", value: s.rejected_by_me, icon: Shield, description: "Decisions made" },
            { title: "Total Requests By Me", value: s.my_requests.total, icon: FileText, description: "Total Requests made by me" },
            { title: "Total Pending Requests By Me", value: s.my_requests.pending, icon: Users, description: "Requests pending approval" },

        ];
    } else if (stats && 'role' in stats && stats.role === 'user') {
        const s = stats as UserReport;
        statCards = [
            { title: "My Pending", value: s.pending, icon: Clock, description: "Waiting for approval" },
            { title: "Total Submitted", value: s.total_requests, icon: FileText, description: "All requests" },
            { title: "Approved", value: s.approved, icon: Users, description: "Requests approved" },
            { title: "Rejected", value: s.rejected, icon: Shield, description: "Requests rejected" }
        ];
    }

    return (
        <div className="space-y-8">
            <DashboardHeader
                title="Dashboard"
                description="Overview of your validation and approval system."
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
                                                item.status === 'approved' || item.status === 'auto_approved' ? 'success' :
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
                {/* Quick Actions / Side Panel */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{user?.role === 'admin' ? 'System Health' : 'Quick Actions'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user?.role === 'admin' ? (
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
                        ) : (
                            <div className="space-y-4">
                                <a
                                    href="dashboard/requests"
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700">Submit New Request</p>
                                        <p className="text-xs text-slate-500">Create a new approval request</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary-50">
                                        <FileText className="h-4 w-4 text-slate-500 group-hover:text-primary-600" />
                                    </div>
                                </a>

                                <a
                                    href="dashboard/rules"
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700">View Policies</p>
                                        <p className="text-xs text-slate-500">Check approval limits & rules</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary-50">
                                        <Shield className="h-4 w-4 text-slate-500 group-hover:text-primary-600" />
                                    </div>
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
