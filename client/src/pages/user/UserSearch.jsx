import { useState, useEffect, useCallback } from "react";
import { useLibrary, getCoverUrl } from "../../context/LibraryContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BookOpen, MapPin, Calendar, User, Loader2 } from "lucide-react";
import Pagination from "@/components/ui/pagination";

const UserSearch = () => {
  const { fetchBooks, categories, loading: globalLoading } = useLibrary();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [paginatedBooks, setPaginatedBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 9;

  const loadBooks = useCallback(async () => {
    setIsLoadingLocal(true);
    const offset = (currentPage - 1) * limit;
    const res = await fetchBooks({ 
      limit, 
      offset, 
      search: searchQuery,
      kategori: selectedCategoryId === "all" ? undefined : selectedCategoryId
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pencarian Buku</h1>
        <p className="text-muted-foreground">
          Temukan buku yang Anda cari berdasarkan judul, pengarang, atau ISBN
        </p>
      </div>

      {/* Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul, pengarang, atau ISBN..."
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
        Menampilkan {paginatedBooks.length} dari {totalItems} buku
      </div>

      {isLoadingLocal ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : paginatedBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">Buku tidak ditemukan</h3>
            <p className="text-muted-foreground">
              Coba gunakan kata kunci lain atau ubah filter kategori
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedBooks.map((book) => (
              <Card key={book.id} className="hover:shadow-md transition-shadow">
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
                        <Badge
                          variant={book.stok > 0 ? "default" : "secondary"}
                          className="shrink-0"
                        >
                          {book.stok > 0 ? `${book.stok} tersedia` : "Habis"}
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
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {book.penerbit} ({book.tahun_terbit})
                    </span>
                  </div>
                  {book.lokasi && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{book.lokasi}</span>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">ISBN: {book.isbn}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Badge variant="outline" className="mr-2">
                      {book.kategori?.nama || "-"}
                    </Badge>
                  </div>
                  {book.deskripsi && (
                    <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                      {book.deskripsi}
                    </p>
                  )}
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
    </div>
  );
};

export default UserSearch;
