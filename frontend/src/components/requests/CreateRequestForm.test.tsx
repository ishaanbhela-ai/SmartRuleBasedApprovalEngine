import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateRequestForm } from './CreateRequestForm';
import { requestTypesService } from '../../services/requestTypes';
import { requestsService } from '../../services/requests';

// Mock dependencies
vi.mock('../../services/requestTypes', () => ({
    requestTypesService: {
        getRequestTypes: vi.fn()
    }
}));

vi.mock('../../services/requests', () => ({
    requestsService: {
        getBalance: vi.fn(),
        createRequest: vi.fn()
    }
}));

describe('CreateRequestForm Component', () => {
    const mockRequestTypes = [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Hardware', custom_message: '' },
        { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Software', custom_message: '' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock responses
        (requestTypesService.getRequestTypes as any).mockResolvedValue({ data: mockRequestTypes });
        (requestsService.getBalance as any).mockResolvedValue({ limit: 1000, used: 200, remaining: 800 });
        (requestsService.createRequest as any).mockResolvedValue({});
    });

    it('renders form and loads request types', async () => {
        render(<CreateRequestForm onSuccess={() => { }} onCancel={() => { }} />);

        expect(screen.getByText('Request Type')).toBeInTheDocument();
        expect(screen.getByText('Requested Value')).toBeInTheDocument();

        // Wait for types to load
        await waitFor(() => {
            expect(screen.getByText('Hardware')).toBeInTheDocument();
        });
        expect(screen.getByText('Software')).toBeInTheDocument();
    });

    it('fetches balance when request type is selected', async () => {
        render(<CreateRequestForm onSuccess={() => { }} onCancel={() => { }} />);

        // Wait for types to load
        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
            expect(screen.getByText('Hardware')).toBeInTheDocument();
        });

        // Select a type
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });

        // Wait for balance UI update first
        await waitFor(() => {
            expect(screen.getByText('Quota Limit:')).toBeInTheDocument();
        });

        expect(requestsService.getBalance).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');

        expect(screen.getByText('1,000')).toBeInTheDocument();
        expect(screen.getByText('800')).toBeInTheDocument(); // remaining
    });

    it('submits form with valid data', async () => {
        const onSuccess = vi.fn();
        render(<CreateRequestForm onSuccess={onSuccess} onCancel={() => { }} />);

        // Wait for types
        await waitFor(() => screen.findByText('Hardware'));

        // Fill form
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });
        fireEvent.change(screen.getByLabelText('Requested Value'), { target: { value: '100' } });

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }));

        await waitFor(() => {
            expect(requestsService.createRequest).toHaveBeenCalledWith({
                request_type_id: '123e4567-e89b-12d3-a456-426614174000',
                requested_value: 100
            });
            expect(onSuccess).toHaveBeenCalled();
        });
    });

    it('displays validation errors', async () => {
        render(<CreateRequestForm onSuccess={() => { }} onCancel={() => { }} />);

        // Submit empty
        fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid Request Type')).toBeInTheDocument();
            expect(screen.getByText('Amount must be a number')).toBeInTheDocument();
        });
    });

    it('handles API errors during submission', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (requestsService.createRequest as any).mockRejectedValue({ response: { data: { error: 'Insufficient funds' } } });

        render(<CreateRequestForm onSuccess={() => { }} onCancel={() => { }} />);

        await waitFor(() => screen.findByText('Hardware'));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '123e4567-e89b-12d3-a456-426614174000' } });
        // Since Input component might not associate label perfectly with ID if not provided,
        // we'll try to find by specific label or placeholder if needed.
        // But first let's see Input.tsx interaction.
        // If Input creates a random ID if none provided, getByLabelText works.
        // If not, we might need to pass id in form.
        fireEvent.change(screen.getByLabelText(/Requested Value/i), { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }));

        await waitFor(() => {
            expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});
