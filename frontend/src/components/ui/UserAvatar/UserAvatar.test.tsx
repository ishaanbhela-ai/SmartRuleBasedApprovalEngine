import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserAvatar } from './UserAvatar';

describe('UserAvatar Component', () => {
    it('renders initials for user with name', () => {
        const user = { name: 'John Doe', email: 'john@example.com' };
        render(<UserAvatar user={user} />);
        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders partial initials if single name', () => {
        const user = { name: 'Admin' };
        render(<UserAvatar user={user} />);
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders fallback when user is undefined', () => {
        render(<UserAvatar user={undefined} />);
        expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('hides details when showDetails is false', () => {
        const user = { name: 'John Doe' };
        render(<UserAvatar user={user} showDetails={false} />);
        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('renders role if email is missing', () => {
        const user = { name: 'Approver', role: 'approver' };
        render(<UserAvatar user={user} />);
        expect(screen.getByText('approver')).toBeInTheDocument();
    });
});
