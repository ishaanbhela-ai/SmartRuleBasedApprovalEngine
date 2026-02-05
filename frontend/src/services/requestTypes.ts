import api from '../lib/axios';
import type { RequestType, CreateRequestTypeInput } from '../models/RequestType';

export const requestTypesService = {
    getRequestTypes: async (): Promise<RequestType[]> => {
        // Mock data fallback if env is set, or real API
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        {
                            id: "1",
                            name: "expense",
                            approvers: [{ id: "user-uuid-1", name: "John Approver", email: "john@example.com" }]
                        }
                    ]);
                }, 500);
            });
        }

        try {
            const response = await api.get<RequestType[]>('/request_types');
            return response.data;
        } catch (error: any) {
            // Fallback for 403 Forbidden (Non-admin users can't list types yet)
            if (error.response && error.response.status === 403) {
                console.warn("Fetching request types forbidden, using fallback data.");
                return [
                    {
                        id: "fallback-expense",
                        name: "expense",
                        approvers: [{ id: "mock-admin-id", name: "Admin", email: "admin@example.com" }]
                    },
                    {
                        id: "fallback-leave",
                        name: "leave",
                        approvers: [{ id: "mock-admin-id", name: "Admin", email: "admin@example.com" }]
                    }
                ];
            }
            throw error;
        }
    },

    createRequestType: async (data: CreateRequestTypeInput): Promise<RequestType> => {
        const response = await api.post<RequestType>('/request_types', data);
        return response.data;
    },

    updateRequestType: async (id: string, data: Partial<CreateRequestTypeInput>): Promise<RequestType> => {
        const response = await api.patch<RequestType>(`/request_types/${id}`, data);
        return response.data;
    },

    deleteRequestType: async (id: string): Promise<void> => {
        await api.delete(`/request_types/${id}`);
    }
};
