import { z } from 'zod';

// Backend strict restriction
export const REQUEST_TYPE_NAMES = ['expense', 'leave'] as const;

export const RequestTypeSchema = z.object({
    id: z.uuid(),
    name: z.enum(REQUEST_TYPE_NAMES),
    approvers: z.array(z.object({
        id: z.string(),
        name: z.string(),
        email: z.email(),
    })).default([]),
});

export const CreateRequestTypeSchema = z.object({
    name: z.enum(REQUEST_TYPE_NAMES, { message: "Name must be one of: expense, leave, discount" }),
    approver_ids: z.array(z.string()).min(1, "At least one approver is required"),
});

export type RequestTypeName = z.infer<typeof RequestTypeSchema>['name'];
export type RequestType = z.infer<typeof RequestTypeSchema>;
export type CreateRequestTypeInput = z.infer<typeof CreateRequestTypeSchema>;
