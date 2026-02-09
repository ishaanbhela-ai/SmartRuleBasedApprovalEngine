import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardHeader } from './DashboardHeader';
// Mock useAuth hook
const mockLogout = vi.fn();
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        logout: mockLogout
    })
}));

describe('DashboardHeader Component', () => {
    it('renders title and description', () => {
        render(<DashboardHeader title="My Dashboard" description="Welcome back" />);
        expect(screen.getByText('My Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('does not render action button if label is missing', () => {
        render(<DashboardHeader title="Title" />);
        // Only logout button should be present
        expect(screen.queryByText('New Request')).not.toBeInTheDocument();
    });

    it('renders action button and handles click', () => {
        const onAction = vi.fn();
        render(<DashboardHeader title="Requests" actionLabel="New Request" onAction={onAction} />);

        const actionButton = screen.getByText('New Request');
        expect(actionButton).toBeInTheDocument();

        fireEvent.click(actionButton);
        expect(onAction).toHaveBeenCalled();
    });

    it('calls logout when logout button is clicked', () => {
        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);

        render(<DashboardHeader title="Title" />);
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
        expect(mockLogout).toHaveBeenCalled();

        confirmSpy.mockRestore();
    });
});
