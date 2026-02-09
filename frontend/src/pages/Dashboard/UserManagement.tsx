import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
// unused import removed
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { CreateUserForm } from '../../components/users/CreateUserForm';
import { Modal } from '../../components/ui/Modal/Modal';
import { UserAvatar } from '../../components/ui/UserAvatar/UserAvatar';
import { useUsers, useDeleteUser } from '../../hooks/useUsers';

export default function UserManagement() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Queries
    const { data: usersData, isLoading } = useUsers(currentPage);
    const users = usersData?.data || [];
    const paginationMeta = usersData?.meta;

    const { mutate: deleteUser } = useDeleteUser();

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDeleteUser = (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        deleteUser(id, {
            onSuccess: () => {
                showNotification('success', 'User deleted successfully');
            },
            onError: (error) => {
                console.error("Failed to delete user", error);
                showNotification('error', 'Failed to delete user');
            }
        });
    };

    const handleUserCreated = () => {
        setIsCreateModalOpen(false);
        showNotification('success', 'User created successfully');
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="space-y-8 relative">
            {notification && (
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[100] text-white animate-in slide-in-from-right-10 fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            <DashboardHeader
                title="User Management"
                description="Manage system users, roles, and access levels."
                actionLabel="Add User"
                onAction={() => setIsCreateModalOpen(true)}
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No users found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">User</th>
                                        <th className="px-6 py-3 font-medium">Role</th>
                                        <th className="px-6 py-3 font-medium">Grade</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <UserAvatar user={user} size="md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'approver' ? 'secondary' : 'outline'}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                                                    {user.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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

            {/* Simple Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New User"
            >
                <CreateUserForm
                    onSuccess={handleUserCreated}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
