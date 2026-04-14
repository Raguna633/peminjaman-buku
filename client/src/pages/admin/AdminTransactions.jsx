import { useState, useEffect, useCallback } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { useSocket } from "../../context/SocketContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, BookCheck, AlertCircle, Loader2, Check, X, RotateCcw, CalendarPlus, BookOpen, DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/ui/pagination";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = { day: "numeric", month: "short", year: "numeric", hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

const AdminTransactions = () => {
  const {
    transactions,
    fetchTransactions,
    getBookById,
    getMemberById,
    approvePeminjaman,
    rejectPeminjaman,
    approvePengembalian,
    rejectPengembalian,
    approvePerpanjangan,
    rejectPerpanjangan,
    returnLost,
    calculateFinePreview,
    processPayment,
    bulkProcessPayment
  } = useLibrary();
  const { toast } = useToast();
  const { on } = useSocket();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatusGlobal, setFilterStatusGlobal] = useState("all");
  const [activeTab, setActiveTab] = useState("pinjam");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [paginatedTransactions, setPaginatedTransactions] = useState([]);
  const limit = 10;
  
  // Dialog states
  const [activeDialog, setActiveDialog] = useState(null); // 'approve-pinjam', 'reject-pinjam', 'approve-kembali', 'reject-kembali', 'approve-perpanjang', 'reject-perpanjang', 'return-lost'
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [returnStep, setReturnStep] = useState(1);
  const [returnCondition, setReturnCondition] = useState("baik");
  const [excludedDates, setExcludedDates] = useState([]);
  const [excludedDateInput, setExcludedDateInput] = useState("");
  const [finePreview, setFinePreview] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkPayGroup, setBulkPayGroup] = useState(null);
  const [selectedBulkFines, setSelectedBulkFines] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (activeTab === "unpaid") return; // Special handling for unpaid

    setIsLoadingLocal(true);
    const offset = (currentPage - 1) * limit;
    
    let statusFilter;
    if (activeTab === "pinjam") statusFilter = "pending";
    else if (activeTab === "kembali") statusFilter = "return_pending";
    else if (activeTab === "perpanjang") statusFilter = "extension_pending";
    else if (activeTab === "all") {
       statusFilter = filterStatusGlobal === "all" ? undefined : filterStatusGlobal;
    }

    const res = await fetchTransactions({ 
      limit, 
      offset, 
      search: searchQuery, 
      status: statusFilter 
    });
    
    if (res.success) {
      setPaginatedTransactions(res.data || []);
      setTotalItems(res.totalItems || 0);
    }
    setIsLoadingLocal(false);
  }, [activeTab, limit, currentPage, searchQuery, filterStatusGlobal, fetchTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [activeTab, currentPage, searchQuery, filterStatusGlobal, fetchTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterStatusGlobal]);

  // Real-time refresh when new requests arrive
  useEffect(() => {
    if (!on) return;

    const refreshFeed = () => {
      // Small delay to ensure DB is updated (though socket is usually sent after DB)
      // and to avoid layout shift immediately if admin is typing
      loadTransactions();
    };

    const unsubBorrow = on("peminjaman:request", refreshFeed);
    const unsubReturn = on("pengembalian:request", refreshFeed);
    const unsubExtend = on("perpanjangan:request", refreshFeed);

    return () => {
      unsubBorrow();
      unsubReturn();
      unsubExtend();
    };
  }, [on, loadTransactions]);

  const kondisiOptions = [
    { value: "baik", label: "Baik" },
    { value: "rusak_ringan", label: "Rusak Ringan" },
    { value: "rusak_sedang", label: "Rusak Sedang" },
    { value: "rusak_parah", label: "Rusak Parah" },
    { value: "hilang", label: "Hilang" },
  ];

  const getBookTitle = (transaction) => {
    const book = getBookById(transaction.buku_id);
    return book?.judul || transaction.buku?.judul || "Buku tidak ditemukan";
  };

  const getMemberName = (transaction) => {
    const member = getMemberById(transaction.user_id);
    return member?.nama_lengkap || transaction.user?.nama_lengkap || "Anggota tidak ditemukan";
  };

  const getMemberInfo = (transaction) => {
    const member = getMemberById(transaction.user_id);
    return member?.nis || transaction.user?.nis || "-";
  };

  const unpaidTransactions = transactions.filter((t) => {
    const isUnpaid = (t.denda || 0) > (t.denda_dibayar || 0) && ["returned", "lost"].includes(t.status);
    if (!isUnpaid) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    // Search in book title, member name, or NIS
    const bookTitle = (t.buku?.judul || "").toLowerCase();
    const memberName = (t.user?.nama_lengkap || "").toLowerCase();
    const nis = (t.user?.nis || "").toLowerCase();

    return bookTitle.includes(q) || memberName.includes(q) || nis.includes(q);
  });

  const unpaidByUser = unpaidTransactions.reduce((acc, t) => {
    if (!acc[t.user_id]) acc[t.user_id] = { user: t.user, transactions: [], totalSisa: 0 };
    acc[t.user_id].transactions.push(t);
    acc[t.user_id].totalSisa += (t.denda || 0) - (t.denda_dibayar || 0);
    return acc;
  }, {});

  const openDialog = (type, transaction) => {
    setSelectedTransaction(transaction);
    setActiveDialog(type);
    setReturnCondition("baik");
    setRejectReason("");
    setReturnStep(1);
    setFinePreview(null);
    setPaymentAmount("");
    setExcludedDates([]);
    setExcludedDateInput("");
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedTransaction(null);
    setReturnStep(1);
    setFinePreview(null);
    setPaymentAmount("");
    setExcludedDates([]);
    setExcludedDateInput("");
    setBulkPayGroup(null);
    setSelectedBulkFines([]);
  };

  const openBulkPaymentDialog = (group) => {
    setBulkPayGroup(group);
    setSelectedBulkFines(group.transactions.map((t) => t.id));
    setPaymentAmount("");
    setActiveDialog('bulk-pay');
  };

  const handleToggleBulkFine = (id) => {
    setSelectedBulkFines(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBulkPay = async () => {
    if (!bulkPayGroup || selectedBulkFines.length === 0) return;
    setIsSubmitting(true);
    let amount = Number(paymentAmount) || 0;
    
    const result = await bulkProcessPayment(selectedBulkFines, amount, bulkPayGroup.user.id);
    if (result.success) {
      toast({ title: "Berhasil", description: result.data.is_lunas ? "Semua denda terpilih LUNAS!" : "Pembayaran sebagian denda disimpan." });
      loadTransactions();
      closeDialog();
    } else {
      toast({ variant: "destructive", title: "Gagal Pembayaran", description: result.message });
    }
    setIsSubmitting(false);
  };

  const handleAddExcludedDate = () => {
    if (excludedDateInput && !excludedDates.includes(excludedDateInput)) {
      setExcludedDates([...excludedDates, excludedDateInput]);
    }
    setExcludedDateInput("");
  };

  const handleRemoveExcludedDate = (date) => {
    setExcludedDates(excludedDates.filter(d => d !== date));
  };

  const handleCalculateFinePreview = async () => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);
    const result = await calculateFinePreview(selectedTransaction.id, returnCondition, excludedDates);
    if (result.success) {
      setFinePreview(result.data);
      setReturnStep(2);
    } else {
      toast({ variant: "destructive", title: "Gagal Mengkalkulasi", description: result.message });
    }
    setIsSubmitting(false);
  };

  const handleApproveAndPay = async (isBayarNanti = false) => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);
    let amount = Number(paymentAmount) || 0;
    
    const approveResult = await approvePengembalian(selectedTransaction.id, returnCondition, excludedDates);
    if (!approveResult?.success) {
      toast({ variant: "destructive", title: "Gagal Approve Pengembalian", description: approveResult?.message });
      setIsSubmitting(false);
      return;
    }

    if (finePreview && finePreview.rincian_denda?.total_denda > 0) {
      if (isBayarNanti) amount = 0;
      const payResult = await processPayment(selectedTransaction.id, amount);
      if (!payResult.success) {
        toast({ variant: "destructive", title: "Pengembalian Selesai, tapi Gagal Bayar Denda", description: payResult.message });
      } else {
        toast({ title: "Berhasil", description: payResult.data.is_lunas ? "Pengembalian selesai dan denda LUNAS!" : "Pengembalian selesai dan Denda Disimpan." });
      }
    } else {
        toast({ title: "Berhasil", description: "Pengembalian buku berhasil diproses." });
    }

    loadTransactions();
    closeDialog();
    setIsSubmitting(false);
  };

  const handleConfirmAction = async () => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);
    let result = { success: false, message: "Unknown action" };

    switch (activeDialog) {
      case 'approve-pinjam':
        result = await approvePeminjaman(selectedTransaction.id);
        break;
      case 'reject-pinjam':
        if (!rejectReason) {
            toast({ variant: "destructive", title: "Gagal", description: "Alasan penolakan harus diisi" });
            setIsSubmitting(false);
            return;
        }
        result = await rejectPeminjaman(selectedTransaction.id, rejectReason);
        break;
      case 'approve-kembali':
        // Overridden by multi-step logic. Shouldn't reach here normally.
        result = await approvePengembalian(selectedTransaction.id, returnCondition, excludedDates);
        break;
      case 'reject-kembali':
        if (!rejectReason) {
            toast({ variant: "destructive", title: "Gagal", description: "Alasan penolakan harus diisi" });
            setIsSubmitting(false);
            return;
        }
        result = await rejectPengembalian(selectedTransaction.id, rejectReason);
        break;
      case 'approve-perpanjang':
        result = await approvePerpanjangan(selectedTransaction.id);
        break;
      case 'reject-perpanjang':
        if (!rejectReason) {
            toast({ variant: "destructive", title: "Gagal", description: "Alasan penolakan harus diisi" });
            setIsSubmitting(false);
            return;
        }
        result = await rejectPerpanjangan(selectedTransaction.id, rejectReason);
        break;
      case 'return-lost':
        result = await returnLost(selectedTransaction.id, returnCondition);
        break;
    }

    if (result?.success) {
      toast({
        title: "Berhasil",
        description: "Aksi berhasil diproses.",
      });
      loadTransactions();
      closeDialog();
    } else {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: result?.message || "Terjadi kesalahan",
      });
    }
    setIsSubmitting(false);
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Req. Pinjam",
      approved: "Dipinjam",
      rejected: "Ditolak",
      return_pending: "Req. Kembali",
      returned: "Dikembalikan",
      overdue: "Terlambat",
      lost: "Hilang",
      extension_pending: "Req. Perpanjang",
    };
    return statusMap[status] || status;
  };

  const getStatusStyle = (status) => {
    const styleMap = {
      pending: "bg-blue-100 text-blue-700",
      approved: "bg-warning/20 text-warning",
      rejected: "bg-muted text-muted-foreground",
      return_pending: "bg-orange-100 text-orange-700",
      returned: "bg-success/20 text-success",
      overdue: "bg-destructive/20 text-destructive",
      lost: "bg-destructive/10 text-destructive border-destructive/20 border",
      extension_pending: "bg-purple-100 text-purple-700",
    };
    return styleMap[status] || "bg-muted text-muted-foreground";
  };

  // Render lists
  const renderTransactionTable = (list, type) => (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Buku & Anggota</TableHead>
            {type === "all" ? <TableHead className="hidden lg:table-cell">Status</TableHead> : <TableHead className="hidden md:table-cell">Tanggal Pengajuan</TableHead>}
            <TableHead className="hidden lg:table-cell">Jatuh Tempo</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada data ditemukan</p>
              </TableCell>
            </TableRow>
          ) : (
            list.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-primary">{getBookTitle(t)}</p>
                    <p className="text-sm">{getMemberName(t)} <span className="text-muted-foreground text-xs">({getMemberInfo(t)})</span></p>
                    {type === "all" && <p className="text-xs text-muted-foreground md:hidden mt-1">{getStatusLabel(t.status)}</p>}
                  </div>
                </TableCell>
                {type === "all" ? (
                  <TableCell className="hidden lg:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(t.status)}`}>
                      {getStatusLabel(t.status)}
                    </span>
                    {(t.denda || 0) > 0 && <p className="text-xs text-destructive mt-1 font-medium">Denda: Rp{t.denda.toLocaleString()}</p>}
                  </TableCell>
                ) : (
                  <TableCell className="hidden md:table-cell whitespace-nowrap">
                    {formatDate(t.updated_at || t.created_at)}
                  </TableCell>
                )}
                <TableCell className="hidden lg:table-cell">
                  {t.tanggal_jatuh_tempo ? (
                     <div className="flex items-center gap-2">
                        {isOverdue(t.tanggal_jatuh_tempo) && <AlertCircle className="h-4 w-4 text-destructive" />}
                        <span className={isOverdue(t.tanggal_jatuh_tempo) ? "text-destructive font-medium" : ""}>
                            {formatDate(t.tanggal_jatuh_tempo)}
                        </span>
                     </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {type === "pinjam" && (
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" className="text-destructive hover:text-destructive" onClick={() => openDialog('reject-pinjam', t)}><X className="h-4 w-4" /></Button>
                      <Button size="icon" className="bg-success hover:bg-success/90" onClick={() => openDialog('approve-pinjam', t)}><Check className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {type === "kembali" && (
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" className="text-destructive hover:text-destructive" onClick={() => openDialog('reject-kembali', t)}><X className="h-4 w-4" /></Button>
                      <Button size="icon" className="bg-success hover:bg-success/90" onClick={() => openDialog('approve-kembali', t)}><BookCheck className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {type === "perpanjang" && (
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" className="text-destructive hover:text-destructive" onClick={() => openDialog('reject-perpanjang', t)}><X className="h-4 w-4" /></Button>
                      <Button size="icon" className="bg-success hover:bg-success/90" onClick={() => openDialog('approve-perpanjang', t)}><Check className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {type === "all" && t.status === "lost" && (
                     <Button size="sm" variant="outline" onClick={() => openDialog('return-lost', t)}>
                         <RotateCcw className="mr-2 h-4 w-4" /> Buku Ditemukan
                     </Button>
                  )}
                  {type === "all" && t.status !== "lost" && (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transaksi & Approval</h1>
          <p className="text-muted-foreground">
            Kelola persetujuan peminjaman, pengembalian, perpanjangan, dan riwayat
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="w-full md:w-auto flex md:inline-flex min-w-max">
            <TabsTrigger value="pinjam" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Req. Peminjaman
              {transactions.filter(t => t.status === "pending").length > 0 && (
                <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {transactions.filter(t => t.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="kembali" className="gap-2">
              <BookCheck className="h-4 w-4" />
              Req. Pengembalian
              {transactions.filter(t => t.status === "return_pending").length > 0 && (
                <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                  {transactions.filter(t => t.status === "return_pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="perpanjang" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Req. Perpanjangan
              {transactions.filter(t => t.status === "extension_pending").length > 0 && (
                <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  {transactions.filter(t => t.status === "extension_pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Denda Belum Terbayar
              {unpaidTransactions.length > 0 && (
                 <span className="ml-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                   {unpaidTransactions.length}
                 </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              Semua Riwayat
            </TabsTrigger>
          </TabsList>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari judul buku atau nama anggota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeTab === "all" && (
                <Select value={filterStatusGlobal} onValueChange={setFilterStatusGlobal}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Req. Pinjam</SelectItem>
                    <SelectItem value="approved">Dipinjam</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="return_pending">Req. Kembali</SelectItem>
                    <SelectItem value="returned">Dikembalikan</SelectItem>
                    <SelectItem value="extension_pending">Req. Perpanjang</SelectItem>
                    <SelectItem value="overdue">Terlambat</SelectItem>
                    <SelectItem value="lost">Hilang</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingLocal && activeTab !== "unpaid" ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="pinjam" className="m-0 space-y-4">
                  {renderTransactionTable(paginatedTransactions, "pinjam")}
                </TabsContent>
                <TabsContent value="kembali" className="m-0 space-y-4">
                  {renderTransactionTable(paginatedTransactions, "kembali")}
                </TabsContent>
                <TabsContent value="perpanjang" className="m-0 space-y-4">
                  {renderTransactionTable(paginatedTransactions, "perpanjang")}
                </TabsContent>
                <TabsContent value="unpaid" className="m-0">
                  {Object.keys(unpaidByUser).length === 0 ? (
                    <div className="rounded-md border p-8 text-center text-muted-foreground">Tidak ada denda belum terbayar.</div>
                  ) : (
                    <div className="space-y-4">
                      {Object.values(unpaidByUser).map(group => (
                        <div key={group.user.id} className="rounded-md border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20">
                            <div>
                                <h3 className="font-semibold text-primary">{group.user?.nama_lengkap} <span className="font-normal text-muted-foreground text-sm">({group.user?.nis})</span></h3>
                                <p className="text-sm mt-1">Total Sisa Denda: <span className="font-semibold text-destructive">Rp {group.totalSisa.toLocaleString()}</span> dari {group.transactions.length} transaksi</p>
                            </div>
                            <Button onClick={() => openBulkPaymentDialog(group)} className="w-full sm:w-auto">Bayar Denda</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="all" className="m-0 space-y-4">
                  {renderTransactionTable(paginatedTransactions, "all")}
                </TabsContent>

                {activeTab !== "unpaid" && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(totalItems / limit)}
                      onPageChange={setCurrentPage}
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Menampilkan {paginatedTransactions.length} dari {totalItems} transaksi
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Reusable Dialog for Actions */}
      <AlertDialog open={!!activeDialog} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeDialog?.includes('approve') ? 'Konfirmasi Approval' : 
               activeDialog?.includes('reject') ? 'Tolak Permohonan' : 
               activeDialog === 'bulk-pay' ? 'Pembayaran Denda Anggota' :
               'Return Lost Book'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeDialog === 'approve-pinjam' && "Apakah Anda yakin ingin menyetujui request peminjaman ini?"}
              {(activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && returnStep === 1 && "Verifikasi kondisi buku dan tentukan hari pengecualian denda sebelum kalkulasi."}
              {(activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && returnStep === 2 && "Hasil kalkulasi denda berdasarkan sistem siap untuk dibayarkan."}
              {activeDialog === 'approve-perpanjang' && "Apakah Anda yakin ingin menyetujui perpanjangan buku ini?"}
              {activeDialog?.includes('reject') && "Silakan masukkan alasan penolakan agar anggota tahu kenapa ditolak."}
              
              {selectedTransaction && (
                <div className="mt-4 rounded-md bg-muted p-3 text-foreground">
                  <p className="font-medium text-primary">{getBookTitle(selectedTransaction)}</p>
                  <p className="text-sm mt-1">Peminjam: {getMemberName(selectedTransaction)}</p>
                </div>
              )}

              {(activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && returnStep === 1 && (
                <div className="mt-4 space-y-4 text-foreground">
                  <div className="space-y-2">
                    <Label htmlFor="kondisiBuku">Kondisi Buku Saat Diterima *</Label>
                    <Select value={returnCondition} onValueChange={setReturnCondition}>
                      <SelectTrigger id="kondisiBuku">
                        <SelectValue placeholder="Pilih kondisi buku" />
                      </SelectTrigger>
                      <SelectContent>
                        {kondisiOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && (
                  <div className="space-y-2">
                     <Label>Pengecualian Hari Denda (Opsional)</Label>
                     <div className="flex gap-2">
                        <Input type="date" value={excludedDateInput} onChange={(e) => setExcludedDateInput(e.target.value)} />
                        <Button type="button" variant="outline" onClick={handleAddExcludedDate}>Tambah</Button>
                     </div>
                     {excludedDates.length > 0 && (
                       <div className="flex flex-wrap gap-2 mt-2">
                         {excludedDates.map(d => (
                           <span key={d} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                             {formatDate(d)}
                             <button type="button" onClick={() => handleRemoveExcludedDate(d)} className="ml-1 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                           </span>
                         ))}
                       </div>
                     )}
                  </div>
                  )}
                  <p className="text-xs text-muted-foreground">Kalkulasi akhir akan otomatis dilakukan oleh sistem.</p>
                </div>
              )}

              {(activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && returnStep === 2 && finePreview && (
                <div className="mt-4 space-y-4 text-foreground bg-muted p-4 rounded-md">
                   <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm">Terlambat:</span>
                      <span className="font-semibold">{finePreview.hari_terlambat} Hari (Rp {(finePreview.rincian_denda?.denda_terlambat || 0).toLocaleString()})</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm">Kerusakan / Hilang ({finePreview.kondisi_buku}):</span>
                      <span className="font-semibold text-destructive">Rp {(finePreview.rincian_denda?.denda_kondisi || 0).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 text-lg">
                      <span className="font-bold">Total Denda:</span>
                      <span className="font-bold text-destructive">Rp {(finePreview.rincian_denda?.total_denda || 0).toLocaleString()}</span>
                   </div>

                   {finePreview.rincian_denda?.total_denda > 0 && (
                     <div className="pt-4 space-y-2">
                       <Label htmlFor="paymentAmount">Jumlah Uang Dibayar Sekarang (Rp)</Label>
                       <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="paymentAmount"
                            type="number" 
                            min="0"
                            placeholder="0"
                            className="pl-9"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                       </div>
                       {paymentAmount && Number(paymentAmount) > finePreview.rincian_denda.total_denda && (
                         <p className="text-sm text-success mt-1">Kembalian: Rp {(Number(paymentAmount) - finePreview.rincian_denda.total_denda).toLocaleString()}</p>
                       )}
                       {paymentAmount && Number(paymentAmount) > 0 && Number(paymentAmount) < finePreview.rincian_denda.total_denda && (
                         <p className="text-sm text-warning mt-1">Sisa Denda: Rp {(finePreview.rincian_denda.total_denda - Number(paymentAmount)).toLocaleString()} (Disimpan)</p>
                       )}
                     </div>
                   )}
                </div>
              )}

              {activeDialog === 'bulk-pay' && bulkPayGroup && (
                <div className="mt-4 space-y-4 text-foreground text-left">
                  <p className="font-medium text-primary mb-2">Pilih transaksi yang akan dibayar untuk {bulkPayGroup.user?.nama_lengkap}:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {bulkPayGroup.transactions.map(t => {
                       const sisa = t.denda - (t.denda_dibayar || 0);
                       return (
                         <div key={t.id} className="flex items-start space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50" onClick={() => handleToggleBulkFine(t.id)}>
                            <div className="mt-0.5">
                               <input type="checkbox" className="w-4 h-4" checked={selectedBulkFines.includes(t.id)} readOnly />
                            </div>
                            <div className="flex-1">
                               <p className="font-medium text-sm leading-tight">{getBookTitle(t)}</p>
                               <p className="text-xs text-muted-foreground mt-1">Total: Rp {t.denda.toLocaleString()} | Sisa: <span className="text-destructive font-bold">Rp {sisa.toLocaleString()}</span></p>
                            </div>
                         </div>
                       );
                    })}
                  </div>
                  <div className="pt-4 space-y-2 border-t mt-4">
                     <Label htmlFor="bulkPaymentAmount">Jumlah Uang Dibayar (Rp)</Label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="bulkPaymentAmount"
                          type="number" 
                          min="0"
                          placeholder="0"
                          className="pl-9"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                     </div>
                     {(()=>{ 
                         const totalSisaTerpilih = bulkPayGroup.transactions
                                 .filter(t => selectedBulkFines.includes(t.id))
                                 .reduce((sum, t) => sum + (t.denda - (t.denda_dibayar||0)), 0);
                         const isPas = Number(paymentAmount) >= totalSisaTerpilih;
                         return (
                           <div className="text-sm mt-3 bg-muted p-2 rounded-md font-medium flex justify-between px-2">
                              <span>Total Terpilih: <b>Rp {totalSisaTerpilih.toLocaleString()}</b></span>
                              {paymentAmount && isPas && <span className="text-success">Kembalian: Rp {(Number(paymentAmount) - totalSisaTerpilih).toLocaleString()}</span>}
                              {paymentAmount && !isPas && Number(paymentAmount) > 0 && <span className="text-warning">Sisa Belum Lunas: Rp {(totalSisaTerpilih - Number(paymentAmount)).toLocaleString()}</span>}
                           </div>
                         );
                     })()}
                  </div>
                </div>
              )}

              {activeDialog?.includes('reject') && (
                <div className="mt-4 space-y-2 text-foreground">
                  <Label htmlFor="rejectReason">Alasan Penolakan *</Label>
                  <Textarea 
                    id="rejectReason" 
                    placeholder="Contoh: Stok sedang diprioritaskan untuk kelas 12" 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {((activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && returnStep === 2) ? (
              <Button variant="outline" onClick={() => setReturnStep(1)}>Kembali</Button>
            ) : (
              <AlertDialogCancel>Batal</AlertDialogCancel>
            )}
            
            {(activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && returnStep === 1 && (
               <Button onClick={handleCalculateFinePreview} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kalkulasikan Denda
               </Button>
            )}

            {(activeDialog === 'approve-kembali' || activeDialog === 'return-lost') && returnStep === 2 && finePreview && (
               <>
                 {finePreview.rincian_denda?.total_denda > 0 && (
                   <Button variant="outline" onClick={() => handleApproveAndPay(true)} disabled={isSubmitting}>
                     Bayar Nanti
                   </Button>
                 )}
                 <Button onClick={() => handleApproveAndPay(false)} disabled={isSubmitting} className="bg-success hover:bg-success/90">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {finePreview.rincian_denda?.total_denda > 0 ? "Bayar & Selesai" : "Selesaikan Pengembalian"}
                 </Button>
               </>
            )}

            {activeDialog === 'bulk-pay' && (
              <Button onClick={handleBulkPay} disabled={isSubmitting || selectedBulkFines.length === 0} className="bg-success hover:bg-success/90">
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Bayar
              </Button>
            )}

            {activeDialog !== 'approve-kembali' && activeDialog !== 'return-lost' && activeDialog !== 'bulk-pay' && (
              <AlertDialogAction 
                onClick={handleConfirmAction} 
                disabled={isSubmitting} 
                className={activeDialog?.includes('reject') ? "bg-destructive hover:bg-destructive/90 text-white" : ""}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {activeDialog?.includes('approve') ? 'Proses' : 'Tolak'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTransactions;
