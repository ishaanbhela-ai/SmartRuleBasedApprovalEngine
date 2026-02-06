import { z } from 'zod';

export const RuleSchema = z.object({
    id: z.uuid(),
    request_type: z.object({
        id: z.string(),
        name: z.string()
    }),
    grade: z.number().min(1).max(3),
    definition: z.number().positive("Limit must be positive"),
    is_active: z.boolean(),
});

export const CreateRuleSchema = z.object({
    request_type_id: z.string().min(1, "Request Type is required"),
    grade: z.union([
        z.number(),
        z.string().transform((val) => parseInt(val, 10))
    ]).pipe(z.number().min(1, "Grade must be 1, 2, or 3").max(3, "Grade must be 1, 2, or 3")),
    definition: z.number().positive("Limit must be positive"),
});

export type Rule = z.infer<typeof RuleSchema>;
export type CreateRuleInput = z.infer<typeof CreateRuleSchema>;
export type CreateRuleFormValues = z.input<typeof CreateRuleSchema>;
