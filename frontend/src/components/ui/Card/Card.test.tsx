import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card Component', () => {
    it('renders card with all subcomponents', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Content goes here</p>
                </CardContent>
                <CardFooter>
                    <button>Action</button>
                </CardFooter>
            </Card>
        );

        expect(screen.getByText('Card Title')).toBeInTheDocument();
        expect(screen.getByText('Card Description')).toBeInTheDocument();
        expect(screen.getByText('Content goes here')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('applies custom classes', () => {
        render(<Card className="custom-card">Content</Card>);
        // Note: We need to find the element that has the class. 
        // Card renders a div. We can find by text and check parent or generic role?
        // Card is a generic div, so it doesn't have a specific role unless assigned.
        // We can test that the text is there and try to match the container logic or just trust rendered output structure test above covers it.
        // But let's be reasonably specific.
        // screen.getByText('Content') is the child. The card is the parent.
        // Or simpler:
        const { container } = render(<Card className="custom-card">Content</Card>);
        expect(container.firstChild).toHaveClass('custom-card');
    });
});
