import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRequestTypeSchema, type CreateRequestTypeInput, REQUEST_TYPE_NAMES } from '../../models/RequestType';
import { Button } from '../ui/Button/Button';
// import { Input } from '../ui/Input/Input'; // Unused
// Since we don't have a specific Select component yet, I'll use native select with styling or simplistic custom div.
// Actually, I'll use a simple native select styled with Tailwind for now to ensure reliability.
import { useEffect, useState } from 'react';
import type { User } from '../../models/User';
import { userService } from '../../services/users';

interface CreateRequestTypeFormProps {
    onSuccess: (data: any) => void;
    onCancel: () => void;
}

export function CreateRequestTypeForm({ onSuccess, onCancel }: CreateRequestTypeFormProps) {
    const [approvers, setApprovers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateRequestTypeInput>({
        resolver: zodResolver(CreateRequestTypeSchema),
    });

    useEffect(() => {
        const fetchApprovers = async () => {
            setIsLoadingUsers(true);
            try {
                const users = await userService.getUsers();
                // Filter users: must act as approver and not be an admin
                const eligibleApprovers = users.filter(u => u.role === 'approver');
                setApprovers(eligibleApprovers);
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchApprovers();
    }, []);

    const onSubmit = async (data: CreateRequestTypeInput) => {
        try {
            await onSuccess(data);
        } catch (error) {
            console.error("Form submission error", error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type Name</label>
                <select
                    {...register('name')}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">Select a type...</option>
                    {REQUEST_TYPE_NAMES.map(name => (
                        <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
                    ))}
                </select>
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Approver</label>
                <select
                    {...register('approver_id')}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoadingUsers}
                >
                    <option value="">Select an approver...</option>
                    {approvers.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
                {isLoadingUsers && <p className="text-xs text-slate-500">Loading users...</p>}
                {errors.approver_id && <p className="text-xs text-red-500">{errors.approver_id.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Create Type</Button>
            </div>
        </form>
    );
}
