import { useState } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Users, TrendingUp, DollarSign, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminReports = () => {
  const { books, members, transactions, getStatistics, getBookById, getMemberById, categories } = useLibrary();
  const stats = getStatistics();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Statistik per kategori
  const categoryStats = categories.map((cat) => {
    const categoryBooks = books.filter((b) => b.kategori_id === cat.id);
    const totalBooks = categoryBooks.reduce((acc, b) => acc + (b.stok || 0), 0);
    return {
      ...cat,
      totalBooks,
      availableBooks: totalBooks,
    };
  });

  // Transaksi bulan ini
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTransactions = transactions.filter((t) => {
    const date = new Date(t.tanggal_pinjam || t.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Top peminjam
  const borrowerStats = {};
  transactions.forEach((t) => {
    const userId = t.user_id;
    if (!userId) return;
    if (!borrowerStats[userId]) {
      borrowerStats[userId] = { count: 0, totalFines: 0 };
    }
    borrowerStats[userId].count++;
    borrowerStats[userId].totalFines += (t.denda || 0);
  });

  const topBorrowers = Object.entries(borrowerStats)
    .map(([userId, data]) => ({
      userId,
      member: getMemberById(parseInt(userId)),
      ...data,
    }))
    .filter((b) => b.member)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Filter buku berdasarkan kategori
  const filteredBooks =
    selectedCategory === "all"
      ? books
      : books.filter((b) => b.kategori?.nama === selectedCategory);

  // Buku berdasarkan stok
  const popularBooks = [...books].sort((a, b) => (b.stok || 0) - (a.stok || 0)).slice(0, 10);

  // Status distribution for chart
  const statusCounts = transactions.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  
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

  const barData = Object.keys(statusCounts).map((key) => ({
    name: statusMap[key] || key,
    total: statusCounts[key],
  }));

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID Transaksi", "Judul Buku", "Nama Siswa", "Status", "Tanggal Pinjam", "Tanggal Kembali", "Denda", "Kondisi Buku"];
    const csvContent = [
      headers.join(";"),
      ...transactions.map(t => {
        const bookTitle = getBookById(t.buku_id)?.judul || "-";
        const memberName = getMemberById(t.user_id)?.nama_lengkap || "-";
        return [
          t.id, 
          `"${bookTitle}"`, 
          `"${memberName}"`, 
          statusMap[t.status] || t.status, 
          t.tanggal_pinjam || "-", 
          t.tanggal_kembali || "-", 
          t.denda || 0, 
          t.kondisi_buku || "-"
        ].join(";");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_transaksi_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Perpustakaan</h1>
          <p className="text-muted-foreground">
            Rekap statistik dan laporan aktivitas perpustakaan
          </p>
        </div>
        <Button onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export Transaksi (CSV)
        </Button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Koleksi
            </CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableBooks} tersedia, {stats.borrowedBooks} dipinjam
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Anggota
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Siswa dan guru aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transaksi Bulan Ini
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Dari total {stats.totalTransactions} transaksi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Denda
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalFines.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Dari keterlambatan pengembalian
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Status Transaksi */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Status Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tick={{ width: 80, wordWrap: 'break-word' }} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Statistik per Kategori */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Statistik per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Tersedia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.nama}</TableCell>
                      <TableCell className="text-center">{cat.totalBooks}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-success">{cat.availableBooks}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Peminjam */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Peminjam Teraktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center">Peminjaman</TableHead>
                    <TableHead className="text-right">Denda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topBorrowers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <p className="text-muted-foreground">Belum ada data</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    topBorrowers.map((borrower, index) => (
                      <TableRow key={borrower.userId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{borrower.member?.nama_lengkap}</p>
                              <p className="text-xs text-muted-foreground">
                                {borrower.member?.class || borrower.member?.nis || "-"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{borrower.count}x</TableCell>
                        <TableCell className="text-right">
                          {borrower.totalFines > 0 ? (
                            <span className="text-destructive">
                              Rp {borrower.totalFines.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buku Populer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Koleksi Buku
          </CardTitle>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.nama}>
                  {cat.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Judul Buku</TableHead>
                  <TableHead className="hidden md:table-cell">Pengarang</TableHead>
                  <TableHead className="hidden lg:table-cell">Kategori</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedCategory === "all" ? popularBooks : filteredBooks.sort((a, b) => (b.stok || 0) - (a.stok || 0)).slice(0, 10)).map(
                  (book, index) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{book.judul}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {book.pengarang}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {book.pengarang}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {book.kategori?.nama || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{book.stok}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
