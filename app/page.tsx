'use client';

import { useEffect, useState } from 'react';
import { container } from '@/lib/di';
import { SetDTO } from '@/application/dto/SetDTO';
import { SetList } from '@/ui/components/sets/SetList';
import { EmptyState } from '@/ui/components/common/EmptyState';
import { Library, Search } from 'lucide-react';

export default function HomePage() {
    const [sets, setSets] = useState<SetDTO[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadSets = async () => {
        try {
            const result = await container.listSets.execute();
            setSets(result);
        } catch (error) {
            console.error('Failed to load sets', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSets();
    }, []);

    const filteredSets = sets.filter(set =>
        set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this set?')) {
            await container.deleteSet.execute(id);
            loadSets();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Library</h1>
                    <p className="text-muted-foreground mt-1">{sets.length} study sets</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <label htmlFor="search-sets" className="sr-only">
                            Search sets
                        </label>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            id="search-sets"
                            type="text"
                            placeholder="Search sets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 w-full min-w-[200px] rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                            aria-label="Search sets"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 animate-pulse rounded-xl bg-card/50 motion-reduce:animate-none"></div>
                    ))}
                </div>
            ) : filteredSets.length > 0 ? (
                <SetList sets={filteredSets} onDelete={handleDelete} />
            ) : (
                <EmptyState
                    icon={Library}
                    title={searchQuery ? "No sets found" : "Create your first study set"}
                    description={searchQuery ? `No results for "${searchQuery}"` : "Get started by creating a new set of flashcards."}
                    actionLabel={searchQuery ? undefined : "Create Set"} // Don't show create link if searching
                    actionHref={searchQuery ? undefined : "/sets/new"}
                />
            )}
        </div>
    );
}
