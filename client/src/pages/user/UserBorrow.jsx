import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLibrary, getCoverUrl } from "../../context/LibraryContext";
import { useSocket } from "../../context/SocketContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, BookPlus, MapPin, User, CheckCircle, Loader2 } from "lucide-react";
import Pagination from "@/components/ui/pagination";

const UserBorrow = () => {
  const { user } = useAuth();
  const { 
    fetchBooks, 
    categories, 
    requestPeminjaman, 
    getActiveTransactionsByUser, 
    settings, 
    loading: globalLoading 
  } = useLibrary();
  const { adminOnDuty } = useSocket();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [paginatedBooks, setPaginatedBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 9; // Grid layout 3x3

  const activeLoans = getActiveTransactionsByUser(user?.id);
  const MAX_LOANS = settings?.max_borrow_limit || 3;
  const canBorrow = activeLoans.length < MAX_LOANS;

  const loadBooks = useCallback(async () => {
    setIsLoadingLocal(true);
    const offset = (currentPage - 1) * limit;
    const res = await fetchBooks({ 
      limit, 
      offset, 
      search: searchQuery,
      kategori: selectedCategoryId === "all" ? undefined : selectedCategoryId,
      availableOnly: "true"
    });
    if (res.success) {
      setPaginatedBooks(res.data || []);
      setTotalItems(res.totalItems || 0);
    }
    setIsLoadingLocal(false);
  }, [currentPage, searchQuery, selectedCategoryId, fetchBooks]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryId]);

  const isBookBorrowed = (bookId) =>
    activeLoans.some((loan) => loan.buku_id === bookId);

  const handleBorrowClick = (book) => {
    if (!adminOnDuty) {
      toast({
        variant: "destructive",
        title: "Admin Offline",
        description: "Tidak dapat meminjam buku karena tidak ada petugas yang sedang berjaga.",
      });
      return;
    }
    if (!canBorrow) {
      toast({
        variant: "destructive",
        title: "Batas Peminjaman",
        description: `Anda sudah meminjam batas maksimum buku. Kembalikan buku terlebih dahulu.`,
      });
      return;
    }
    setSelectedBook(book);
    setIsDialogOpen(true);
  };

  const handleConfirmBorrow = async () => {
    if (!selectedBook) return;

    setIsSubmitting(true);
    const result = await requestPeminjaman(selectedBook.id);
    if (result.success) {
      loadBooks();
      toast({
        title: "Request Terkirim!",
// ... existing code
      });
    } else {
// ...
    }
    setIsSubmitting(false);
    setIsDialogOpen(false);
    setSelectedBook(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pinjam Buku</h1>
        <p className="text-muted-foreground">
          Pilih buku yang ingin Anda pinjam. Maksimal {MAX_LOANS} buku per anggota.
        </p>
      </div>

      {!adminOnDuty && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive">
          <AlertTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Tidak Ada Admin Berjaga
          </AlertTitle>
          <AlertDescription>
            Saat ini tidak ada petugas perpustakaan yang berjaga. Anda hanya dapat melihat katalog, 
            namun tidak dapat melakukan request peminjaman sampai ada petugas yang aktif.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Peminjaman */}
      <Card className={activeLoans.length >= MAX_LOANS ? "border-warning" : ""}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  canBorrow ? "bg-success/10" : "bg-warning/10"
                }`}
              >
                <BookOpen
                  className={`h-5 w-5 ${canBorrow ? "text-success" : "text-warning"}`}
                />
              </div>
              <div>
                <p className="font-medium">Status Peminjaman Anda</p>
                <p className="text-sm text-muted-foreground">
                  {activeLoans.length} dari {MAX_LOANS} slot terpakai
                </p>
              </div>
            </div>
            <Badge variant={canBorrow ? "default" : "secondary"}>
              {canBorrow ? `${MAX_LOANS - activeLoans.length} slot tersisa` : "Penuh"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari buku yang tersedia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-muted-foreground">
        Menampilkan {paginatedBooks.length} dari {totalItems} buku tersedia
      </div>

      {isLoadingLocal ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : paginatedBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">Tidak ada buku tersedia</h3>
            <p className="text-muted-foreground">
              Semua buku sedang dipinjam atau sudah Anda pinjam
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedBooks.map((book) => (
              <Card key={book.id} className="hover:shadow-md transition-shadow relative overflow-hidden group">
                <CardHeader className="pb-3">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {book.sampul ? (
                        <img
                          src={getCoverUrl(book.sampul)}
                          alt={book.judul}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-2">{book.judul}</CardTitle>
                        <Badge className="shrink-0">
                          {book.stok} tersedia
                        </Badge>
                      </div>
                    </div>
                  </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{book.pengarang}</span>
                </div>
                {book.lokasi && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{book.lokasi}</span>
                  </div>
                )}
                <div className="pt-2">
                  <Badge variant="outline">{book.kategori?.nama || "-"}</Badge>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => handleBorrowClick(book)}
                  disabled={!canBorrow || !adminOnDuty || isBookBorrowed(book.id)}
                  variant={!adminOnDuty || isBookBorrowed(book.id) ? "outline" : "default"}
                >
                  <BookPlus className="mr-2 h-4 w-4" />
                  {isBookBorrowed(book.id) ? "Sudah Dipinjam" : adminOnDuty ? "Pinjam Buku" : "Admin Offline"}
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / limit)}
            onPageChange={setCurrentPage}
            className="mt-6"
          />
        </>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Peminjaman</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin meminjam buku ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedBook && (
            <div className="rounded-md bg-muted p-4 my-2">
              <p className="font-medium">{selectedBook.judul}</p>
              <p className="text-sm text-muted-foreground">{selectedBook.pengarang}</p>
              <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Masa peminjaman:</span> 7 hari
                </p>
                <p>
                  <span className="text-muted-foreground">Denda keterlambatan:</span> Rp
                  1.000/hari
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBorrow} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Pinjam Buku
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserBorrow;
