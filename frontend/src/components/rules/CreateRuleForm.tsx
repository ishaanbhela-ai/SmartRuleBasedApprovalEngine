import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRuleSchema, type CreateRuleFormValues } from '../../models/Rule';
import { Button } from '../ui/Button/Button';
import { useEffect, useState } from 'react';
import { requestTypesService } from '../../services/requestTypes';
import type { RequestType } from '../../models/RequestType';

interface CreateRuleFormProps {
    onSuccess: (data: any) => void;
    onCancel: () => void;
}

export function CreateRuleForm({ onSuccess, onCancel }: CreateRuleFormProps) {
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateRuleFormValues>({
        resolver: zodResolver(CreateRuleSchema),
    });

    useEffect(() => {
        const fetchTypes = async () => {
            setIsLoadingTypes(true);
            try {
                const response = await requestTypesService.getRequestTypes();
                setRequestTypes(response.data);
            } catch (err) {
                console.error("Failed to fetch request types", err);
            } finally {
                setIsLoadingTypes(false);
            }
        };
        fetchTypes();
    }, []);

    const onSubmit = async (data: CreateRuleFormValues) => {
        try {
            // Ensure definition is a number
            const payload = {
                ...data,
                definition: Number(data.definition)
            };
            await onSuccess(payload);
        } catch (error) {
            console.error("Form submission error", error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="request_type_id" className="text-sm font-medium text-slate-700">Request Type</label>
                <select
                    id="request_type_id"
                    {...register('request_type_id')}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoadingTypes}
                >
                    <option value="">Select a request type...</option>
                    {requestTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name.charAt(0).toUpperCase() + rt.name.slice(1)}</option>
                    ))}
                </select>
                {isLoadingTypes && <p className="text-xs text-slate-500">Loading request types...</p>}
                {errors.request_type_id && <p className="text-xs text-red-500">{errors.request_type_id.message}</p>}
            </div>

            <div className="space-y-2">
                <label htmlFor="grade" className="text-sm font-medium text-slate-700">Grade</label>
                <select
                    id="grade"
                    {...register('grade')}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">Select Grade...</option>
                    <option value="1">Grade 1 (Junior)</option>
                    <option value="2">Grade 2 (Mid-Level)</option>
                    <option value="3">Grade 3 (Senior/Exec)</option>
                </select>
                {errors.grade && <p className="text-xs text-red-500">{errors.grade.message}</p>}
            </div>

            <div className="space-y-2">
                <label htmlFor="definition" className="text-sm font-medium text-slate-700">Limit Amount</label>
                <input
                    id="definition"
                    type="number"
                    {...register('definition', { valueAsNumber: true })}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. 1000"
                />
                {errors.definition && <p className="text-xs text-red-500">{errors.definition.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Create Rule</Button>
            </div>
        </form>
    );
}
