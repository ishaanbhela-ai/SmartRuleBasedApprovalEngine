import { z } from 'zod';

// Backend strict restriction
export const REQUEST_TYPE_NAMES = ['expense', 'leave', 'discount'] as const;

export const RequestTypeSchema = z.object({
    id: z.uuid(),
    name: z.enum(REQUEST_TYPE_NAMES),
    approver_id: z.uuid().optional(),
    approver: z.object({ // Nested approver object returned by API
        id: z.uuid(),
        name: z.string(),
        email: z.email(),
    }).optional(),
});

export const CreateRequestTypeSchema = z.object({
    name: z.enum(REQUEST_TYPE_NAMES, { message: "Name must be one of: expense, leave, discount" }),
    approver_id: z.string().min(1, "Approver is required"),
});

export type RequestTypeName = z.infer<typeof RequestTypeSchema>['name'];
export type RequestType = z.infer<typeof RequestTypeSchema>;
export type CreateRequestTypeInput = z.infer<typeof CreateRequestTypeSchema>;
