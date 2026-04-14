import { useState, useEffect } from "react";
import { useLibrary, getPhotoUrl } from "../../context/LibraryContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Pencil, Trash2, Users, Loader2, FileText, Download, Upload, Shield, ShieldOff, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Pagination from "@/components/ui/pagination";

const AdminMembers = () => {
  const { 
    members, 
    addMember, 
    updateMember, 
    deleteMember, 
    bulkAddMembers,
    fetchMembers, 
    loading, 
    settings,
    user: currentUser
  } = useLibrary();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [paginatedMembers, setPaginatedMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nis: "",
    class: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    status: "active",
  });

  const kelasOptions = settings?.kelas_list || [];

  const loadMembers = async () => {
    setIsLoadingLocal(true);
    const offset = (currentPage - 1) * limit;
    const fetchParams = { limit, offset, search: searchQuery, role: 'user' };
    if (filterClass !== "all") {
      fetchParams.class = filterClass;
    }
    if (filterStatus !== "all") {
      fetchParams.status = filterStatus;
    }
    const res = await fetchMembers(fetchParams);
    if (res.success) {
      setPaginatedMembers(res.data || []);
      setTotalItems(res.totalItems || 0);
    }
    setIsLoadingLocal(false);
  };

  useEffect(() => {
    loadMembers();
  }, [currentPage, searchQuery, filterClass, filterStatus, fetchMembers]);

  // Reset to page 1 when searching or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterClass, filterStatus]);

  const resetForm = () => {
    setFormData({
      nama_lengkap: "",
      nis: "",
      class: "",
      username: "",
      password: "",
      email: "",
      phone: "",
      status: "active",
    });
    setSelectedMember(null);
  };

  const handleOpenDialog = (member = null) => {
    if (member) {
      setSelectedMember(member);
      setFormData({
        nama_lengkap: member.nama_lengkap || "",
        nis: member.nis || "",
        class: member.class || "",
        username: member.username || "",
        password: "",
        email: member.email || "",
        phone: member.phone || "",
        status: member.status || "active",
      });
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
    
    // 1. Nama Lengkap -> letters only
    if (name === "nama_lengkap") {
      const filteredValue = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
      return;
    }
    
    // 2. NIS -> numbers only
    if (name === "nis") {
      const filteredValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
      return;
    }
    
    // 4. No. Telepon -> numbers only
    if (name === "phone") {
      const filteredValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
      return;
    }
    
    // 5. Username -> max 8 chars
    if (name === "username") {
      if (value.length > 8) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_lengkap) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nama lengkap harus diisi",
      });
      return;
    }

    setIsSubmitting(true);

    // Format Nama Lengkap to Title Case
    const formattedName = formData.nama_lengkap
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const memberData = {
      nama_lengkap: formattedName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      nis: formData.nis || undefined,
      class: formData.class || undefined,
    };

    let result;
    if (selectedMember) {
      // Update — include username and password only if provided
      if (formData.username) memberData.username = formData.username;
      if (formData.password) memberData.password = formData.password;
      result = await updateMember(selectedMember.id, memberData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Data anggota berhasil diperbarui" });
      }
    } else {
      // Create — username and password required
      if (!formData.username || !formData.password) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Username dan password harus diisi untuk anggota baru",
        });
        setIsSubmitting(false);
        return;
      }
      memberData.username = formData.username;
      memberData.password = formData.password;
      memberData.role = "user";
      result = await addMember(memberData);
      if (result.success) {
        toast({ title: "Berhasil", description: "Anggota baru berhasil ditambahkan" });
      }
    }

    if (!result.success) {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }

    setIsSubmitting(false);
    if (result.success) {
      loadMembers();
      handleCloseDialog();
    }
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    const result = await deleteMember(selectedMember.id);
    if (result.success) {
      toast({ title: "Berhasil", description: "Anggota berhasil dihapus" });
      loadMembers();
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }
    setIsSubmitting(false);
    setIsDeleteDialogOpen(false);
    setSelectedMember(null);
  };

  const handleDownloadTemplate = () => {
    const headers = "username;nama_lengkap;nis;class;email;phone;password";
    const exampleData = "siswa1;Siswa Satu;12345;X-RPL;siswa1@mail.com;0812345678;password123";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + exampleData;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_anggota.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      // Strip UTF-8 BOM if present and split headers
      const headers = lines[0].replace(/^\uFEFF/, "").split(";").map(h => h.trim());
      
      const users = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(";").map(v => v.trim());
        const user = {};
        headers.forEach((header, index) => {
          user[header] = values[index];
        });
        return user;
      });

      const result = await bulkAddMembers(users);
      if (result.success) {
        toast({ 
          title: "Berhasil", 
          description: result.message 
        });
        loadMembers();
        setIsImportDialogOpen(false);
        setImportFile(null);
      } else {
        toast({ 
          variant: "destructive", 
          title: "Gagal", 
          description: result.message 
        });
      }
      setIsSubmitting(false);
    };
    reader.readAsText(importFile);
  };

  const handleToggleStatus = async (member) => {
    if (member.id === currentUser?.id) {
      toast({ 
        variant: "destructive", 
        title: "Aksi Ditolak", 
        description: "Anda tidak dapat menonaktifkan akun Anda sendiri." 
      });
      return;
    }
    const newStatus = member.status === "active" ? "inactive" : "active";
    const result = await updateMember(member.id, { status: newStatus });
    if (result.success) {
      toast({ title: "Berhasil", description: `Akun ${member.nama_lengkap} sekarang ${newStatus === "active" ? "aktif" : "non-aktif"}` });
      loadMembers();
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kelola Anggota</h1>
          <p className="text-muted-foreground">
            Kelola data anggota perpustakaan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Anggota
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIS, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map((kelas) => (
                    <SelectItem key={kelas} value={kelas}>
                      {kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Non-aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                      <TableHead className="hidden md:table-cell">NIS</TableHead>
                      <TableHead className="hidden lg:table-cell">Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground">Tidak ada anggota ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted border sm:block hidden">
                                {member.foto ? (
                                  <img
                                    src={getPhotoUrl(member.foto)}
                                    alt={member.nama_lengkap}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center p-2">
                                    <User className="h-full w-full text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{member.nama_lengkap}</p>
                                <p className="text-xs text-muted-foreground md:hidden">
                                  {member.nis || "-"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                              {member.nis || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {member.class || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.status === "active"}
                                onCheckedChange={() => handleToggleStatus(member)}
                              />
                              <Badge variant={member.status === "active" ? "success" : "destructive"} className="text-[10px] py-0">
                                {member.status === "active" ? "Aktif" : "Non-aktif"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(member)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(member)}
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
                Menampilkan {paginatedMembers.length} dari {totalItems} anggota
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Tambah/Edit Anggota */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? "Edit Anggota" : "Tambah Anggota Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedMember
                ? "Perbarui informasi anggota di bawah ini"
                : "Isi informasi anggota baru di bawah ini"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                <Input
                  id="nama_lengkap"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  name="nis"
                  value={formData.nis}
                  onChange={handleChange}
                  placeholder="Nomor Induk Siswa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Select
                  value={formData.class}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, class: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasOptions.map((kelas) => (
                      <SelectItem key={kelas} value={kelas}>
                        {kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status Akun</Label>
                <Select
                  value={formData.status}
                  disabled={selectedMember?.id === currentUser?.id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Non-aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contoh@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telepon</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username {!selectedMember && "*"}
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username untuk login"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {!selectedMember && "*"}
                  {selectedMember && " (kosongkan jika tidak diubah)"}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={selectedMember ? "••••••••" : "Buat password"}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedMember ? "Simpan Perubahan" : "Tambah Anggota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Import CSV */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Anggota dari CSV</DialogTitle>
            <DialogDescription>
              Upload file CSV untuk menambahkan banyak anggota sekaligus.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csv_file">Pilih File CSV</Label>
              <Input
                id="csv_file"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Gunakan format (Pemisah Titik Koma): username; nama_lengkap; nis; class; email; phone; password
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-1 h-3 w-3" />
                Download Template CSV
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={!importFile || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Sekarang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus anggota "{selectedMember?.nama_lengkap}"?
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
    </div>
  );
};

export default AdminMembers;
