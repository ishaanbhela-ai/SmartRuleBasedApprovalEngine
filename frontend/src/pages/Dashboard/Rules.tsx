import { useEffect, useState } from 'react';
import { DashboardHeader } from '../../components/ui/Header/DashboardHeader';
import { Card, CardContent } from '../../components/ui/Card/Card';
import { rulesService } from '../../services/rules';
import type { Rule, CreateRuleInput } from '../../models/Rule';
import { CreateRuleForm } from '../../components/rules/CreateRuleForm';
import { Modal } from '../../components/ui/Modal/Modal';
import { Shield } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export default function RulesPage() {
    const { user } = useAuth();
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchRules = async () => {
        try {
            setIsLoading(true);
            const data = await rulesService.getRules();
            setRules(data);
        } catch (error) {
            console.error("Failed to fetch rules", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleCreate = async (data: CreateRuleInput) => {
        try {
            const newRule = await rulesService.createRule(data);
            setRules([...rules, newRule]);
            setIsCreateModalOpen(false);
            setNotification({ type: 'success', message: "Rule created successfully" });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error("Failed to create rule", error);
            setNotification({ type: 'error', message: "Failed to create rule." });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    return (
        <div className="space-y-8 relative">
            {notification && (
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 text-white animate-in slide-in-from-right-10 fade-in duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            <DashboardHeader
                title="Rules Configuration"
                description="Set approval limits for different request types and grades."
                onLogout={() => { /* Logout handled by header */ }}
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
                                                    <span className="font-medium text-slate-900 capitalize">{rule.request_type}</span>
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
                title="Configure Rule"
            >
                <CreateRuleForm
                    onSuccess={handleCreate}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
