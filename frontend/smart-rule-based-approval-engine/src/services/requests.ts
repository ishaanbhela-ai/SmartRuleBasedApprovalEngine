import api from '../lib/axios';
import { RequestItem } from '../models/Request';

export const requestsService = {
    getRequests: async (): Promise<RequestItem[]> => {
        // Switch between mock and real based on env
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        { id: "101", type: "Expense", requested_value: "1500", status: "submitted", approval: null },
                        { id: "102", type: "Leave", requested_value: "5 Days", status: "approved", approval: { action: "approved", reason: "Policy Met", approver_id: 1 } },
                        { id: "103", type: "Software", requested_value: "Jira License", status: "rejected", approval: { action: "rejected", reason: "Budget Exceeded", approver_id: 2 } },
                    ]);
                }, 800);
            });
        }

        const response = await api.get<RequestItem[]>('/requests');
        return response.data;
    }
};
