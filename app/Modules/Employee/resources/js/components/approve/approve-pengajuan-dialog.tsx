import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    PENGAJUAN_DUMMY,
    type PengajuanPerubahan,
} from '../../pages/Data/pengajuan-dummy';

import { type PengajuanDecision } from '../../lib/pengajuan-storage';

import { DetailPerubahanDialog } from './detail-perubahan-dialog';

import { TolakPengajuanDialog } from './tolak-pengajuan-dialog';

interface ApprovePengajuanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Already-decided pengajuan ids — the page owns them so its summary follows. */
    decisions: Record<string, PengajuanDecision>;
    /** Called once per decision; the page persists it and refreshes the summary. */
    onDecide: (item: PengajuanPerubahan, decision: PengajuanDecision) => void;
}

/**
 * "Approve Pengajuan Perubahan Data" — the pending change-request queue.
 * Rows are derived from the decisions the page hands in: a decision drops the
 * row here and moves the page's "Menunggu Approval" count, and localStorage
 * keeps both in step after a refresh.
 */
export function ApprovePengajuanDialog({
    open,
    onOpenChange,
    decisions,
    onDecide,
}: ApprovePengajuanDialogProps) {

    const rows = PENGAJUAN_DUMMY.filter(
        (item) => !decisions[item.id],
    );

    const [
        detailItem,
        setDetailItem,
    ] = useState<PengajuanPerubahan | null>(
        null,
    );

    const [
        tolakItem,
        setTolakItem,
    ] = useState<PengajuanPerubahan | null>(
        null,
    );


    // ============================================================
    // APPROVE
    // ============================================================

    const handleApprove = (
        item: PengajuanPerubahan,
    ) => {

        onDecide(item, 'approved');

        setDetailItem(null);

        toast.success(
            'Berhasil Diapprove',
        );
    };


    // ============================================================
    // REJECT
    // ============================================================

    const handleReject = (
        item: PengajuanPerubahan,
    ) => {

        onDecide(item, 'rejected');

        setTolakItem(null);

        toast.success(
            'Berhasil Ditolak',
        );
    };


    // ============================================================
    // DELETE
    // ============================================================

    const handleDelete = (
        item: PengajuanPerubahan,
    ) => {

        onDecide(item, 'deleted');

        toast.success(
            'Berhasil Dihapus',
        );
    };


    // ============================================================
    // CLOSE
    // ============================================================

    const handleOpenChange = (
        next: boolean,
    ) => {

        // Never leave a nested Detail/Tolak dialog open
        // behind a closed queue.
        if (!next) {

            setDetailItem(null);

            setTolakItem(null);
        }

        onOpenChange(next);
    };


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <>

            {/* ====================================================
                APPROVE DIALOG
            ==================================================== */}

            <Dialog
                open={open}
                onOpenChange={
                    handleOpenChange
                }
            >

                <DialogContent
                    className="max-w-6xl gap-0 rounded-2xl p-0"
                >

                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <DialogHeader className="border-b border-[#E7E7E7] px-6 py-4 text-left">

                        <DialogTitle className="font-poppins pr-8 text-xl font-semibold text-[#121212]">
                            Approve Pengajuan Perubahan Data
                        </DialogTitle>

                    </DialogHeader>


                    {/* ==================================================
                        CONTENT
                    ================================================== */}

                    <div className="max-h-[70vh] overflow-y-auto p-6">

                        <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">

                            <table className="w-full text-left">

                                {/* ==================================================
                                    TABLE HEADER
                                ================================================== */}

                                <thead>

                                    <tr className="border-b border-[#E5E7EB]">

                                        <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">
                                            ID
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">
                                            Nama
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">
                                            Cabang
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">
                                            Organisasi
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">
                                            Posisi
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">
                                            Status
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#121212]">
                                            Perubahan
                                        </th>

                                        <th className="px-5 py-4" />

                                    </tr>

                                </thead>


                                {/* ==================================================
                                    TABLE BODY
                                ================================================== */}

                                <tbody className="divide-y divide-[#EEF0F2]">

                                    {rows.map(
                                        (
                                            item,
                                        ) => (

                                            <tr
                                                key={
                                                    item.id
                                                }
                                            >

                                                {/* ID */}

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">
                                                    {
                                                        item.employeeId
                                                    }
                                                </td>


                                                {/* NAMA */}

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#121212]">
                                                    {
                                                        item.name
                                                    }
                                                </td>


                                                {/* CABANG */}

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">
                                                    {
                                                        item.branch
                                                    }
                                                </td>


                                                {/* ORGANISASI */}

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">
                                                    {
                                                        item.organization
                                                    }
                                                </td>


                                                {/* POSISI */}

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-[#4B5563]">
                                                    {
                                                        item.position
                                                    }
                                                </td>


                                                {/* STATUS */}

                                                <td className="whitespace-nowrap px-5 py-4">

                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                                                            item.status ===
                                                            'Aktif'
                                                                ? 'border-[#45C33A] text-[#39B52A]'
                                                                : 'border-[#EF4938] text-[#EF4938]'
                                                        }`}
                                                    >
                                                        {
                                                            item.status
                                                        }
                                                    </span>

                                                </td>


                                                {/* PERUBAHAN */}

                                                <td className="px-5 py-4 text-sm text-[#4B5563]">

                                                    <span className="block max-w-[220px] truncate">
                                                        {
                                                            item.changes
                                                        }
                                                    </span>

                                                </td>


                                                {/* ACTION */}

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center justify-end gap-2">

                                                        {/* APPROVE */}

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    item,
                                                                )
                                                            }
                                                            className="h-9 cursor-pointer whitespace-nowrap rounded-lg border-[#1980C0] px-4 text-sm font-medium text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                                                        >
                                                            Approve
                                                        </Button>


                                                        {/* DROPDOWN */}

                                                        <DropdownMenu>

                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >

                                                                <button
                                                                    type="button"
                                                                    aria-label={`Aksi ${item.name}`}
                                                                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
                                                                >

                                                                    <MoreVertical className="h-4 w-4" />

                                                                </button>

                                                            </DropdownMenuTrigger>


                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40"
                                                            >

                                                                {/* TOLAK */}

                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setTolakItem(
                                                                            item,
                                                                        )
                                                                    }
                                                                >
                                                                    Tolak
                                                                </DropdownMenuItem>


                                                                <DropdownMenuSeparator />


                                                                {/* DETAIL */}

                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setDetailItem(
                                                                            item,
                                                                        )
                                                                    }
                                                                >
                                                                    Detail
                                                                </DropdownMenuItem>


                                                                <DropdownMenuSeparator />


                                                                {/* HAPUS */}

                                                                <DropdownMenuItem
                                                                    className="text-[#E84A39] focus:text-[#E84A39]"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            item,
                                                                        )
                                                                    }
                                                                >
                                                                    Hapus
                                                                </DropdownMenuItem>

                                                            </DropdownMenuContent>

                                                        </DropdownMenu>

                                                    </div>

                                                </td>

                                            </tr>

                                        ),
                                    )}


                                    {/* ==================================================
                                        EMPTY
                                    ================================================== */}

                                    {rows.length ===
                                        0 && (

                                        <tr>

                                            <td
                                                colSpan={
                                                    8
                                                }
                                                className="px-5 py-10 text-center text-sm text-[#9CA3AF]"
                                            >
                                                Tidak ada pengajuan.
                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </DialogContent>

            </Dialog>


            {/* ====================================================
                DETAIL PERUBAHAN
            ==================================================== */}

            <DetailPerubahanDialog
                open={
                    detailItem !==
                    null
                }
                onOpenChange={(
                    next,
                ) => {

                    if (!next) {
                        setDetailItem(
                            null,
                        );
                    }

                }}
                pengajuan={
                    detailItem
                }
            />


            {/* ====================================================
                TOLAK PENGAJUAN
            ==================================================== */}

            <TolakPengajuanDialog
                open={
                    tolakItem !==
                    null
                }
                onOpenChange={(
                    next,
                ) => {

                    if (!next) {
                        setTolakItem(
                            null,
                        );
                    }

                }}
                pengajuan={
                    tolakItem
                }
                onReject={(
                    item,
                ) =>
                    handleReject(
                        item,
                    )
                }
            />

        </>
    );
}