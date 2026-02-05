import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRequestTypeSchema, type CreateRequestTypeInput, REQUEST_TYPE_NAMES, type RequestType } from '../../models/RequestType';
import { Button } from '../ui/Button/Button';
// import { Input } from '../ui/Input/Input'; // Unused
// Since we don't have a specific Select component yet, I'll use native select with styling or simplistic custom div.
// Actually, I'll use a simple native select styled with Tailwind for now to ensure reliability.
import { useEffect, useState } from 'react';
import type { User } from '../../models/User';
import { userService } from '../../services/users';
import { requestTypesService } from '../../services/requestTypes';

interface CreateRequestTypeFormProps {
    initialData?: RequestType;
    onSuccess: (data: RequestType) => void;
    onCancel: () => void;
}

export function CreateRequestTypeForm({ initialData, onSuccess, onCancel }: CreateRequestTypeFormProps) {
    const [approvers, setApprovers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateRequestTypeInput>({
        resolver: zodResolver(CreateRequestTypeSchema),
        defaultValues: {
            name: initialData?.name,
            approver_ids: initialData?.approvers?.map(a => a.id) || []
        }
    });

    const currentApproverIds = watch('approver_ids');

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
        setSubmitError(null);
        try {
            let result: RequestType;
            if (initialData?.id) {
                result = await requestTypesService.updateRequestType(initialData.id, data);
            } else {
                result = await requestTypesService.createRequestType(data);
            }
            onSuccess(result);
        } catch (error: any) {
            console.error("Form submission error", error);
            setSubmitError(error.response?.data?.error || "Failed to save request type");
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
                <label className="text-sm font-medium text-slate-700">Approvers</label>
                <div className="flex gap-2">
                    <select
                        id="approver-select"
                        className="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoadingUsers}
                    >
                        <option value="">Select an approver...</option>
                        {approvers
                            .filter(user => !currentApproverIds?.includes(user.id))
                            .map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                    </select>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            const select = document.getElementById('approver-select') as HTMLSelectElement;
                            const val = select.value;
                            if (val) {
                                const newIds = [...(currentApproverIds || []), val];
                                setValue('approver_ids', newIds, { shouldValidate: true });
                                select.value = "";
                            }
                        }}
                    >
                        Add
                    </Button>
                </div>

                {isLoadingUsers && <p className="text-xs text-slate-500">Loading users...</p>}

                <div className="flex flex-wrap gap-2 mt-2">
                    {currentApproverIds?.map(id => {
                        const user = approvers.find(u => u.id === id) || initialData?.approvers?.find(a => a.id === id);
                        return (
                            <div key={id} className="flex items-center gap-1 bg-slate-100 text-slate-900 px-2 py-1 rounded text-sm border border-slate-200">
                                <span>{user?.name || id}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newIds = currentApproverIds.filter(x => x !== id);
                                        setValue('approver_ids', newIds, { shouldValidate: true });
                                    }}
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    &times;
                                </button>
                            </div>
                        );
                    })}
                </div>

                {errors.approver_ids && <p className="text-xs text-red-500">{errors.approver_ids.message}</p>}
            </div>

            {submitError && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                    {submitError}
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>
                    {initialData ? 'Update Type' : 'Create Type'}
                </Button>
            </div>
        </form>
    );
}
