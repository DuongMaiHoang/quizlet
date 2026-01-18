/**
 * LoadingState Component
 * 
 * Displays a loading spinner
 */
export function LoadingState() {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
                <p className="text-sm text-muted">Loading...</p>
            </div>
        </div>
    );
}
