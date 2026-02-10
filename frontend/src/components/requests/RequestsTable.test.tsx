import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RequestsTable } from './RequestsTable';
import type { Request } from '../../models/Request';

describe('RequestsTable Component', () => {
    const mockRequests: Request[] = [
        {
            id: '1',
            type: 'Travel Request',
            requested_value: 500,
            status: 'approved',
            created_at: '2023-01-01T10:00:00Z',
            requester: { id: 'u1', name: 'Jane Smith', email: 'jane@example.com', grade: 4 },
            request_type: { id: 'rt1', name: 'Travel' }
        },
        {
            id: '2',
            type: 'Software License',
            requested_value: 200,
            status: 'rejected',
            created_at: '2023-01-02T10:00:00Z',
            approval: { reason: 'Budget exceeded' },
            requester: { id: 'u1', name: 'Jane Smith', email: 'jane@example.com', grade: 4 }
        }
    ];

    it('renders empty state message when no requests', () => {
        render(<RequestsTable requests={[]} />);
        expect(screen.getByText('No requests found.')).toBeInTheDocument();
    });

    it('renders request details correctly', () => {
        render(<RequestsTable requests={mockRequests} />);

        expect(screen.getByText('Travel')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
        // Since we didn't pass showRequester=true, requester column should not be visible?
        // Let's check logic: showRequester default is false.
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();

        // Check formatted date presence (implementation depends on locale but '2023' or '1/1' likely)
        // Adjust expectation to be safer or check specific locale string if needed.
        // screen.getByText(new Date('2023-01-01T10:00:00Z').toLocaleDateString())
    });

    it('shows requester details when showRequester is true', () => {
        render(<RequestsTable requests={[mockRequests[0]]} showRequester={true} />);
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('Grade 4')).toBeInTheDocument();
    });

    it('displays rejection reason', () => {
        render(<RequestsTable requests={[mockRequests[1]]} />);
        expect(screen.getByText('"Budget exceeded"')).toBeInTheDocument();
    });

    it('renders fallback for missing date', () => {
        const requestNoDate = { ...mockRequests[0], id: '3', created_at: undefined };
        render(<RequestsTable requests={[requestNoDate]} />);
        expect(screen.getByText('-')).toBeInTheDocument();
    });
});
