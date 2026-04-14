import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { useSocket } from "../../context/SocketContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { BookCheck, Clock, AlertCircle, BookOpen, CheckCircle, Loader2, CalendarPlus, User, X } from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

const UserReturn = () => {
  const { user } = useAuth();
  const { getActiveTransactionsByUser, getBookById, requestPengembalian, requestPerpanjangan, fetchUserTransactions } = useLibrary();
  const { adminOnDuty } = useSocket();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [actionType, setActionType] = useState(null); // 'return' or 'extend'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeLoans = getActiveTransactionsByUser(user?.id);

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateFine = (dueDate) => {
    const daysOverdue = Math.abs(getDaysUntilDue(dueDate));
    return isOverdue(dueDate) ? daysOverdue * 1000 : 0;
  };

  const handleActionClick = (loan, type) => {
    if (!adminOnDuty) {
      toast({
        variant: "destructive",
        title: "Admin Offline",
        description: "Tidak dapat memproses request karena tidak ada petugas yang sedang berjaga.",
      });
      return;
    }
    setSelectedLoan(loan);
    setActionType(type);
    setIsDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedLoan) return;

    setIsSubmitting(true);
    let result;
    
    if (actionType === "return") {
      result = await requestPengembalian(selectedLoan.id);
    } else if (actionType === "extend") {
      result = await requestPerpanjangan(selectedLoan.id);
    }
    
    if (result?.success) {
      toast({
        title: "Request Terkirim!",
        description: actionType === "return" ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span>Request pengembalian terkirim. Menunggu konfirmasi admin.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span>Request perpanjangan terkirim. Menunggu konfirmasi admin.</span>
          </div>
        ),
      });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: result.message,
      });
    }
    setIsSubmitting(false);
    setIsDialogOpen(false);
    setSelectedLoan(null);
    setActionType(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengembalian & Perpanjangan</h1>
        <p className="text-muted-foreground">
          Daftar buku yang sedang Anda pinjam. Kembalikan atau minta perpanjangan sebelum jatuh tempo.
        </p>
      </div>

      {!adminOnDuty && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive">
          <AlertTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Tidak Ada Admin Berjaga
          </AlertTitle>
          <AlertDescription>
            Saat ini tidak ada petugas perpustakaan yang berjaga. Anda hanya dapat melihat status buku pinjaman Anda, 
            namun request pengembalian atau perpanjangan sedang ditangguhkan.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Total Peminjaman Aktif</p>
                <p className="text-sm text-muted-foreground">
                  Kembalikan sebelum jatuh tempo untuk menghindari denda
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {activeLoans.length} buku
            </Badge>
          </div>
        </CardContent>
      </Card>

      {activeLoans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookCheck className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">Tidak ada peminjaman aktif</h3>
            <p className="text-muted-foreground">
              Anda tidak memiliki buku yang perlu dikembalikan
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeLoans.map((loan) => {
            const book = getBookById(loan.buku_id);
            const dueDate = loan.tanggal_jatuh_tempo;
            const daysUntilDue = dueDate ? getDaysUntilDue(dueDate) : null;
            const overdue = dueDate ? isOverdue(dueDate) : false;
            const fine = dueDate ? calculateFine(dueDate) : 0;

            return (
              <Card
                key={loan.id}
                className={`hover:shadow-md transition-shadow ${
                  overdue ? "border-destructive" : daysUntilDue !== null && daysUntilDue <= 2 ? "border-warning" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {book?.judul || loan.buku?.judul || "Buku"}
                    </CardTitle>
                    {overdue ? (
                      <Badge variant="destructive">Terlambat</Badge>
                    ) : daysUntilDue !== null && daysUntilDue <= 2 ? (
                      <Badge className="bg-warning text-warning-foreground">
                        Segera
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Aktif</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{book?.pengarang || loan.buku?.pengarang}</p>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tanggal Pinjam</span>
                      <span>{formatDate(loan.tanggal_pinjam)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Batas Kembali</span>
                      <span className={overdue ? "text-destructive font-medium" : ""}>
                        {formatDate(dueDate)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className={`flex items-center gap-2 rounded-md p-2 ${
                      overdue
                        ? "bg-destructive/10 text-destructive"
                        : daysUntilDue !== null && daysUntilDue <= 2
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {overdue ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Terlambat {Math.abs(daysUntilDue)} hari (Denda: Rp{" "}
                          {fine.toLocaleString()})
                        </span>
                      </>
                    ) : daysUntilDue !== null && daysUntilDue <= 2 ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {daysUntilDue === 0
                            ? "Jatuh tempo hari ini"
                            : `${daysUntilDue} hari lagi`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{daysUntilDue} hari tersisa</span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant={!adminOnDuty ? "outline" : "default"}
                      onClick={() => handleActionClick(loan, "return")}
                      disabled={!adminOnDuty}
                    >
                      <BookCheck className="mr-2 h-4 w-4" />
                      Kembalikan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleActionClick(loan, "extend")}
                      disabled={!adminOnDuty || loan.status === "extension_pending"}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Perpanjang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "return" ? "Konfirmasi Pengembalian" : "Konfirmasi Perpanjangan"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "return" 
                ? "Apakah Anda yakin ingin mengirim request pengembalian buku ini?" 
                : "Apakah Anda yakin ingin meminta perpanjangan masa pinjam buku ini?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedLoan && (
            <div className="rounded-md bg-muted p-4 my-2">
              <p className="font-medium">{getBookById(selectedLoan.buku_id)?.judul || selectedLoan.buku?.judul}</p>
              <p className="text-sm text-muted-foreground">
                {getBookById(selectedLoan.buku_id)?.pengarang || selectedLoan.buku?.pengarang}
              </p>
              {selectedLoan.tanggal_jatuh_tempo && isOverdue(selectedLoan.tanggal_jatuh_tempo) && actionType === "return" && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-destructive font-medium">
                    ⚠️ Buku terlambat {Math.abs(getDaysUntilDue(selectedLoan.tanggal_jatuh_tempo))}{" "}
                    hari
                  </p>
                  <p className="text-destructive">
                    Potensi denda (estimasi): Rp {calculateFine(selectedLoan.tanggal_jatuh_tempo).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "return" ? "Ya, Kirim Request Pengembalian" : "Ya, Minta Perpanjangan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserReturn;
