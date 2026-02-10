import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRuleSchema, type CreateRuleFormValues, type Rule } from '../../models/Rule';
import { Button } from '../ui/Button/Button';
import { useRequestTypes } from '../../hooks/useRequestTypes';
import { useCreateRule } from '../../hooks/useRules';

interface CreateRuleFormProps {
    onSuccess: (data: Rule) => void;
    onCancel: () => void;
}

export function CreateRuleForm({ onSuccess, onCancel }: CreateRuleFormProps) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors } } = useForm<CreateRuleFormValues>({
        resolver: zodResolver(CreateRuleSchema),
    });

    const { data: requestTypesData, isLoading: isLoadingTypes } = useRequestTypes(1);
    const requestTypes = requestTypesData?.data || [];

    const { mutate: createRule, isPending: isSubmitting } = useCreateRule();

    const onSubmit = (data: CreateRuleFormValues) => {
        setSubmitError(null);
        // Ensure definition is a number
        const payload = {
            ...data,
            grade: Number(data.grade),
            definition: Number(data.definition)
        };

        createRule(payload, {
            onSuccess: (newRule: Rule) => {
                onSuccess(newRule);
            },
            onError: (error: any) => { // Axios error or standard error
                console.error("Form submission error", error);
                const errorData = error.response?.data;
                let errorMessage = "Failed to create rule. Please try again.";

                if (errorData?.errors && Array.isArray(errorData.errors)) {
                    errorMessage = errorData.errors.join(", ");
                } else if (errorData?.error) {
                    errorMessage = errorData.error;
                }

                setSubmitError(errorMessage);
            }
        });
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

            {submitError && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                    {submitError}
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Create Rule</Button>
            </div>
        </form>
    );
}
