import { z } from 'zod';
import { UserSchema } from './User';

export const LoginCredentialsSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

export const LoginResponseSchema = z.object({
    token: z.string(),
    user: UserSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
