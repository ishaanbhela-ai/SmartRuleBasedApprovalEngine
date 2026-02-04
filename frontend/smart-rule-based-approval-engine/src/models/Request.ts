export interface RequestItem {
    id: string; // The serializer returns id, usually string/number, safe to use string/number
    type: string;
    requested_value: string;
    status: string; // 'submitted' | 'approved' | 'rejected'
    approval: {
        action: string;
        reason: string;
        approver_id: number;
    } | null;
}
