import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLibrary } from "../context/LibraryContext";
import { useSocket } from "../context/SocketContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertCircle, CheckCircle, X } from "lucide-react";

const UserPendingModal = () => {
  const { user } = useAuth();
  const { transactions, fetchUserTransactions } = useLibrary();
  const { on } = useSocket();
  const [progressState, setProgressState] = useState(null);

  if (!user || user.role !== "user") return null;

  // Find the first pending transaction
  const pendingTx = transactions.find(t => 
    ["pending", "return_pending", "extension_pending"].includes(t.status)
  );

  useEffect(() => {
    if (pendingTx && !progressState) {
       let title = "Proses Transaksi";
       let desc = "Menunggu Proses Admin";
       
       if (pendingTx.status === "pending") {
           title = "Proses Peminjaman Buku";
           desc = "Menunggu Persetujuan Admin";
       } else if (pendingTx.status === "return_pending") {
           title = "Proses Pengembalian Buku";
           desc = "Menunggu Pengecekan Admin";
       } else if (pendingTx.status === "extension_pending") {
           title = "Proses Perpanjangan Buku";
           desc = "Menunggu Persetujuan Admin";
       }

       setProgressState({ type: 'loading', title, desc });
    } else if (!pendingTx && progressState?.type !== 'result') {
       setProgressState(null);
    }
  }, [pendingTx, progressState]);

  useEffect(() => {
    // Prevent errors if not mounted or not relevant
    if (!on) return;

    const unsubPreview = on("denda:preview", (data) => {
       if (data.transaksi_id === pendingTx?.id) {
           setProgressState({ type: 'preview', data });
       }
    });

    const unsubPayment = on("denda:payment_result", (data) => {
       if (!data.is_bulk && data.transaksi_id === pendingTx?.id) {
           setProgressState({ type: 'result', data });
           fetchUserTransactions();
       }
    });

    const handleApproved = (data, successMsg) => {
       if (data.transaksiId === pendingTx?.id) {
           setProgressState(prev => {
              if (prev?.type !== 'result') return { type: 'result', data: { is_lunas: true, pesan: successMsg } };
              return prev;
           });
           fetchUserTransactions();
       }
    };

    const handleRejected = (data, errorPrefix) => {
       if (data.transaksiId === pendingTx?.id) {
           setProgressState({ type: 'result', data: { is_lunas: false, is_error: true, pesan: `${errorPrefix}: ${data.reason || 'Ditolak admin'}` } });
           fetchUserTransactions();
       }
    };

    const unsubReturnApprove = on("pengembalian:approved", (data) => handleApproved(data, "Pengembalian Selesai!"));
    const unsubReturnReject = on("pengembalian:rejected", (data) => handleRejected(data, "Pengembalian Ditolak"));

    const unsubBorrowApprove = on("peminjaman:approved", (data) => handleApproved(data, "Peminjaman Disetujui!"));
    const unsubBorrowReject = on("peminjaman:rejected", (data) => handleRejected(data, "Peminjaman Ditolak"));

    const unsubExtendApprove = on("perpanjangan:approved", (data) => handleApproved(data, "Perpanjangan Disetujui!"));
    const unsubExtendReject = on("perpanjangan:rejected", (data) => handleRejected(data, "Perpanjangan Ditolak"));

    return () => { 
      unsubPreview(); unsubPayment(); 
      unsubReturnApprove(); unsubReturnReject();
      unsubBorrowApprove(); unsubBorrowReject();
      unsubExtendApprove(); unsubExtendReject();
    };
  }, [on, pendingTx, fetchUserTransactions]);

  const handleClose = () => {
    setProgressState(null);
  };

  if (!progressState && !pendingTx) return null;

  return (
    <AlertDialog open={!!progressState}>
      <AlertDialogContent className="sm:max-w-md">
        {progressState?.type === 'loading' && (
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              {progressState.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2 pb-4">
              <div className="flex justify-center mb-4">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="font-medium text-lg text-foreground mb-1">{progressState.desc}</p>
              <p>Mohon tunggu sebentar, permintaan Anda sedang diproses oleh petugas perpustakaan.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        )}

        {progressState?.type === 'preview' && (
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-xl">
                Peringatan Denda
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center pt-2 flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-warning mb-4" />
                <p className="font-medium text-lg text-foreground w-full mb-1">{progressState.data.pesan}</p>
                <div className="bg-muted p-3 rounded-md text-left mt-4 text-sm w-full font-normal">
                   <div className="flex justify-between py-1 border-b">
                      <span>Denda Keterlambatan:</span>
                      <span className="font-semibold">Rp {(progressState.data.kalkulasi?.denda_terlambat || 0).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between py-1 border-b">
                      <span>Denda Kerusakan/Hilang:</span>
                      <span className="font-semibold text-destructive">Rp {(progressState.data.kalkulasi?.denda_kondisi || 0).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between py-1 mt-1 text-base">
                      <span className="font-bold text-foreground">Total Denda:</span>
                      <span className="font-bold text-destructive">Rp {(progressState.data.kalkulasi?.total_denda || 0).toLocaleString()}</span>
                   </div>
                </div>
                <p className="mt-4 text-sm text-foreground/70 w-full">Silakan selesaikan pembayaran denda pada petugas perpustakaan.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
        )}

        {progressState?.type === 'result' && (
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-xl">
                {progressState.data.is_error ? "Permintaan Ditolak" : progressState.data.is_lunas ? "Berhasil" : "Aksi Selesai"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center pt-2 flex flex-col items-center">
                {progressState.data.is_error ? (
                  <X className="h-12 w-12 text-destructive mb-4" />
                ) : progressState.data.is_lunas ? (
                  <CheckCircle className="h-12 w-12 text-success mb-4" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-warning mb-4" />
                )}
                <p className="font-medium text-lg text-foreground w-full mb-1">{progressState.data.pesan}</p>
                
                {progressState.data.sisa_denda > 0 && !progressState.data.is_error && (
                  <p className="mt-2 text-sm text-destructive font-bold w-full">
                    Sisa denda belum lunas: Rp {progressState.data.sisa_denda.toLocaleString()}
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
        )}
        
        {progressState?.type === 'result' && (
           <AlertDialogFooter className="sm:justify-center">
              <Button onClick={handleClose} className="mt-4">
                Tutup
              </Button>
           </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserPendingModal;
