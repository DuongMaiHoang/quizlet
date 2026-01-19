'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * ResetProgressModal Component
 * 
 * Confirmation modal for resetting progress.
 * BR-RESET-01, BR-RESET-02, BR-RESET-03
 */
interface ResetProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ResetProgressModal({
    isOpen,
    onClose,
    onConfirm,
}: ResetProgressModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        // Focus trap: focus the modal
        const modal = document.getElementById('reset-modal');
        if (modal) {
            modal.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                id="reset-modal"
                className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Reset progress?</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted hover:bg-card-hover"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="mb-6 text-sm text-muted">
                    This will clear Know/Still learning for this set.
                </p>

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-white hover:bg-error/90 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}
