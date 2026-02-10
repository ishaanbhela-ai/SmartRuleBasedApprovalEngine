import { User as UserIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface UserAvatarProps {
    user?: {
        name: string;
        email?: string;
        role?: string;
    };
    size?: 'sm' | 'md' | 'lg';
    showDetails?: boolean;
    className?: string;
}

export function UserAvatar({ user, size = 'md', showDetails = true, className }: UserAvatarProps) {
    if (!user) {
        return <div className="text-slate-400 italic">Unknown User</div>;
    }

    const sizeClasses = {
        sm: "h-6 w-6 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-10 w-10 text-base"
    };

    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn(
                "rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium shrink-0",
                sizeClasses[size]
            )}>
                {initials || <UserIcon className="h-4 w-4" />}
            </div>
            {showDetails && (
                <div>
                    <div className="font-medium text-slate-900">{user.name}</div>
                    {(user.email || user.role) && (
                        <div className="text-xs text-slate-500">
                            {user.email || <span className="capitalize">{user.role}</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
