import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRequestSchema, type CreateRequestFormValues } from '../../models/Request';
import { requestTypesService } from '../../services/requestTypes';
import { requestsService } from '../../services/requests';
import { Button } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';
import type { RequestType } from '../../models/RequestType';

interface CreateRequestFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateRequestForm({ onSuccess, onCancel }: CreateRequestFormProps) {
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm<CreateRequestFormValues>({
        resolver: zodResolver(CreateRequestSchema)
    });

    const selectedTypeId = watch('request_type_id');
    const [balance, setBalance] = useState<{ limit: number, used: number, remaining: number } | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    useEffect(() => {
        if (!selectedTypeId) {
            setBalance(null);
            return;
        }

        const fetchBalance = async () => {
            setBalanceLoading(true);
            try {
                const data = await requestsService.getBalance(selectedTypeId);
                setBalance(data);
            } catch (error) {
                console.error("Failed to fetch balance", error);
                setBalance(null);
            } finally {
                setBalanceLoading(false);
            }
        };

        fetchBalance();
    }, [selectedTypeId]);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await requestTypesService.getRequestTypes();
                setRequestTypes(response.data);
            } catch (error) {
                console.error("Failed to load request types", error);
            }
        };
        fetchTypes();
    }, []);

    const onSubmit = async (data: CreateRequestFormValues) => {
        setIsLoading(true);
        try {
            await requestsService.createRequest({
                request_type_id: data.request_type_id,
                requested_value: Number(data.requested_value)
            });
            onSuccess();
        } catch (error: any) {
            console.error("Failed to create request", error);
            setError('root', {
                type: 'manual',
                message: error.response?.data?.error || "Failed to create request"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label htmlFor="request_type_id" className="block text-sm font-medium text-slate-700 mb-1">Request Type</label>
                <select
                    id="request_type_id"
                    {...register('request_type_id')}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">Select a type...</option>
                    {requestTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                            {type.name}
                        </option>
                    ))}
                </select>
                {errors.request_type_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.request_type_id.message}</p>
                )}
            </div>

            {selectedTypeId && (
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm">
                    {balanceLoading ? (
                        <span className="text-slate-500">Checking balance...</span>
                    ) : balance ? (
                        <div className="space-y-1">
                            <div className="flex justify-between text-slate-700">
                                <span>Quota Limit:</span>
                                <span className="font-medium">{balance.limit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                                <span>Used:</span>
                                <span className="font-medium">{balance.used.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-900 border-t border-slate-200 pt-1 mt-1">
                                <span className="font-medium">Remaining:</span>
                                <span className="font-medium text-primary-600">{balance.remaining.toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-slate-400 italic">Balance info unavailable</span>
                    )}
                </div>
            )}

            <Input
                id="requested-value"
                label="Requested Value"
                type="number"
                step="0.01"
                {...register('requested_value', { valueAsNumber: true })}
                error={errors.requested_value?.message}
            />

            {errors.root && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                    {errors.root.message}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting || isLoading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting || isLoading}>
                    Submit Request
                </Button>
            </div>
        </form>
    );
}
