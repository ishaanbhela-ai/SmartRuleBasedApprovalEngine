export interface ReportSummary {
    total_requests: number;
    status_breakdown: Record<string, number>;
    request_type_breakdown: Record<string, number>;
    decision_breakdown: Record<string, number>;
    rule_hit_counts: Record<string, number>;
}
