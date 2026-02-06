import type { ApproverRequest } from '../../models/Request';
import { RequestTypeIcon } from '../ui/RequestTypeIcon/RequestTypeIcon';

interface ApprovalsTableProps {
    requests: ApproverRequest[];
    onReview: (request: ApproverRequest) => void;
}

export function ApprovalsTable({ requests, onReview }: ApprovalsTableProps) {
    if (requests.length === 0) {
        return null;
    }

    return (
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
                    {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium capitalize flex items-center gap-2">
                                <RequestTypeIcon className="h-8 w-8 text-indigo-500 bg-indigo-50" />
                                {req.request_type.name}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">{req.requester.name}</span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                        Grade {req.requester.grade}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">
                                {req.requested_value.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                                {req.quota ? (
                                    <div className="flex flex-col gap-1">
                                        <span>Used: {req.quota.used.toLocaleString()} / {req.quota.limit.toLocaleString()}</span>
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-400 rounded-full"
                                                style={{ width: `${Math.min((req.quota.used / req.quota.limit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 italic">Unavailable</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onReview(req)}
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
}
