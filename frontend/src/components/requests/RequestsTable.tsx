import type { Request } from '../../models/Request';
import { RequestTypeIcon } from '../ui/RequestTypeIcon/RequestTypeIcon';
import { StatusBadge } from '../ui/StatusBadge/StatusBadge';
import { UserAvatar } from '../ui/UserAvatar/UserAvatar';

interface RequestsTableProps {
    requests: Request[];
    showRequester?: boolean;
}

export function RequestsTable({ requests, showRequester = false }: RequestsTableProps) {
    if (requests.length === 0) {
        return <div className="p-8 text-center text-slate-500">No requests found.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 font-medium">Type</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Value</th>
                        {showRequester && <th className="px-6 py-3 font-medium">Requester</th>}
                        <th className="px-6 py-3 font-medium">Status / Reason</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium capitalize flex items-center gap-2">
                                <RequestTypeIcon className="h-8 w-8 bg-blue-50 text-blue-500" />
                                {req.request_type?.name || req.type}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                                {req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4">
                                {req.requested_value.toLocaleString()}
                            </td>
                            {showRequester && (
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">{req.requester?.name || 'Unknown'}</span>
                                        <span className="text-xs text-slate-400">{req.requester?.email}</span>
                                        {req.requester?.grade && (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 w-fit mt-1">
                                                Grade {req.requester.grade}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <div><StatusBadge status={req.status} /></div>
                                    {req.approval?.reason && (
                                        <div className="text-xs text-slate-500 italic max-w-xs break-words">
                                            "{req.approval.reason}"
                                        </div>
                                    )}
                                    {req.status === 'auto_approved' && (
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                            System Approved
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
