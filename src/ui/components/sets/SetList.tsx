'use client';

import { SetDTO } from '@/application/dto/SetDTO';
import { SetCard } from './SetCard';
import { EmptyState } from '../common/EmptyState';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface SetListProps {
    sets: SetDTO[];
    onDelete?: (id: string) => void;
}

/**
 * SetList Component
 * 
 * Displays a grid of study sets
 */
export function SetList({ sets, onDelete }: SetListProps) {
    if (sets.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => (
                <SetCard key={set.id} set={set} onDelete={onDelete} />
            ))}
        </div>
    );
}
