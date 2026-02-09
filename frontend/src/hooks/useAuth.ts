import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth';
import type { LoginCredentials } from '../models/Auth';

export const useLogin = () => {
    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    });
};
