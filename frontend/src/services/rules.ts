import api from '../lib/axios';
import type { Rule, CreateRuleInput } from '../models/Rule';

export const rulesService = {
    getRules: async (): Promise<Rule[]> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        {
                            id: "rule-1",
                            request_type_id: "req-type-1",
                            request_type: "expense",
                            grade: 1,
                            definition: 1000,
                            is_active: true
                        },
                        {
                            id: "rule-2",
                            request_type_id: "req-type-1",
                            request_type: "expense",
                            grade: 2,
                            definition: 5000,
                            is_active: true
                        }
                    ]);
                }, 500);
            });
        }

        const response = await api.get<Rule[]>('/rules');
        return response.data;
    },

    createRule: async (data: CreateRuleInput): Promise<Rule> => {
        const response = await api.post<Rule>('/rules', data);
        return response.data;
    }
};
