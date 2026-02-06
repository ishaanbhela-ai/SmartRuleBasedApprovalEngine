import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateRequestTypeForm } from './CreateRequestTypeForm';
import { requestTypesService } from '../../services/requestTypes';
import { userService } from '../../services/users';

// Mock dependencies
vi.mock('../../services/requestTypes', () => ({
    requestTypesService: {
        createRequestType: vi.fn(),
        updateRequestType: vi.fn()
    }
}));

vi.mock('../../services/users', () => ({
    userService: {
        getUsers: vi.fn()
    }
}));

describe('CreateRequestTypeForm Component', () => {
    const mockUsers = [
        { id: 'u1', name: 'Approver One', email: 'a1@example.com', role: 'approver', grade: 4 },
        { id: 'u2', name: 'User Two', email: 'u2@example.com', role: 'user', grade: 1 }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (userService.getUsers as any).mockResolvedValue({ data: mockUsers });
        (requestTypesService.createRequestType as any).mockResolvedValue({ id: 'rt1', name: 'expense' });
    });

    it('renders form and loads approvers', async () => {
        render(<CreateRequestTypeForm onSuccess={() => { }} onCancel={() => { }} />);

        expect(screen.getByText('Type Name')).toBeInTheDocument();
        // Wait for users to load
        await waitFor(() => {
            // Only approvers should be loaded into the list
            // We can check if "Approver One" is present in the select options (or its text representation)
            // But since it's a select, we might need to find the option.
            screen.getByLabelText('Approvers') as HTMLSelectElement;
            // Actually, the label says "Approvers", effectively referencing the section. The select has id="approver-select"
            const select = document.getElementById('approver-select');
            expect(select).toBeInTheDocument();
        });
    });

    it('can add and remove approvers', async () => {
        render(<CreateRequestTypeForm onSuccess={() => { }} onCancel={() => { }} />);

        // Wait for users
        await waitFor(() => {
            expect(screen.getByText(/Approver One/)).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
        });

        const select = document.getElementById('approver-select') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'u1' } });
        fireEvent.click(screen.getByText('Add'));

        // Check if added to the list (visual badge). The text is in a span, the class is on the parent div.
        const badge = screen.getByText('Approver One').closest('div');
        expect(badge).toHaveClass('text-slate-900');

        // Remove
        const removeBtn = screen.getByText('×'); // &times; renders as ×
        fireEvent.click(removeBtn);

        expect(screen.queryByText('Approver One', { selector: '.bg-slate-100 span' })).not.toBeInTheDocument();
    });

    it('submits valid form data', async () => {
        const onSuccess = vi.fn();
        render(<CreateRequestTypeForm onSuccess={onSuccess} onCancel={() => { }} />);

        // Select Name
        fireEvent.change(screen.getByLabelText('Type Name'), { target: { value: 'expense' } });

        // Add Approver
        await waitFor(() => expect(userService.getUsers).toHaveBeenCalled());
        const select = document.getElementById('approver-select') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'u1' } });
        fireEvent.click(screen.getByText('Add'));

        // Submit
        fireEvent.click(screen.getByText('Create Type'));

        await waitFor(() => {
            expect(requestTypesService.createRequestType).toHaveBeenCalledWith({
                name: 'expense',
                approver_ids: ['u1']
            });
            expect(onSuccess).toHaveBeenCalled();
        });
    });
});
