import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateRuleForm } from './CreateRuleForm';
import { requestTypesService } from '../../services/requestTypes';
import { rulesService } from '../../services/rules';

vi.mock('../../services/requestTypes', () => ({
    requestTypesService: {
        getRequestTypes: vi.fn()
    }
}));

vi.mock('../../services/rules', () => ({
    rulesService: {
        createRule: vi.fn(),
        getRules: vi.fn()
    }
}));

describe('CreateRuleForm Component', () => {
    const mockRequestTypes = [
        { id: 'rt1', name: 'Hardware', custom_message: '' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (requestTypesService.getRequestTypes as any).mockResolvedValue({ data: mockRequestTypes });
        (rulesService.createRule as any).mockResolvedValue({ id: 'rule1' });
    });

    it('renders and fetches request types', async () => {
        render(<CreateRuleForm onSuccess={() => { }} onCancel={() => { }} />);
        // Might show loading initially
        // expect(screen.getByText('Loading request types...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Hardware')).toBeInTheDocument();
        });
    });

    it('submits valid rule data', async () => {
        const onSuccess = vi.fn();

        render(<CreateRuleForm onSuccess={onSuccess} onCancel={() => { }} />);

        await waitFor(() => screen.findByText('Hardware'));

        fireEvent.change(screen.getByLabelText('Request Type'), { target: { value: 'rt1' } });
        fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '3' } });
        fireEvent.change(screen.getByLabelText('Limit Amount'), { target: { value: '5000' } });

        fireEvent.click(screen.getByText('Create Rule'));

        await waitFor(() => {
            expect(rulesService.createRule).toHaveBeenCalledWith(expect.objectContaining({
                request_type_id: 'rt1',
                grade: 3,
                definition: 5000
            }));
            expect(onSuccess).toHaveBeenCalled();
        });
    });
});
