import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateRuleForm } from './CreateRuleForm';
import { requestTypesService } from '../../services/requestTypes';

vi.mock('../../services/requestTypes', () => ({
    requestTypesService: {
        getRequestTypes: vi.fn()
    }
}));

describe('CreateRuleForm Component', () => {
    const mockRequestTypes = [
        { id: 'rt1', name: 'Hardware', custom_message: '' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (requestTypesService.getRequestTypes as any).mockResolvedValue({ data: mockRequestTypes });
    });

    it('renders and fetches request types', async () => {
        render(<CreateRuleForm onSuccess={() => { }} onCancel={() => { }} />);
        expect(screen.getByText('Loading request types...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Hardware')).toBeInTheDocument();
        });
    });

    it('submits valid rule data', async () => {
        const onSuccess = vi.fn();
        render(<CreateRuleForm onSuccess={onSuccess} onCancel={() => { }} />);

        await waitFor(() => screen.getByText('Hardware'));

        fireEvent.change(screen.getByLabelText('Request Type'), { target: { value: 'rt1' } });
        fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '3' } });
        fireEvent.change(screen.getByLabelText('Limit Amount'), { target: { value: '5000' } });

        fireEvent.click(screen.getByText('Create Rule'));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith({
                request_type_id: 'rt1',
                grade: 3, // Value is converted to number
                definition: 5000
            });
        });
    });
});
