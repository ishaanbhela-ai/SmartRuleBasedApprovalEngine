import api from '../lib/axios';
import type { Request, CreateRequestInput, ApprovalAction, ApproverRequest } from '../models/Request';
import type { PaginatedResponse } from '../models/common';

export const requestsService = {
    // For Users: Get my own requests
    getMyRequests: async (page = 1): Promise<PaginatedResponse<Request>> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => setTimeout(() => resolve({
                data: [],
                meta: { total_count: 0, page: 1, per_page: 20, total_pages: 0 }
            }), 500));
        }
        const response = await api.get<PaginatedResponse<Request>>('/requests', { params: { page } });
        return response.data;
    },

    // For Approvers: Get requests pending my approval
    getPendingRequests: async (page = 1): Promise<PaginatedResponse<ApproverRequest>> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => setTimeout(() => resolve({
                data: [],
                meta: { total_count: 0, page: 1, per_page: 20, total_pages: 0 }
            }), 500));
        }
        const response = await api.get<PaginatedResponse<ApproverRequest>>('/approver/requests', { params: { page } });
        return response.data;
    },

    // For Admin: Get all requests (reusing /requests endpoint if admin has access)
    getAllRequests: async (page = 1): Promise<PaginatedResponse<Request>> => {
        const response = await api.get<PaginatedResponse<Request>>('/requests', { params: { page } });
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
