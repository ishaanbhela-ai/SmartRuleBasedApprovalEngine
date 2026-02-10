import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/reports';

export const useReportSummary = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['reports', 'summary'],
        queryFn: () => reportsService.getSummary(),
        ...options
    });
};

export const useMyReport = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['reports', 'my'],
        queryFn: () => reportsService.getMyReport(),
        ...options
    });
};
