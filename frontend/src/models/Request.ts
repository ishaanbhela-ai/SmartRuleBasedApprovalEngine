import { z } from 'zod';

export type RequestStatus = 'submitted' | 'approved' | 'rejected' | 'pending_approval';

export const RequestSchema = z.object({
    id: z.string().uuid(),
    type: z.string(), // request_type name
    requested_value: z.number(),
    status: z.enum(['submitted', 'pending_approval', 'approved', 'rejected']),
    requester: z.object({
        id: z.string(),
        name: z.string(),
        email: z.email(),
        grade: z.number().optional()
    }).optional(),
    approval: z.object({
        action: z.enum(['approved', 'rejected']),
        reason: z.string().nullable().optional(),
        approver_id: z.string()
    }).nullable().optional()
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
