import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, History, BookOpen, Loader2 } from "lucide-react";
import Pagination from "@/components/ui/pagination";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

const UserHistory = () => {
  const { user } = useAuth();
  const { transactions: allTransactions, fetchUserTransactions, getBookById } = useLibrary();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [paginatedTransactions, setPaginatedTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const loadTransactions = async () => {
    if (!user) return;
    setIsLoadingLocal(true);
    const offset = (currentPage - 1) * limit;
    const res = await fetchUserTransactions({ 
      limit, 
      offset, 
      status: statusFilter,
      search: searchQuery 
    });
    if (res.success) {
      setPaginatedTransactions(res.data || []);
      setTotalItems(res.totalItems || 0);
    }
    setIsLoadingLocal(false);
  };

  useEffect(() => {
    loadTransactions();
  }, [user, currentPage, statusFilter, searchQuery, fetchUserTransactions]);

  // Reset to page 1 when filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Statistics
  const totalBorrowed = allTransactions.length;
  const totalReturned = allTransactions.filter((t) => t.status === "returned").length;
  const totalFines = allTransactions.reduce((acc, t) => acc + (t.denda || 0), 0);
  const totalUnpaidFines = allTransactions.reduce((acc, t) => {
    // 1. Ambil nilai denda dan denda dibayar dengan fallback 0 (safeguard)
    const denda = t.denda || 0;
    const dendaDibayar = t.denda_dibayar || 0;

    // 2. Hitung sisa denda untuk transaksi ini
    const sisaDenda = denda - dendaDibayar;

    // 3. Tambahkan ke total akumulasi, menggunakan Math.max untuk mencegah nilai minus
    return acc + Math.max(0, sisaDenda);
  }, 0);

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Pending",
      approved: "Dipinjam",
      rejected: "Ditolak",
      return_pending: "Menunggu Pengembalian",
      returned: "Dikembalikan",
      overdue: "Terlambat",
      lost: "Hilang",
      extension_pending: "Menunggu Perpanjangan",
    };
    return statusMap[status] || status;
  };

  const getStatusStyle = (status) => {
    const styleMap = {
      pending: "bg-blue-100 text-blue-700 hover:bg-blue-200",
      approved: "bg-warning/20 text-warning hover:bg-warning/30",
      rejected: "bg-muted text-muted-foreground hover:bg-muted",
      return_pending: "bg-orange-100 text-orange-700 hover:bg-orange-200",
      returned: "bg-success/20 text-success hover:bg-success/30",
      overdue: "bg-destructive/20 text-destructive hover:bg-destructive/30",
      lost: "bg-destructive/20 text-destructive hover:bg-destructive/30",
      extension_pending: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    };
    return styleMap[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
        <p className="text-muted-foreground">
          Lihat histori peminjaman dan pengembalian buku Anda
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBorrowed}</p>
                <p className="text-sm text-muted-foreground">Total Peminjaman</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <History className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReturned}</p>
                <p className="text-sm text-muted-foreground">Dikembalikan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <History className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  Rp {totalUnpaidFines.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Denda yang Belum Dibayar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul buku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Dipinjam</SelectItem>
                <SelectItem value="returned">Dikembalikan</SelectItem>
                <SelectItem value="overdue">Terlambat</SelectItem>
                <SelectItem value="lost">Hilang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Daftar Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLocal ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">Belum ada riwayat</h3>
              <p className="text-muted-foreground">
                Riwayat transaksi Anda akan muncul di sini
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buku</TableHead>
                      <TableHead className="hidden md:table-cell">Tgl Pinjam</TableHead>
                      <TableHead className="hidden md:table-cell">Tgl Kembali</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Denda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => {
                      const book = transaction.buku || getBookById(transaction.buku_id);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{book?.judul || "Buku"}</p>
                              <p className="text-xs text-muted-foreground">
                                {book?.pengarang}
                              </p>
                              <p className="text-xs text-muted-foreground md:hidden">
                                {formatDate(transaction.tanggal_pinjam)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(transaction.tanggal_pinjam)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(transaction.tanggal_kembali)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getStatusStyle(transaction.status)}
                            >
                              {getStatusLabel(transaction.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {(transaction.denda || 0) > 0 ? (
                              <span className="text-destructive font-medium">
                                Rp {transaction.denda.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / limit)}
                onPageChange={setCurrentPage}
                className="mt-4"
              />

              <div className="mt-2 text-sm text-muted-foreground">
                Menampilkan {paginatedTransactions.length} dari {totalItems} transaksi
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHistory;
