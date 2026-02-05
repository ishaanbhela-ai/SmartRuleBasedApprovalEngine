import { useState } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button/Button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ApproverRequest, ApprovalAction } from '../../models/Request';
import { requestsService } from '../../services/requests';

interface ApprovalModalProps {
    request: ApproverRequest;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ApprovalModal({ request, isOpen, onClose, onSuccess }: ApprovalModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async (action_type: 'approved' | 'rejected') => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (action_type === 'rejected' && !reason.trim()) {
                setError("A reason is required for rejection.");
                setIsSubmitting(false);
                return;
            }

            const action: ApprovalAction = {
                action_type,
                reason: reason.trim() || undefined
            };

            await requestsService.processRequest(request.id, action);
            onSuccess();
        } catch (err: any) {
            console.error("Failed to process request", err);
            setError(err.response?.data?.error || "Failed to process request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const percentageUsed = request.quota.limit > 0
        ? Math.round((request.quota.used / request.quota.limit) * 100)
        : 0;

    const isOverLimit = request.requested_value > request.quota.remaining;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Review Request"
        >
            <div className="space-y-6">
                {/* Request Details */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">Request Type</p>
                            <p className="font-medium text-slate-900 capitalize">{request.request_type.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Amount</p>
                            <p className="text-xl font-bold text-slate-900">{request.requested_value.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Requester Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-medium">Requester</p>
                        <p className="text-slate-900">{request.requester.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-medium">Grade</p>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                            Grade {request.requester.grade}
                        </span>
                    </div>
                </div>

                {/* Quota / Balance Info */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-sm font-medium text-slate-900">Budget & Quota</h4>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Total Limit</span>
                            <span className="font-medium">{request.quota.limit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Used</span>
                            <span className="font-medium">{request.quota.used.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Remaining</span>
                            <span className={`font-medium ${request.quota.remaining < request.requested_value ? 'text-red-600' : 'text-emerald-600'}`}>
                                {request.quota.remaining.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-100">
                            <div
                                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${percentageUsed > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            ></div>
                        </div>
                    </div>

                    {isOverLimit && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>This request exceeds the remaining budget.</p>
                        </div>
                    )}
                </div>

                {/* Action Form */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">
                            Reason / Comments <span className="text-slate-400 font-normal">(Required for rejection)</span>
                        </label>
                        <textarea
                            id="reason"
                            rows={3}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Add a note..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleAction('rejected')}
                            disabled={isSubmitting}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                        <Button
                            // variant="success" // Assuming we don't have a distinct success variant, default primary or custom class
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleAction('approved')}
                            disabled={isSubmitting}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
