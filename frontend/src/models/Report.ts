import { z } from 'zod';

export const ReportSummarySchema = z.object({
    total_requests: z.number(),
    status_breakdown: z.record(z.string(), z.number()),
    request_type_breakdown: z.record(z.string(), z.number()),
    decision_breakdown: z.record(z.string(), z.number()),
    total_rules: z.number(),
});

export type ReportSummary = z.infer<typeof ReportSummarySchema>;

export const UserReportSchema = z.object({
    role: z.literal("user"),
    total_requests: z.number(),
    approved: z.number(),
    pending: z.number(),
    rejected: z.number(),
    submitted: z.number()
});

export type UserReport = z.infer<typeof UserReportSchema>;

export const ApproverReportSchema = z.object({
    role: z.literal("approver"),
    total_reviewed: z.number(),
    approved_by_me: z.number(),
    rejected_by_me: z.number(),
    pending_inbox: z.number(),
    my_requests: z.object({
        total: z.number(),
        pending: z.number()
    })
});

export type ApproverReport = z.infer<typeof ApproverReportSchema>;

export type ReportData = ReportSummary | UserReport | ApproverReport;
