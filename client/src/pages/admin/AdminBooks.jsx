import { useState, useEffect, useRef } from "react";
import { useLibrary, getCoverUrl } from "../../context/LibraryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Pencil, Trash2, BookOpen, Loader2, Image, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/ui/pagination";

const AdminBooks = () => {
  const { books, categories, addBook, updateBook, deleteBook, loading, settings, fetchSettings, fetchBooks } = useLibrary();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [paginatedBooks, setPaginatedBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [formData, setFormData] = useState({
    judul: "",
    pengarang: "",
    penerbit: "",
    tahun_terbit: "",
    isbn: "",
    kategori_id: "",
    stok: "",
    kondisi: "banyak_baik",
    lokasi: "",
    deskripsi: "",
    sampul: null,
  });

  const textareaRef = useRef(null);

  const loadBooks = async () => {
    setIsLoadingLocal(true);
    const offset = (currentPage - 1) * limit;
    const fetchParams = { limit, offset, search: searchQuery };
    if (filterKategori !== "all") {
      fetchParams.kategori = filterKategori;
    }
    const res = await fetchBooks(fetchParams);
    if (res.success) {
      setPaginatedBooks(res.data || []);
      setTotalItems(res.totalItems || 0);
    }
    setIsLoadingLocal(false);
  };

  useEffect(() => {
    loadBooks();
  }, [currentPage, searchQuery, filterKategori, fetchBooks]);

  // Reset to page 1 when searching or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKategori]);

  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.deskripsi]);

  const getCategoryName = (id) => {
    const category = categories.find((cat) => (cat.id_kategori || cat.id) === id);
    return category ? category.nama : "Tanpa Kategori";
  };

  const resetForm = () => {
    setFormData({
      judul: "",
      pengarang: "",
      penerbit: "",
      tahun_terbit: "",
      isbn: "",
      kategori_id: "",
      stok: "",
      kondisi: "banyak_baik",
      lokasi: "",
      deskripsi: "",
      sampul: null,
    });
    setSelectedBook(null);
    setFilePreview(null);
  };

  const handleOpenDialog = (book = null) => {
    if (book) {
      setSelectedBook(book);
      setFormData({
        judul: book.judul,
        pengarang: book.pengarang,
        penerbit: book.penerbit || "",
        tahun_terbit: book.tahun_terbit?.toString() || "",
        isbn: book.isbn || "",
        kategori_id: book.kategori_id?.toString() || "",
        stok: book.stok?.toString() || "",
        kondisi: book.kondisi || "banyak_baik",
        lokasi: book.lokasi || "",
        deskripsi: book.deskripsi || "",
        sampul: null,
      });
      setFilePreview(null);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validasi khusus untuk ISBN
    if (name === "isbn") {
      const filteredValue = value.replace(/[^0-9-]/g, "");
      if (filteredValue.length <= 17) {
        setFormData((prev) => ({ ...prev, [name]: filteredValue }));
      }
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, sampul: file }));
      // Create preview for new local file
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, sampul: null }));
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.judul || !formData.pengarang || !formData.kategori_id || !formData.stok) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Judul, pengarang, kategori, dan stok harus diisi",
      });
      return;
    }

    setIsSubmitting(true);

    const bookData = new FormData();
    bookData.append("judul", formData.judul);
    bookData.append("pengarang", formData.pengarang);
    if (formData.penerbit) bookData.append("penerbit", formData.penerbit);
    bookData.append("tahun_terbit", parseInt(formData.tahun_terbit) || new Date().getFullYear());
    if (formData.isbn) bookData.append("isbn", formData.isbn);
    bookData.append("kategori_id", parseInt(formData.kategori_id));
    bookData.append("stok", parseInt(formData.stok));
    bookData.append("kondisi", formData.kondisi);
    if (formData.lokasi) bookData.append("lokasi", formData.lokasi);
    if (formData.deskripsi) bookData.append("deskripsi", formData.deskripsi);
    
    if (formData.sampul instanceof File) {
      bookData.append("sampul", formData.sampul);
    }

    let result;
    if (selectedBook) {
      result = await updateBook(selectedBook.id, bookData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Data buku berhasil diperbarui" });
      }
    } else {
      result = await addBook(bookData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Buku baru berhasil ditambahkan" });
      }
    }

    if (!result.success) {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }

    setIsSubmitting(false);
    if (result.success) {
      loadBooks();
      handleCloseDialog();
    }
  };

  const handleDeleteClick = (book) => {
    setSelectedBook(book);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    const result = await deleteBook(selectedBook.id);
    if (result.success) {
      toast({ title: "Berhasil", description: "Buku berhasil dihapus" });
      loadBooks();
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }
    setIsSubmitting(false);
    setIsDeleteDialogOpen(false);
    setSelectedBook(null);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kelola Buku</h1>
          <p className="text-muted-foreground">
            Kelola koleksi buku perpustakaan
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Buku
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul, pengarang, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Semua Kategori" />
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
        </CardHeader>
        <CardContent>
          {isLoadingLocal ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Sampul</TableHead>
                    <TableHead>Informasi Buku</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori & Lokasi</TableHead>
                    <TableHead className="hidden lg:table-cell">ISBN</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBooks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Buku tidak ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <div 
                            className="relative h-16 w-12 overflow-hidden rounded shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
                            onClick={() => {
                              if (book.sampul) {
                                setPreviewImage(getCoverUrl(book.sampul));
                                setIsPreviewOpen(true);
                              }
                            }}
                          >
                            {book.sampul ? (
                              <>
                                <img
                                  src={getCoverUrl(book.sampul)}
                                  alt={book.judul}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Search className="h-4 w-4 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-primary">
                              {book.judul}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {book.pengarang} • {book.penerbit} ({book.tahun_terbit})
                            </p>
                            <div className="md:hidden mt-1 flex flex-wrap gap-1">
                               <Badge variant="outline" className="text-[10px]">{getCategoryName(book.kategori_id)}</Badge>
                               <Badge variant="outline" className="text-[10px] bg-blue-50">{book.lokasi}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            <Badge variant="outline">
                              {getCategoryName(book.kategori_id)}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              📍 {book.lokasi}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs font-mono">{book.isbn}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={book.stok > 0 ? "secondary" : "destructive"}
                            className={book.stok > 5 ? "bg-success/10 text-success hover:bg-success/20 border-none" : ""}
                          >
                            {book.stok}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenDialog(book)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="hover:bg-destructive/10"
                              onClick={() => handleDeleteClick(book)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                Menampilkan {paginatedBooks.length} dari {totalItems} buku
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Tambah/Edit Buku */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>
              {selectedBook ? "Edit Buku" : "Tambah Buku Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedBook
                ? "Perbarui informasi buku di bawah ini"
                : "Isi informasi buku baru di bawah ini"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <form id="book-form" onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="judul">Judul Buku *</Label>
                    <Input
                      id="judul"
                      name="judul"
                      value={formData.judul}
                      onChange={handleChange}
                      placeholder="Masukkan judul buku"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pengarang">Pengarang *</Label>
                    <Input
                      id="pengarang"
                      name="pengarang"
                      value={formData.pengarang}
                      onChange={handleChange}
                      placeholder="Masukkan nama pengarang"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="penerbit">Penerbit</Label>
                    <Input
                      id="penerbit"
                      name="penerbit"
                      value={formData.penerbit}
                      onChange={handleChange}
                      placeholder="Masukkan nama penerbit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tahun_terbit">Tahun Terbit</Label>
                    <Input
                      id="tahun_terbit"
                      name="tahun_terbit"
                      type="number"
                      value={formData.tahun_terbit}
                      onChange={handleChange}
                      placeholder="2024"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      placeholder="978-xxx-xxx-xxx-x"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kategori_id">Kategori *</Label>
                    <Select
                      value={formData.kategori_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, kategori_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stok">Jumlah Stok *</Label>
                    <Input
                      id="stok"
                      name="stok"
                      type="number"
                      value={formData.stok}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lokasi">Lokasi Rak</Label>
                    <Select
                      value={formData.lokasi}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, lokasi: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih lokasi rak" />
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.shelf_locations?.length > 0 ? (
                          settings.shelf_locations.map((shelf, index) => (
                            <SelectItem key={index} value={shelf}>
                              {shelf}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="none">
                            Belum ada lokasi rak diatur
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    name="deskripsi"
                    ref={textareaRef}
                    value={formData.deskripsi}
                    onChange={handleChange}
                    placeholder="Deskripsi singkat tentang buku"
                    className="resize-none overflow-hidden min-h-[40px]"
                  />
                </div>
                <div className="space-y-3 pb-4">
                  <Label htmlFor="sampul">Gambar Sampul</Label>
                  
                  {/* Form Image Preview Section */}
                  {(filePreview || (selectedBook && selectedBook.sampul)) && (
                    <div className="relative w-32 h-44 rounded-md overflow-hidden border bg-muted mb-2 group">
                      <img
                        src={filePreview || getCoverUrl(selectedBook.sampul)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white font-medium mb-1">
                          {filePreview ? "Preview Baru" : "Sampul Saat Ini"}
                        </p>
                        {filePreview && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => {
                              setFilePreview(null);
                              setFormData(prev => ({ ...prev, sampul: null }));
                              // Reset input file
                              const fileInput = document.getElementById('sampul');
                              if (fileInput) fileInput.value = '';
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      id="sampul"
                      name="sampul"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    Maksimal 2MB, format gambar (JPG, PNG)
                  </p>
                </div>
              </div>
            </form>
          </div>

          <DialogFooter className="p-6 pt-2 border-t bg-background">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button type="submit" form="book-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedBook ? "Simpan Perubahan" : "Tambah Buku"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Buku?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus buku "{selectedBook?.judul}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog Preview Sampul Besar */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative group">
            <img
              src={previewImage}
              alt="Preview Besar"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center p-4 bg-background/80 backdrop-blur-sm rounded-b-lg border-t">
            <Button variant="default" onClick={() => setIsPreviewOpen(false)}>
              Tutup Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBooks;
