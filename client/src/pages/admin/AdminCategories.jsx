import { useState, useEffect } from "react";
import { useLibrary } from "../../context/LibraryContext";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
import Pagination from "@/components/ui/pagination";

const AdminCategories = () => {
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    fetchCategories, 
    loading 
  } = useLibrary();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [paginatedCategories, setPaginatedCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
  });

  const loadCategories = async () => {
    setIsLoadingLocal(true);
    const offset = (currentPage - 1) * limit;
    const res = await fetchCategories({ limit, offset, search: searchQuery });
    if (res.success) {
      setPaginatedCategories(res.data || []);
      setTotalItems(res.totalItems || 0);
    }
    setIsLoadingLocal(false);
  };

  useEffect(() => {
    loadCategories();
  }, [currentPage, searchQuery, fetchCategories]);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({ nama: "", deskripsi: "" });
    setSelectedCategory(null);
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        nama: category.nama || "",
        deskripsi: category.deskripsi || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nama kategori harus diisi",
      });
      return;
    }

    setIsSubmitting(true);
    let result;
    if (selectedCategory) {
      result = await updateCategory(selectedCategory.id, formData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Kategori berhasil diperbarui" });
      }
    } else {
      result = await addCategory(formData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Kategori baru berhasil ditambahkan" });
      }
    }

    if (!result.success) {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }

    setIsSubmitting(false);
    if (result.success) {
      loadCategories();
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    const result = await deleteCategory(selectedCategory.id);
    if (result.success) {
      toast({ title: "Berhasil", description: "Kategori berhasil dihapus" });
      loadCategories();
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }
    setIsSubmitting(false);
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kelola Kategori</h1>
          <p className="text-muted-foreground">Kelola kategori buku perpustakaan</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLocal ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground">Tidak ada kategori ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {category.nama}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {category.deskripsi || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(category)}
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
                Menampilkan {paginatedCategories.length} dari {totalItems} kategori
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Tambah/Edit Kategori */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? "Perbarui informasi kategori"
                : "Isi informasi kategori baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Kategori *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                  placeholder="Contoh: Fiksi, Sains, Sejarah"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Input
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))}
                  placeholder="Deskripsi singkat tentang kategori"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedCategory ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori "{selectedCategory?.nama}"?
              Buku dengan kategori ini harus dipindahkan terlebih dahulu.
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
    </div>
  );
};

export default AdminCategories;
