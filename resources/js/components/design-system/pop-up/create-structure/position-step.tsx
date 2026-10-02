import { useState } from 'react';
import { StructureFlowPreview } from './structure-flow-preview';
import { type DraftDepartment } from './types';

export function PositionStep({ departments }: { departments: DraftDepartment[] }) {
    const [selectedId, setSelectedId] = useState('company');

    return (
        <div className="flex h-full min-h-[520px] w-full">
            <StructureFlowPreview
                mode="dynamic"
                departments={departments}
                selectedId={selectedId}
                onSelect={setSelectedId}
                expanded
                onToggleExpanded={() => undefined}
                hideExpandToggle
            />
        </div>
    );
}
