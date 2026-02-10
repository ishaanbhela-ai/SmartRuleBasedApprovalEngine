import { useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
// type imports removed as they are inferred
import { CreateRuleForm } from '../../components/rules/CreateRuleForm';
import { Modal } from '../../components/ui/Modal/Modal';
import { Shield, Trash2 } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useRules, useDeleteRule } from '../../hooks/useRules';

export default function RulesPage() {
    const { user } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Queries
    const { data: rulesData, isLoading } = useRules(currentPage);
    const rules = rulesData?.data || [];
    const paginationMeta = rulesData?.meta;

    const { mutate: deleteRule } = useDeleteRule();

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false);
        setNotification({ type: 'success', message: "Rule created successfully" });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        deleteRule(id, {
            onSuccess: () => {
                setNotification({ type: 'success', message: "Rule deleted successfully" });
                setTimeout(() => setNotification(null), 3000);
            },
            onError: (error) => {
                console.error("Failed to delete rule", error);
                setNotification({ type: 'error', message: "Failed to delete rule." });
                setTimeout(() => setNotification(null), 3000);
            }
        });
    };

    return (
        <div className="space-y-8 relative">
            {notification && (
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-[100] text-white animate-in slide-in-from-right-10 fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            <DashboardHeader
                title="Rules Configuration"
                description="Set approval limits for different request types and grades."
                actionLabel={user?.role === 'admin' ? "Create Rule" : undefined}
                onAction={user?.role === 'admin' ? () => setIsCreateModalOpen(true) : undefined}
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading rules...</div>
                    ) : rules.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No rules configured.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Request Type</th>
                                        <th className="px-6 py-3 font-medium">Metric</th>
                                        <th className="px-6 py-3 font-medium">Target Grade</th>
                                        <th className="px-6 py-3 font-medium text-right">Limit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                        <Shield className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium text-slate-900 capitalize">{rule.request_type?.name ?? "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                Amount Check
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                                    Grade {rule.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                {rule.definition.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDelete(rule.id)}
                                                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                        title="Delete Rule"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {paginationMeta && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={paginationMeta.total_pages}
                            onPageChange={handlePageChange}
                            hasNext={currentPage < paginationMeta.total_pages}
                            hasPrev={currentPage > 1}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Configure Rule"
            >
                <CreateRuleForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
