import { FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RequestTypeIconProps {
    className?: string;
}

export function RequestTypeIcon({ className }: RequestTypeIconProps) {
    return (
        <div className={cn(
            "h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0",
            className
        )}>
            <FileText className="h-4 w-4" />
        </div>
    );
}
