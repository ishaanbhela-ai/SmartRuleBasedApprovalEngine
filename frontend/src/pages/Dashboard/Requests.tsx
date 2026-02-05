import { useEffect, useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { requestsService } from '../../services/requests';
import type { Request, ApproverRequest } from '../../models/Request';
import { useAuth } from '../../context/AuthContext';
import { FileText, CheckCircle, XCircle, Clock, ListFilter } from 'lucide-react';
import { CreateRequestForm } from '../../components/requests/CreateRequestForm';
import { Modal } from '../../components/ui/Modal/Modal';
import { ApprovalModal } from '../../components/requests/ApprovalModal';
import { cn } from '../../lib/utils';

export default function RequestsPage() {
    const { user } = useAuth();
    const userRole = user?.role || 'user';

    // State
    const [myRequests, setMyRequests] = useState<Request[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<ApproverRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState<'pending' | 'my_requests' | 'all_requests'>(
        userRole === 'approver' || userRole === 'admin' ? 'pending' : 'my_requests'
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedRequestToApprove, setSelectedRequestToApprove] = useState<ApproverRequest | null>(null);

    const getPageTitle = () => {
        if (userRole === 'admin') return activeTab === 'pending' ? "Pending Approvals" : "All Requests";
        if (userRole === 'approver') return activeTab === 'pending' ? "Approvals Required" : "My Requests";
        return "My Requests";
    };

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            if (userRole === 'approver') {
                const [pending, my] = await Promise.all([
                    requestsService.getPendingRequests(),
                    requestsService.getMyRequests()
                ]);
                setPendingApprovals(pending);
                setMyRequests(my);
            } else if (userRole === 'admin') {
                const [pending, all] = await Promise.all([
                    requestsService.getPendingRequests(),
                    requestsService.getAllRequests()
                ]);
                setPendingApprovals(pending);
                setMyRequests(all); // Using myRequests state to store 'all' for admin for simplicity
            } else {
                const data = await requestsService.getMyRequests();
                setMyRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [userRole]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
            case 'pending_approval':
                return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
            case 'auto_approved':
                return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"><CheckCircle className="w-3 h-3 mr-1" /> System</span>;
            default:
                return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Submitted</span>;
        }
    };

    // Render Approver Table (Pending Approvals)
    const renderApproverTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Requester</th>
                        <th className="px-6 py-3 font-medium">Value</th>
                        <th className="px-6 py-3 font-medium">Quota Impact</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {pendingApprovals.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium capitalize flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                    <FileText className="h-4 w-4" />
                                </div>
                                {req.request_type.name}
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-medium text-slate-900">{req.requester.name}</span>
                                <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                    Grade {req.requester.grade}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">
                                {req.requested_value.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                                <div className="flex flex-col gap-1">
                                    <span>Used: {req.quota.used.toLocaleString()} / {req.quota.limit.toLocaleString()}</span>
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-400 rounded-full"
                                            style={{ width: `${Math.min((req.quota.used / req.quota.limit) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => setSelectedRequestToApprove(req)}
                                    className="text-primary-600 hover:text-primary-700 font-medium text-xs border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    Review Request
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Render Standard Request Table (My Requests / All Requests)
    const renderStandardTable = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Value</th>
                        {userRole !== 'user' && <th className="px-6 py-3 font-medium">Requester</th>}
                        <th className="px-6 py-3 font-medium">Status / Reason</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {myRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium capitalize flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <FileText className="h-4 w-4" />
                                </div>
                                {req.request_type?.name || req.type}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                                {req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4">
                                {req.requested_value.toLocaleString()}
                            </td>
                            {userRole !== 'user' && (
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">{req.requester?.name || 'Unknown'}</span>
                                        <span className="text-xs text-slate-400">{req.requester?.email}</span>
                                        {req.requester?.grade && (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 w-fit mt-1">
                                                Grade {req.requester.grade}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <div>{getStatusBadge(req.status)}</div>
                                    {req.approval?.reason && (
                                        <div className="text-xs text-slate-500 italic max-w-xs break-words">
                                            "{req.approval.reason}"
                                        </div>
                                    )}
                                    {req.status === 'auto_approved' && (
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                            System Approved
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-8">
            <DashboardHeader
                title={getPageTitle()}
                description={
                    (userRole === 'approver' || userRole === 'admin') && activeTab === 'pending'
                        ? "Review and process incoming requests."
                        : "Track and manage requests."
                }
                actionLabel={userRole !== 'admin' ? "New Request" : undefined}
                onAction={() => setIsCreateModalOpen(true)}
            />

            {/* Approver & Admin Tabs */}
            {(userRole === 'approver' || userRole === 'admin') && (
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={cn(
                                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                                activeTab === 'pending'
                                    ? "border-primary-500 text-primary-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            <ListFilter className="h-4 w-4" />
                            Requires Approval
                            {pendingApprovals.length > 0 && (
                                <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs ml-1">
                                    {pendingApprovals.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab(userRole === 'admin' ? 'all_requests' : 'my_requests')}
                            className={cn(
                                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                                activeTab === 'my_requests' || activeTab === 'all_requests'
                                    ? "border-primary-500 text-primary-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            <Clock className="h-4 w-4" />
                            {userRole === 'admin' ? 'All Requests' : 'My Requests'}
                        </button>
                    </nav>
                </div>
            )}

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading requests...</div>
                    ) : (
                        (userRole === 'approver' || userRole === 'admin') && activeTab === 'pending' ? (
                            pendingApprovals.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                                        <CheckCircle className="h-full w-full" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                                    <p className="text-slate-500 mt-1">No pending requests requiring approval.</p>
                                </div>
                            ) : renderApproverTable()
                        ) : (
                            myRequests.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No requests found.</div>
                            ) : renderStandardTable()
                        )
                    )}
                </CardContent>
            </Card>

            {/* Create Request Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="New Request"
            >
                <CreateRequestForm
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchRequests();
                    }}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>

            {/* Approval Modal */}
            {selectedRequestToApprove && (
                <ApprovalModal
                    request={selectedRequestToApprove}
                    isOpen={!!selectedRequestToApprove}
                    onClose={() => setSelectedRequestToApprove(null)}
                    onSuccess={() => {
                        setSelectedRequestToApprove(null);
                        fetchRequests();
                    }}
                />
            )}
        </div>
    );
}
