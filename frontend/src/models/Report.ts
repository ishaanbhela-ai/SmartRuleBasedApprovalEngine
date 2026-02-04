import { z } from 'zod';

export const ReportSummarySchema = z.object({
    total_requests: z.number(),
    status_breakdown: z.record(z.string(), z.number()),
    request_type_breakdown: z.record(z.string(), z.number()),
    decision_breakdown: z.record(z.string(), z.number()),
    rule_hit_counts: z.record(z.string(), z.number()),
});

export type ReportSummary = z.infer<typeof ReportSummarySchema>;
