import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { MemoryRouter } from 'react-router-dom';

// Mock useAuth
const mockUser = {
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'admin'
};

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser
    })
}));

describe('Sidebar Component', () => {
    it('renders sidebar with logo and branding', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );
        expect(screen.getByText('SmartRule')).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Requests')).toBeInTheDocument();
        expect(screen.getByText('Rules')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('displays user profile info', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('Te')).toBeInTheDocument(); // Name slice(0,2)
    });
});
