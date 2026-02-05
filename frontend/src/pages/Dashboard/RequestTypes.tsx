import { useEffect, useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { requestTypesService } from '../../services/requestTypes';
import type { RequestType } from '../../models/RequestType';
import { CreateRequestTypeForm } from '../../components/requestTypes/CreateRequestTypeForm';
import { Modal } from '../../components/ui/Modal/Modal';
import { FileText, User as UserIcon, Edit, Trash2 } from 'lucide-react';

export default function RequestTypesPage() {
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<RequestType | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchRequestTypes = async () => {
        try {
            setIsLoading(true);
            const data = await requestTypesService.getRequestTypes();
            setRequestTypes(data);
        } catch (error) {
            console.error("Failed to fetch request types", error);
            // setNotification({ type: 'error', message: "Failed to load request types" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequestTypes();
    }, []);

    const handleSuccess = (updatedOrNewType: RequestType) => {
        if (editingType) {
            setRequestTypes(requestTypes.map(rt => rt.id === updatedOrNewType.id ? updatedOrNewType : rt));
            setNotification({ type: 'success', message: "Request Type updated successfully" });
        } else {
            setRequestTypes([...requestTypes, updatedOrNewType]);
            setNotification({ type: 'success', message: "Request Type created successfully" });
        }
        setIsCreateModalOpen(false);
        setEditingType(null);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this request type?")) return;
        try {
            await requestTypesService.deleteRequestType(id);
            setRequestTypes(requestTypes.filter(rt => rt.id !== id));
            setNotification({ type: 'success', message: "Request Type deleted successfully" });
        } catch (error) {
            console.error("Failed to delete", error);
            setNotification({ type: 'error', message: "Failed to delete request type." });
        }
        setTimeout(() => setNotification(null), 3000);
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
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 text-white animate-in slide-in-from-right-10 fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
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
                                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium text-slate-900 capitalize">{rt.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {rt.approvers && rt.approvers.length > 0 ? (
                                                    <div className="flex flex-col gap-2">
                                                        {rt.approvers.map(approver => (
                                                            <div key={approver.id} className="flex items-center gap-2">
                                                                <UserIcon className="h-4 w-4 text-slate-400" />
                                                                <div>
                                                                    <div className="text-slate-900 text-sm">{approver.name}</div>
                                                                    <div className="text-xs text-slate-500">{approver.email}</div>
                                                                </div>
                                                            </div>
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
