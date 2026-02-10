import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestTypesService } from '../services/requestTypes';
import type { CreateRequestTypeInput } from '../models/RequestType';

export const useRequestTypes = (page: number = 1) => {
    return useQuery({
        queryKey: ['requestTypes', page],
        queryFn: () => requestTypesService.getRequestTypes(page),
        placeholderData: (previousData) => previousData,
    });
};

export const useCreateRequestType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRequestTypeInput) => requestTypesService.createRequestType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requestTypes'] });
        },
    });
};

export const useUpdateRequestType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateRequestTypeInput> }) =>
            requestTypesService.updateRequestType(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requestTypes'] });
        },
    });
};

export const useDeleteRequestType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => requestTypesService.deleteRequestType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requestTypes'] });
        },
    });
};
