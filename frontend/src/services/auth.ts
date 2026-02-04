import api from '../lib/axios';
import type { LoginCredentials, LoginResponse } from '../models/Auth';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        // Check environment variable to switch between Mock and Real API
        if (import.meta.env.VITE_USE_MOCK_API === 'true') {
            console.log("Using Mock API for Login");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3NWYzNjUyMS0xYzUxLTQxN2MtOWExNS1iOTI4NjM0YmQ3YTUiLCJ0ZW5hbnRfaWQiOiJkMDNmMDdlMy1mZDdlLTQzZTQtYWIwOC05OWVhMTIwYWJiMGUiLCJyb2xlIjoiYXBwcm92ZXIiLCJleHAiOjE3NzAxOTEyMDd9.yn28ViT68eNcIZRsvUJpwljx8R_2aaeykIK0Vrd6WQ0",
                        user: {
                            id: "75f36521-1c51-417c-9a15-b928634bd7a5",
                            name: "Manager User",
                            email: "manager@example.com",
                            role: "approver",
                            grade: 2
                        }
                    });
                }, 1000);
            });
        }

        // Real API Call
        const response = await api.post<LoginResponse>('/login', credentials);
        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
};

