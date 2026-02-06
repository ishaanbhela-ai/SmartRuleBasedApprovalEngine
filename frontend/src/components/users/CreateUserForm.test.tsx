import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateUserForm } from './CreateUserForm';
import { userService } from '../../services/users';

vi.mock('../../services/users', () => ({
    userService: {
        createUser: vi.fn()
    }
}));

describe('CreateUserForm Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form fields', () => {
        render(<CreateUserForm onSuccess={() => { }} onCancel={() => { }} />);
        expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Role')).toBeInTheDocument();
        expect(screen.getByLabelText('Grade')).toBeInTheDocument();
    });

    it('submits valid user data', async () => {
        const onSuccess = vi.fn();
        (userService.createUser as any).mockResolvedValue({ id: 'u1', name: 'John Doe' });

        render(<CreateUserForm onSuccess={onSuccess} onCancel={() => { }} />);

        fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'user' } });
        fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '2' } });

        fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

        await waitFor(() => {
            expect(userService.createUser).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'user',
                grade: 2
            });
            expect(onSuccess).toHaveBeenCalled();
        });
    });

    it('displays error on submission failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (userService.createUser as any).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Email already exists' } }
        });

        render(<CreateUserForm onSuccess={() => { }} onCancel={() => { }} />);

        fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

        await waitFor(() => {
            expect(screen.getByText('Email already exists')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});
