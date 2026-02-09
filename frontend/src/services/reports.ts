import api from '../lib/axios';
import type { ReportSummary, ReportData } from '../models/Report';

export const reportsService = {
    getSummary: async (): Promise<ReportSummary> => {
        // Switch between mock and real based on env
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return Promise.resolve({
                total_requests: 125,
                status_breakdown: { submitted: 45, approved: 60, rejected: 20 },
                request_type_breakdown: { "Expense": 50, "Travel": 30, "Software": 45 },
                decision_breakdown: { approved: 60, rejected: 20 },
                rule_hit_counts: { "Auto-Approve Low Value": 40, "Reject High Value": 10 }
            });
        }

        const response = await api.get<ReportSummary>('/admin/reports/summary');
        return response.data;
    },
    getMyReport: async (): Promise<ReportData> => {
        // Switch between mock and real based on env
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return Promise.resolve({
                role: 'user',
                total_requests: 125,
                approved: 60,
                pending: 20,
                rejected: 20,
                submitted: 45
            });
        }

        const response = await api.get<ReportData>('/reports/me');
        return response.data;
    }
}
