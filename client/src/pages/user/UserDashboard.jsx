import { useAuth } from "../../context/AuthContext";
import { useLibrary, getCoverUrl } from "../../context/LibraryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Clock, History, Search, ArrowRight, AlertCircle } from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

const UserDashboard = () => {
  const { user } = useAuth();
  const { books, getActiveTransactionsByUser, getTransactionsByUser, getBookById } = useLibrary();

  const activeLoans = getActiveTransactionsByUser(user?.id);
  const allTransactions = getTransactionsByUser(user?.id);
  const recentTransactions = [...allTransactions]
    .sort((a, b) => new Date(b.tanggal_pinjam || b.created_at) - new Date(a.tanggal_pinjam || a.created_at))
    .slice(0, 5);

  // Buku populer
  const popularBooks = [...books].sort((a, b) => (b.stok || 0) - (a.stok || 0)).slice(0, 6);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Selamat Datang, {user?.nama_lengkap?.split(" ")[0] || user?.username}! 👋
        </h1>
        <p className="text-muted-foreground">
          {user?.class
            ? `Siswa Kelas ${user.class}`
            : "Anggota Perpustakaan"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <Link to="/user/search">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Cari Buku</p>
                <p className="text-sm text-muted-foreground">Temukan buku favoritmu</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link to="/user/borrow">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-success/10 p-3">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium">Pinjam Buku</p>
                <p className="text-sm text-muted-foreground">Lihat buku tersedia</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link to="/user/return">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-warning/10 p-3">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-medium">Pengembalian</p>
                <p className="text-sm text-muted-foreground">
                  {activeLoans.length} buku dipinjam
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link to="/user/history">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-accent p-3">
                <History className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium">Riwayat</p>
                <p className="text-sm text-muted-foreground">
                  {allTransactions.length} transaksi
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Peminjaman Aktif */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peminjaman Aktif
            </CardTitle>
            {activeLoans.length > 0 && (
              <Link to="/user/return">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {activeLoans.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Tidak ada peminjaman aktif</p>
                <Link to="/user/borrow">
                  <Button variant="link" className="mt-2">
                    Pinjam buku sekarang
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => {
                  const book = getBookById(loan.buku_id);
                  const dueDate = loan.tanggal_jatuh_tempo;
                  const daysUntilDue = dueDate ? getDaysUntilDue(dueDate) : null;
                  const overdue = dueDate ? isOverdue(dueDate) : false;

                  return (
                    <div
                      key={loan.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {book?.sampul || loan.buku?.sampul ? (
                          <img
                            src={getCoverUrl(book?.sampul || loan.buku?.sampul)}
                            alt={book?.judul || loan.buku?.judul}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center p-2">
                             <BookOpen className="h-full w-full text-primary/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{book?.judul || loan.buku?.judul || "Buku"}</p>
                        <p className="text-sm text-muted-foreground">
                          {book?.pengarang || loan.buku?.pengarang}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {overdue ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              Terlambat {Math.abs(daysUntilDue)} hari
                            </span>
                          ) : daysUntilDue !== null && daysUntilDue <= 2 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-warning">
                              <AlertCircle className="h-3 w-3" />
                              {daysUntilDue} hari lagi
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Batas: {formatDate(dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktivitas Terbaru */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Aktivitas Terbaru
            </CardTitle>
            {recentTransactions.length > 0 && (
              <Link to="/user/history">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => {
                  const book = getBookById(transaction.buku_id);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {book?.judul || transaction.buku?.judul || "Buku"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.tanggal_pinjam)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          transaction.status === "approved"
                            ? "bg-warning/20 text-warning"
                            : transaction.status === "lost"
                              ? "bg-destructive/20 text-destructive"
                              : transaction.status === "returned"
                                ? "bg-success/20 text-success"
                                : transaction.status === "pending"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {transaction.status === "approved"
                          ? "Dipinjam"
                          : transaction.status === "lost"
                            ? "Hilang"
                            : transaction.status === "returned"
                              ? "Dikembalikan"
                              : transaction.status === "pending"
                                ? "Pending"
                                : transaction.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rekomendasi Buku */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Buku Populer
          </CardTitle>
          <Link to="/user/search">
            <Button variant="ghost" size="sm">
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularBooks.map((book) => (
              <div
                key={book.id}
                className="flex gap-4 rounded-lg border p-4 hover:shadow-sm transition-shadow"
              >
                <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-muted shadow-sm">
                  {book.sampul ? (
                    <img
                      src={getCoverUrl(book.sampul)}
                      alt={book.judul}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3">
                      <BookOpen className="h-full w-full text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{book.judul}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {book.pengarang}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {book.kategori?.nama || "-"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {book.stok} tersedia
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
