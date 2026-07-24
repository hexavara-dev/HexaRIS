import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function ToastPreview() {
    return (
        <div className="inline-flex items-center gap-2">
            <Button variant="outline" onClick={() => toast.success('Placeholder')}>
                Trigger Berhasil
            </Button>
            <Button variant="outline" onClick={() => toast.error('Placeholder')}>
                Trigger Gagal
            </Button>
        </div>
    );
}
