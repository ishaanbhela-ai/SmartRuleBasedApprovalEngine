import { useEffect, useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { requestsService } from '../../services/requests';
import type { Request, ApproverRequest } from '../../models/Request';
import type { PaginationMeta } from '../../models/common';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Clock, ListFilter } from 'lucide-react';
import { CreateRequestForm } from '../../components/requests/CreateRequestForm';
import { Modal } from '../../components/ui/Modal/Modal';
import { ApprovalModal } from '../../components/requests/ApprovalModal';
import { cn } from '../../lib/utils';
import { ApprovalsTable } from '../../components/requests/ApprovalsTable';
import { RequestsTable } from '../../components/requests/RequestsTable';

export default function RequestsPage() {
    const { user } = useAuth();
    const userRole = user?.role || 'user';

    // State
    const [myRequests, setMyRequests] = useState<Request[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<ApproverRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
    const [pendingCount, setPendingCount] = useState<number>(0);

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
            if (activeTab === 'pending') {
                const response = await requestsService.getPendingRequests(currentPage);
                setPendingApprovals(response.data);
                setPaginationMeta(response.meta);
                setPendingCount(response.meta.total_count);
            } else if (activeTab === 'my_requests') {
                const response = await requestsService.getMyRequests(currentPage);
                setMyRequests(response.data);
                setPaginationMeta(response.meta);

                if ((userRole === 'approver' || userRole === 'admin') && pendingCount === 0) {
                    requestsService.getPendingRequests(1).then(res => setPendingCount(res.meta.total_count)).catch(() => { });
                }
            } else if (activeTab === 'all_requests') {
                const response = await requestsService.getAllRequests(currentPage);
                setMyRequests(response.data);
                setPaginationMeta(response.meta);
                if (pendingCount === 0) {
                    requestsService.getPendingRequests(1).then(res => setPendingCount(res.meta.total_count)).catch(() => { });
                }
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [userRole, activeTab, currentPage]);

    const handleTabChange = (tab: 'pending' | 'my_requests' | 'all_requests') => {
        setActiveTab(tab);
        setCurrentPage(1);
        setPaginationMeta(null);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

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

            {(userRole === 'approver' || userRole === 'admin') && (
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => handleTabChange('pending')}
                            className={cn(
                                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                                activeTab === 'pending'
                                    ? "border-primary-500 text-primary-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            <ListFilter className="h-4 w-4" />
                            Requires Approval
                            {pendingCount > 0 && (
                                <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs ml-1">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange(userRole === 'admin' ? 'all_requests' : 'my_requests')}
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
                            ) : (
                                <ApprovalsTable
                                    requests={pendingApprovals}
                                    onReview={setSelectedRequestToApprove}
                                />
                            )
                        ) : (
                            <RequestsTable
                                requests={myRequests}
                                showRequester={userRole !== 'user'}
                            />
                        )
                    )}

                    {paginationMeta && paginationMeta.total_pages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={paginationMeta.total_pages}
                            onPageChange={handlePageChange}
                            hasNext={paginationMeta.page < paginationMeta.total_pages}
                            hasPrev={paginationMeta.page > 1}
                        />
                    )}
                </CardContent>
            </Card>

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
