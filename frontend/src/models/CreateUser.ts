import { z } from 'zod';

export const CreateUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(['admin', 'approver', 'user'], { message: "Invalid role" }),
    grade: z.union([
        z.number(),
        z.string().transform((val) => parseInt(val, 10))
    ]).pipe(z.number().min(1, "Grade must be at least 1").max(3, "Grade must be at most 3"))
});

export type CreateUser = z.output<typeof CreateUserSchema>;
export type CreateUserInput = z.input<typeof CreateUserSchema>;

export const DeleteUserSchema = z.object({
    id: z.string()
});

export type DeleteUser = z.infer<typeof DeleteUserSchema>;
