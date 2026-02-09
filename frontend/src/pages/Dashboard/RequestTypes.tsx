import { useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import type { RequestType } from '../../models/RequestType';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { CreateRequestTypeForm } from '../../components/requestTypes/CreateRequestTypeForm';
import { Modal } from '../../components/ui/Modal/Modal';
import { Edit, Trash2 } from 'lucide-react';
import { RequestTypeIcon } from '../../components/ui/RequestTypeIcon/RequestTypeIcon';
import { UserAvatar } from '../../components/ui/UserAvatar/UserAvatar';
import { useRequestTypes, useDeleteRequestType } from '../../hooks/useRequestTypes';

export default function RequestTypesPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<RequestType | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Queries & Mutations
    const { data: requestTypesData, isLoading } = useRequestTypes(currentPage);
    const requestTypes = requestTypesData?.data || [];
    const paginationMeta = requestTypesData?.meta;

    const { mutate: deleteRequestType } = useDeleteRequestType();

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSuccess = () => {
        // Query invalidation handles the data refresh
        setNotification({
            type: 'success',
            message: editingType ? "Request Type updated successfully" : "Request Type created successfully"
        });

        setIsCreateModalOpen(false);
        setEditingType(null);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this request type?")) return;

        deleteRequestType(id, {
            onSuccess: () => {
                setNotification({ type: 'success', message: "Request Type deleted successfully" });
                setTimeout(() => setNotification(null), 3000);
            },
            onError: (error) => {
                console.error("Failed to delete", error);
                setNotification({ type: 'error', message: "Failed to delete request type." });
                setTimeout(() => setNotification(null), 3000);
            }
        });
    };

    const openEditModal = (type: RequestType) => {
        setEditingType(type);
        setIsCreateModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingType(null);
        setIsCreateModalOpen(true);
    };

    return (
        <div className="space-y-8 relative">
            {notification && (
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[100] text-white animate-in slide-in-from-right-10 fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            <DashboardHeader
                title="Request Types"
                description="Configure request categories and their approvers."
                actionLabel="Create Type"
                onAction={openCreateModal}
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading types...</div>
                    ) : requestTypes.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No request types configured.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Approvers</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {requestTypes.map((rt) => (
                                        <tr key={rt.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <RequestTypeIcon className="bg-blue-50 text-blue-500" />
                                                    <span className="font-medium text-slate-900 capitalize">{rt.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {rt.approvers && rt.approvers.length > 0 ? (
                                                    <div className="flex flex-col gap-2">
                                                        {rt.approvers.map(approver => (
                                                            <UserAvatar
                                                                key={approver.id}
                                                                user={approver}
                                                                size="sm"
                                                                className="opacity-90"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">No approvers assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(rt)}
                                                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(rt.id)}
                                                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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

            {/* Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={editingType ? "Edit Request Type" : "Configure Request Type"}
            >
                <CreateRequestTypeForm
                    initialData={editingType || undefined} // Force undefined if null
                    onSuccess={handleSuccess}
                    onCancel={() => {
                        setIsCreateModalOpen(false);
                        setEditingType(null);
                    }}
                />
            </Modal>
        </div >
    );
}
