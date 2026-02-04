import api from '../lib/axios';
import { type CreateUser, CreateUserSchema } from '../models/CreateUser';
import type { User } from '../models/User';

// Mock data for development
const mockUsers: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', grade: 3 },
    { id: '2', name: 'Manager User', email: 'manager@example.com', role: 'approver', grade: 2 },
    { id: '3', name: 'Employee User', email: 'employee@example.com', role: 'user', grade: 1 },
];

export const userService = {
    getUsers: async (): Promise<User[]> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => setTimeout(() => resolve(mockUsers), 500));
        }
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    createUser: async (data: CreateUser): Promise<User> => {
        // Validate data before sending
        const validatedData = CreateUserSchema.parse(data);

        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => {
                const newUser: User = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: validatedData.name,
                    email: validatedData.email,
                    role: validatedData.role,
                    grade: validatedData.grade
                };
                mockUsers.push(newUser);
                setTimeout(() => resolve(newUser), 800);
            });
        }

        // Backend expects payload wrapped in { user: ... }
        const response = await api.post<User>('/users', { user: validatedData });
        return response.data;
    },

    deleteUser: async (id: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            return new Promise((resolve) => {
                const index = mockUsers.findIndex(u => u.id === id);
                if (index !== -1) mockUsers.splice(index, 1);
                setTimeout(() => resolve(), 500);
            });
        }
        await api.delete(`/users/${id}`);
    }
};
