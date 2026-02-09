import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsService } from '../services/requests';
import type { CreateRequestInput, ApprovalAction, RequestFilters } from '../models/Request';

export const useMyRequests = (page: number = 1, filters?: RequestFilters, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['requests', 'my', page, filters],
        queryFn: () => requestsService.getMyRequests(page, filters),
        placeholderData: (previousData) => previousData,
        ...options
    });
};

export const usePendingRequests = (page: number = 1, filters?: RequestFilters, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['requests', 'pending', page, filters],
        queryFn: () => requestsService.getPendingRequests(page, filters),
        placeholderData: (previousData) => previousData,
        ...options
    });
};

export const useAllRequests = (page: number = 1, filters?: RequestFilters, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['requests', 'all', page, filters],
        queryFn: () => requestsService.getAllRequests(page, filters),
        placeholderData: (previousData) => previousData,
        ...options
    });
};

export const useRequestBalance = (requestTypeId: string) => {
    return useQuery({
        queryKey: ['requests', 'balance', requestTypeId],
        queryFn: () => requestsService.getBalance(requestTypeId),
        enabled: !!requestTypeId,
    });
};

export const useCreateRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRequestInput) => requestsService.createRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'my'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'all'] });
            // Also invalidate balance if relevant, but implementation details vary
        },
    });
};

export const useProcessRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, action }: { id: string; action: ApprovalAction }) =>
            requestsService.processRequest(id, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests', 'pending'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'all'] });
            queryClient.invalidateQueries({ queryKey: ['requests', 'my'] }); // Status updates
        },
    });
};
