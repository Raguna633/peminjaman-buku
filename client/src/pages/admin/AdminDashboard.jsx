import { useLibrary } from "../../context/LibraryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ArrowLeftRight, BookCheck, TrendingUp, AlertCircle } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, description, variant = "default" }) => {
  const variants = {
    default: "bg-card",
    primary: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
  };

  return (
    <Card className={variants[variant]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const { books, members, transactions, getStatistics } = useLibrary();
  const stats = getStatistics();

  // Buku yang mendekati habis (stok <= 2)
  const lowStockBooks = books.filter((book) => book.stok <= 2 && book.stok > 0);

  // Transaksi terbaru
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.tanggal_pinjam || b.created_at) - new Date(a.tanggal_pinjam || a.created_at))
    .slice(0, 5);

  // Buku populer (berdasarkan stok terbanyak)
  const popularBooks = [...books]
    .sort((a, b) => (b.stok || 0) - (a.stok || 0))
    .slice(0, 5);

  const getBookTitle = (bookId) => {
    const book = books.find((b) => b.id === bookId);
    return book?.judul || "Buku tidak ditemukan";
  };

  const getBookTitleFromTransaction = (transaction) => {
    return transaction.buku?.judul || getBookTitle(transaction.buku_id);
  };

  const getMemberName = (userId) => {
    const member = members.find((m) => m.id === userId);
    return member?.nama_lengkap || "Anggota tidak ditemukan";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Selamat datang di panel administrasi Perpustakaan Sekolah Digital
        </p>
      </div>

      {/* Statistik Utama */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Koleksi Buku"
          value={stats.totalBooks.toLocaleString()}
          icon={BookOpen}
          description={`${stats.availableBooks} tersedia`}
          variant="primary"
        />
        <StatCard
          title="Anggota Terdaftar"
          value={stats.totalMembers}
          icon={Users}
          description="Siswa dan guru"
        />
        <StatCard
          title="Peminjaman Aktif"
          value={stats.activeTransactions}
          icon={ArrowLeftRight}
          description="Buku sedang dipinjam"
          variant="warning"
        />
        <StatCard
          title="Total Transaksi"
          value={stats.totalTransactions}
          icon={BookCheck}
          description={`Rp ${stats.totalFines.toLocaleString()} total denda`}
          variant="success"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transaksi Terbaru */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {getBookTitleFromTransaction(transaction)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getMemberName(transaction.user_id)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${transaction.status === "approved"
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(transaction.tanggal_pinjam)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Buku Populer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Buku Populer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.judul}</p>
                    <p className="text-xs text-muted-foreground">{book.pengarang}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{book.stok}</p>
                    <p className="text-xs text-muted-foreground">stok</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peringatan Stok Rendah */}
      {lowStockBooks.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Peringatan Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {lowStockBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between bg-card rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{book.judul}</p>
                    <p className="text-xs text-muted-foreground">Lokasi: {book.lokasi}</p>
                  </div>
                  <span className="ml-2 inline-flex items-center rounded-full bg-warning/20 px-2 py-1 text-xs font-medium text-warning">
                    {book.stok} tersisa
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
