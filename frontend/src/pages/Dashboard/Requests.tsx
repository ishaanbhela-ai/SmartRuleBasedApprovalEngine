import { useEffect, useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { requestsService } from '../../services/requests';
import type { Request } from '../../models/Request';
import { useAuth } from '../../context/AuthContext';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { CreateRequestForm } from '../../components/requests/CreateRequestForm';
import { Modal } from '../../components/ui/Modal/Modal';

export default function RequestsPage() {
    const { user } = useAuth();
    const userRole = user?.role || 'user';
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const getPageTitle = () => {
        if (userRole === 'admin') return "All Requests";
        if (userRole === 'approver') return "Pending Approvals";
        return "My Requests";
    };

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            let data: Request[] = [];
            if (userRole === 'approver') {
                data = await requestsService.getPendingRequests();
            } else if (userRole === 'admin') {
                data = await requestsService.getAllRequests();
            } else {
                data = await requestsService.getMyRequests();
            }
            setRequests(data);
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
            default:
                return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Submitted</span>;
        }
    };

    return (
        <div className="space-y-8">
            <DashboardHeader
                title={getPageTitle()}
                description={userRole === 'approver' ? "Requests requiring your attention." : "Track and manage your requests."}
                onLogout={() => { /* Handled by header internal logic or context */ }}
                actionLabel={userRole !== 'admin' ? "New Request" : undefined}
                onAction={() => setIsCreateModalOpen(true)}
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No requests found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Type</th>
                                        <th className="px-6 py-3 font-medium">Value</th>
                                        {userRole !== 'user' && <th className="px-6 py-3 font-medium">Requester</th>}
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        {userRole === 'approver' && <th className="px-6 py-3 font-medium text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium capitalize flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                {req.type}
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.requested_value.toLocaleString()}
                                            </td>
                                            {userRole !== 'user' && (
                                                <td className="px-6 py-4 text-slate-600">
                                                    {req.requester?.name || 'Unknown'} <span className="text-xs text-slate-400">({req.requester?.email})</span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            {userRole === 'approver' && (
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-primary-600 hover:underline font-medium text-xs">Review</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
        </div>
    );
}
