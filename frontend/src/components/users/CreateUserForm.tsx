import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { type CreateUser, type CreateUserInput, CreateUserSchema } from '../../models/CreateUser';
import { Button } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';
import type { User } from '../../models/User';
import { useCreateUser } from '../../hooks/useUsers';

interface CreateUserFormProps {
    onSuccess: (user: User) => void;
    onCancel: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<CreateUserInput, any, CreateUser>({
        resolver: zodResolver(CreateUserSchema),
        defaultValues: {
            role: 'user',
            grade: 1
        }
    });

    const { mutate: createUser, isPending: isSubmitting } = useCreateUser();

    const onSubmit = async (data: CreateUser) => {
        createUser(data, {
            onSuccess: (newUser) => {
                onSuccess(newUser);
            },
            onError: (error: unknown) => {
                console.error("Failed to create user", error);
                let errorMessage = "Failed to create user";

                if (axios.isAxiosError(error)) {
                    // Define the expected error structure from backend
                    const data = error.response?.data as { errors?: string[], message?: string } | undefined;
                    errorMessage = data?.errors?.join(', ') || data?.message || errorMessage;
                }
                setError('root', { message: errorMessage });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</label>
                <Input
                    id="name"
                    {...register('name')}
                    placeholder="John Doe"
                    error={errors.name?.message}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
                <Input
                    id="email"
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                    error={errors.email?.message}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <Input
                    id="password"
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium text-slate-700">Role</label>
                    <select
                        id="role"
                        {...register('role')}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="admin">Admin</option>
                        <option value="approver">Approver</option>
                        <option value="user">User</option>
                    </select>
                    {errors.role && <p className="text-xs text-red-500 font-medium">{errors.role.message}</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="grade" className="text-sm font-medium text-slate-700">Grade</label>
                    <select
                        id="grade"
                        {...register('grade', { valueAsNumber: true })}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                    {errors.grade && <p className="text-xs text-red-500 font-medium">{errors.grade.message}</p>}
                </div>
            </div>

            {errors.root && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                    {errors.root.message as string}
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                </Button>
            </div>
        </form>
    );
}
