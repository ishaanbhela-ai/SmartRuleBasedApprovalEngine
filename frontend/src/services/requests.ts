import api from '../lib/axios';
import type { Request, CreateRequestInput, ApprovalAction, ApproverRequest } from '../models/Request';

export const requestsService = {
    // For Users: Get my own requests
    getMyRequests: async (): Promise<Request[]> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => setTimeout(() => resolve([]), 500));
        }
        const response = await api.get<Request[]>('/requests');
        return response.data;
    },

    // For Approvers: Get requests pending my approval
    // For Approvers: Get requests pending my approval
    getPendingRequests: async (): Promise<ApproverRequest[]> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => setTimeout(() => resolve([]), 500));
        }
        const response = await api.get<ApproverRequest[]>('/approver/requests');
        return response.data;
    },

    // For Admin: Get all requests (reusing /requests endpoint if admin has access)
    getAllRequests: async (): Promise<Request[]> => {
        const response = await api.get<Request[]>('/requests');
        return response.data;
    },

    createRequest: async (data: CreateRequestInput): Promise<Request> => {
        const response = await api.post<Request>('/requests', data);
        return response.data;
    },

    // For Approvers: Approve or Reject
    processRequest: async (id: string, action: ApprovalAction): Promise<void> => {
        await api.put(`/approver/requests/${id}`, action);
    },

    getBalance: async (requestTypeId: string): Promise<{ limit: number; used: number; remaining: number }> => {
        const response = await api.get<{ limit: number; used: number; remaining: number }>('/requests/balance', {
            params: { request_type_id: requestTypeId }
        });
        return response.data;
    }
};
