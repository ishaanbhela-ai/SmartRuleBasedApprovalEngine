import { useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { useMyRequests, usePendingRequests, useAllRequests } from '../../hooks/useRequests';
import { useRequestTypes } from '../../hooks/useRequestTypes';
import type { ApproverRequest, Request, RequestFilters } from '../../models/Request';
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // UI State
    const [activeTab, setActiveTab] = useState<'pending' | 'my_requests' | 'all_requests'>(
        userRole === 'approver' || userRole === 'admin' ? 'pending' : 'my_requests'
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedRequestToApprove, setSelectedRequestToApprove] = useState<ApproverRequest | null>(null);

    const [filters, setFilters] = useState<RequestFilters>({});

    // Fetch Request Types for Filter Dropdown
    const { data: requestTypesData } = useRequestTypes(1); // Assuming 1 page covers most, or improve later
    const requestTypes = requestTypesData?.data || [];

    // Queries
    const {
        data: pendingData,
        isLoading: isPendingLoading
    } = usePendingRequests(currentPage, filters, { enabled: activeTab === 'pending' });

    const {
        data: myRequestsData,
        isLoading: isMyRequestsLoading
    } = useMyRequests(currentPage, filters, { enabled: activeTab === 'my_requests' });

    const {
        data: allRequestsData,
        isLoading: isAllRequestsLoading
    } = useAllRequests(currentPage, filters, { enabled: activeTab === 'all_requests' });

    // Also fetch pending count always if approver/admin, to show badge
    // We reuse the pending query for page 1 but ignore data if not active tab? 
    // Or we create a separate query for count? 
    // The previous code fetched pending count in background.
    // Let's use a separate query for the badge if needed, or just rely on the fact that if we aren't on pending tab, we don't know the count unless we fetch it.
    // The previous code did: if ((userRole === 'approver' || userRole === 'admin') && pendingCount === 0) calls fetchRequests(1)

    // For now, let's just use a separate query for count if user is approver/admin and not on pending tab
    const { data: pendingCountData } = usePendingRequests(1, filters, {
        enabled: (userRole === 'approver' || userRole === 'admin') && activeTab !== 'pending'
    });

    const pendingCount = activeTab === 'pending'
        ? pendingData?.meta.total_count || 0
        : pendingCountData?.meta.total_count || 0;

    const getPageTitle = () => {
        if (userRole === 'admin') return activeTab === 'pending' ? "Pending Approvals" : "All Requests";
        if (userRole === 'approver') return activeTab === 'pending' ? "Approvals Required" : "My Requests";
        return "My Requests";
    };

    const handleTabChange = (tab: 'pending' | 'my_requests' | 'all_requests') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Determine current data to display
    let currentData: (Request | ApproverRequest)[] = [];
    let currentMeta = null;
    let currentLoading = false;

    if (activeTab === 'pending') {
        currentData = pendingData?.data || [];
        currentMeta = pendingData?.meta;
        currentLoading = isPendingLoading;
    } else if (activeTab === 'my_requests') {
        currentData = myRequestsData?.data || [];
        currentMeta = myRequestsData?.meta;
        currentLoading = isMyRequestsLoading;
    } else if (activeTab === 'all_requests') {
        currentData = allRequestsData?.data || [];
        currentMeta = allRequestsData?.meta;
        currentLoading = isAllRequestsLoading;
    }

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

            {/* Filters Section */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                value={filters.status || ''}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, status: e.target.value || undefined }));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Statuses</option>
                                <option value="submitted">Submitted</option>
                                <option value="pending_approval">Pending Approval</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="auto_approved">Auto Approved</option>
                            </select>

                            <select
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                value={filters.request_type_id || ''}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, request_type_id: e.target.value || undefined }));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Request Types</option>
                                {requestTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>

                        </div>
                        {Object.keys(filters).length > 0 && (
                            <button
                                onClick={() => {
                                    setFilters({});
                                    setCurrentPage(1);
                                }}
                                className="mt-2 md:mt-0 text-sm text-red-600 hover:text-red-800 whitespace-nowrap"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {currentLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading requests...</div>
                    ) : (
                        (userRole === 'approver' || userRole === 'admin') && activeTab === 'pending' ? (
                            currentData.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                                        <CheckCircle className="h-full w-full" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                                    <p className="text-slate-500 mt-1">No pending requests requiring approval.</p>
                                </div>
                            ) : (
                                <ApprovalsTable
                                    requests={currentData as ApproverRequest[]}
                                    onReview={setSelectedRequestToApprove}
                                />
                            )
                        ) : (
                            <RequestsTable
                                requests={currentData as Request[]}
                                showRequester={userRole !== 'user'}
                            />
                        )
                    )}

                    {currentMeta && currentMeta.total_pages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={currentMeta.total_pages}
                            onPageChange={handlePageChange}
                            hasNext={currentMeta.page < currentMeta.total_pages}
                            hasPrev={currentMeta.page > 1}
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
                        // Queries automatically invalidated and refetched
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
                        // Queries automatically invalidated and refetched
                    }}
                />
            )}
        </div>
    );
}
