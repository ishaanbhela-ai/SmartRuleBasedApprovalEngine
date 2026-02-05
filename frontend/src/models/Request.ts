import { z } from 'zod';

export type RequestStatus = 'submitted' | 'approved' | 'rejected' | 'pending_approval' | 'auto_approved';

export const RequestSchema = z.object({
    id: z.string().uuid(),
    type: z.string(), // Keeping for backward compat, but preferring request_type.name
    requested_value: z.number(),
    status: z.enum(['submitted', 'pending_approval', 'approved', 'rejected', 'auto_approved']),
    request_type: z.object({
        id: z.string(),
        name: z.string()
    }).optional(),
    requester: z.object({
        id: z.string(),
        name: z.string(),
        email: z.email(),
        grade: z.number().optional()
    }).optional(),
    approval: z.object({
        action: z.enum(['approved', 'rejected']).nullable().optional(), // action can be string or null
        reason: z.string().nullable().optional(),
        approver_id: z.string().nullable().optional()
    }).nullable().optional(),
    created_at: z.string().optional()
});

export type Request = z.infer<typeof RequestSchema>;

export const CreateRequestSchema = z.object({
    request_type_id: z.string().uuid("Invalid Request Type"),
    requested_value: z.number("Amount must be a number").positive("Amount must be positive")
});

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;
export type CreateRequestFormValues = z.input<typeof CreateRequestSchema>;

export interface ApprovalAction {
    action_type: 'approved' | 'rejected';
    reason?: string;
}

export interface ApproverRequest {
    id: string;
    status: RequestStatus;
    requested_value: number;
    request_type: {
        id: string;
        name: string;
    };
    requester: {
        id: string;
        name: string;
        grade: number;
    };
    quota: {
        limit: number;
        used: number;
        remaining: number;
    };
    created_at: string;
}
