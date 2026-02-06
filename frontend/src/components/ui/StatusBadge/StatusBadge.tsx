import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    switch (status) {
        case 'approved':
            return <span className={`inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ${className || ''}`}><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
        case 'rejected':
            return <span className={`inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 ${className || ''}`}><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
        case 'pending_approval':
            return <span className={`inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ${className || ''}`}><Clock className="w-3 h-3 mr-1" /> Pending</span>;
        case 'auto_approved':
            return <span className={`inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 ${className || ''}`}><CheckCircle className="w-3 h-3 mr-1" /> System</span>;
        default:
            return <span className={`inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 ${className || ''}`}>Submitted</span>;
    }
}
