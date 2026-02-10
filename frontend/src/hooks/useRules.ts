import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesService } from '../services/rules';
import type { CreateRuleInput } from '../models/Rule';

export const useRules = (page: number = 1) => {
    return useQuery({
        queryKey: ['rules', page],
        queryFn: () => rulesService.getRules(page),
        placeholderData: (previousData) => previousData,
    });
};

export const useCreateRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRuleInput) => rulesService.createRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
        },
    });
};

export const useDeleteRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rulesService.deleteRule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
        },
    });
};
