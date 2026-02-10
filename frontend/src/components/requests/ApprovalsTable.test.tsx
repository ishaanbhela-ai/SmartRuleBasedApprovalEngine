// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ApprovalsTable } from './ApprovalsTable';
import type { ApproverRequest } from '../../models/Request';

describe('ApprovalsTable Component', () => {
    const mockRequests: ApproverRequest[] = [
        {
            id: '1',
            requested_value: 1000,
            status: 'pending_approval',
            requester: { id: 'u1', name: 'John Doe', grade: 3 },
            request_type: { id: 'rt1', name: 'Hardware' },
            quota: { limit: 5000, used: 2000, remaining: 3000 },
            created_at: '2023-01-01T00:00:00.000Z'
        }
    ];

    it('does not render when requests list is empty', () => {
        const { container } = render(<ApprovalsTable requests={[]} onReview={() => { }} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders request details correctly', () => {
        render(<ApprovalsTable requests={mockRequests} onReview={() => { }} />);

        expect(screen.getByText('Hardware')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Grade 3')).toBeInTheDocument();
        expect(screen.getByText('1,000')).toBeInTheDocument();
        expect(screen.getByText(/Used: 2,000 \/ 5,000/)).toBeInTheDocument();
    });

    it('calls onReview when review button is clicked', () => {
        const handleReview = vi.fn();
        render(<ApprovalsTable requests={mockRequests} onReview={handleReview} />);

        const reviewButton = screen.getByText('Review Request');
        fireEvent.click(reviewButton);
        expect(handleReview).toHaveBeenCalledWith(mockRequests[0]);
    });

    it('handles requests with unavailable quota info', () => {
        const noQuotaRequest = [{ ...mockRequests[0], id: '2', quota: undefined }];
        render(<ApprovalsTable requests={noQuotaRequest} onReview={() => { }} />);
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });
});
