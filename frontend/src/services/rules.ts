import api from '../lib/axios';
import type { Rule, CreateRuleInput } from '../models/Rule';
import type { PaginatedResponse } from '../models/common';

export const rulesService = {
    getRules: async (page = 1): Promise<PaginatedResponse<Rule>> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return Promise.resolve({
                data: [
                    {
                        id: "rule-1",
                        request_type: { id: "req-type-1", name: "expense" },
                        grade: 1,
                        definition: 1000,
                        is_active: true
                    },
                    {
                        id: "rule-2",
                        request_type: { id: "req-type-1", name: "expense" },
                        grade: 2,
                        definition: 5000,
                        is_active: true
                    }
                ],
                meta: {
                    total_count: 2,
                    page: 1,
                    per_page: 20,
                    total_pages: 1
                }
            });
        }

        const response = await api.get<PaginatedResponse<Rule>>('/rules', { params: { page } });
        return response.data;
    },

    createRule: async (data: CreateRuleInput): Promise<Rule> => {
        const response = await api.post<Rule>('/rules', data);
        return response.data;
    },

    deleteRule: async (id: string): Promise<void> => {
        await api.delete(`/rules/${id}`);
    }
};
