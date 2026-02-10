import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal Component', () => {
    it('does not render when closed', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal isOpen={false} onClose={onClose} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders correctly when open', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        const closeButton = screen.getByRole('button'); // The X button is the only button in a basic modal
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
    });
});
