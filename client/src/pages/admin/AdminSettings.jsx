import { useState, useEffect } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminSettings = () => {
  const { settings, fetchSettings, updateSettings } = useLibrary();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    max_borrow_limit: 3,
    borrow_duration_days: 7,
    allow_extension: true,
    max_extensions: 1,
    max_denda_amount: 50000,
    denda_type: "per_day",
    denda_per_day_amount: 1000,
    denda_flat_amount: 5000,
    denda_kerusakan_ringan: 5000,
    denda_kerusakan_sedang: 10000,
    denda_kerusakan_parah: 15000,
    denda_hilang: 50000,
    reminder_days_before_due: 2,
    shelf_locations: [],
    kelas_list: [],
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchSettings();
      setIsLoading(false);
    };
    load();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        max_borrow_limit: settings.max_borrow_limit ?? 3,
        borrow_duration_days: settings.borrow_duration_days ?? 7,
        allow_extension: settings.allow_extension ?? true,
        max_extensions: settings.max_extensions ?? 1,
        max_denda_amount: settings.max_denda_amount ?? 50000,
        denda_type: settings.denda_type ?? "per_day",
        denda_per_day_amount: settings.denda_per_day_amount ?? 1000,
        denda_flat_amount: settings.denda_flat_amount ?? 5000,
        denda_kerusakan_ringan: settings.denda_kerusakan_ringan ?? 5000,
        denda_kerusakan_sedang: settings.denda_kerusakan_sedang ?? 10000,
        denda_kerusakan_parah: settings.denda_kerusakan_parah ?? 15000,
        denda_hilang: settings.denda_hilang ?? 50000,
        reminder_days_before_due: settings.reminder_days_before_due ?? 2,
        shelf_locations: settings.shelf_locations ?? [],
        kelas_list: settings.kelas_list ?? [],
      });
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const result = await updateSettings(formData);
    if (result.success) {
      toast({ title: "Berhasil", description: "Pengaturan berhasil disimpan" });
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.message });
    }
    setIsSaving(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Pengaturan Sistem
        </h1>
        <p className="text-muted-foreground">
          Kelola pengaturan perpustakaan digital
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Floating Save Button */}
        <div className="fixed bottom-6 right-6 md:bottom-auto md:top-[84px] md:right-10 z-[100] group pointer-events-none animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-500">
          <div className="pointer-events-auto">
            <Button 
              type="submit" 
              disabled={isSaving} 
              size="lg"
              className={cn(
                "shadow-2xl hover:scale-105 transition-all duration-300 bg-primary/95 hover:bg-primary backdrop-blur-sm border-2 border-primary/10 h-14 rounded-2xl ring-offset-background",
                "w-14 px-0 md:w-auto md:px-8" // FAB style on mobile, labeled on desktop
              )}
            >
              {isSaving ? (
                <Loader2 className={cn("h-5 w-5 animate-spin", !isSaving && "md:mr-2")} />
              ) : (
                <Save className={cn("h-5 w-5 group-hover:rotate-12 transition-transform duration-300", "md:mr-2")} />
              )}
              <span className="hidden md:inline">
                {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
              </span>
            </Button>
          </div>
        </div>

        {/* Peminjaman Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Peminjaman</CardTitle>
            <CardDescription>Atur batas peminjaman dan durasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maksimal Buku Dipinjam</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.max_borrow_limit}
                  onChange={(e) => handleChange("max_borrow_limit", parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">Per siswa</p>
              </div>
              <div className="space-y-2">
                <Label>Durasi Peminjaman (hari)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.borrow_duration_days}
                  onChange={(e) => handleChange("borrow_duration_days", parseInt(e.target.value) || 7)}
                />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Izinkan Perpanjangan</Label>
                  <p className="text-xs text-muted-foreground">
                    Siswa dapat request perpanjangan
                  </p>
                </div>
                <Switch
                  checked={formData.allow_extension}
                  onCheckedChange={(checked) => handleChange("allow_extension", checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>Maksimal Perpanjangan</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  value={formData.max_extensions}
                  onChange={(e) => handleChange("max_extensions", parseInt(e.target.value) || 0)}
                  disabled={!formData.allow_extension}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Denda Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Denda Keterlambatan</CardTitle>
            <CardDescription>Konfigurasi denda dan batas nya</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Denda</Label>
                <Select
                  value={formData.denda_type}
                  onValueChange={(value) => handleChange("denda_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_day">Per Hari</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.denda_type === "per_day"
                    ? "Denda Per Hari"
                    : "Denda Flat"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={
                    formData.denda_type === "per_day"
                      ? formData.denda_per_day_amount
                      : formData.denda_flat_amount
                  }
                  onChange={(e) =>
                    handleChange(
                      formData.denda_type === "per_day"
                        ? "denda_per_day_amount"
                        : "denda_flat_amount",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formData.denda_type === "per_day"
                    ? `Saat ini: ${formatCurrency(formData.denda_per_day_amount)} /hari`
                    : `Saat ini: ${formatCurrency(formData.denda_flat_amount)}`}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Batas Maksimal Denda</Label>
              <Input
                type="number"
                min={0}
                value={formData.max_denda_amount}
                onChange={(e) => handleChange("max_denda_amount", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {formData.max_denda_amount > 0
                  ? `Maks: ${formatCurrency(formData.max_denda_amount)}`
                  : "0 = tidak ada batas"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Denda Kerusakan */}
        <Card>
          <CardHeader>
            <CardTitle>Denda Kerusakan & Kehilangan</CardTitle>
            <CardDescription>Nominal denda berdasarkan kondisi buku</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rusak Ringan</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.denda_kerusakan_ringan}
                  onChange={(e) => handleChange("denda_kerusakan_ringan", parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">{formatCurrency(formData.denda_kerusakan_ringan)}</p>
              </div>
              <div className="space-y-2">
                <Label>Rusak Sedang</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.denda_kerusakan_sedang}
                  onChange={(e) => handleChange("denda_kerusakan_sedang", parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">{formatCurrency(formData.denda_kerusakan_sedang)}</p>
              </div>
              <div className="space-y-2">
                <Label>Rusak Parah</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.denda_kerusakan_parah}
                  onChange={(e) => handleChange("denda_kerusakan_parah", parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">{formatCurrency(formData.denda_kerusakan_parah)}</p>
              </div>
              <div className="space-y-2">
                <Label>Buku Hilang</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.denda_hilang}
                  onChange={(e) => handleChange("denda_hilang", parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">{formatCurrency(formData.denda_hilang)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rak Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Lokasi Rak Buku</CardTitle>
            <CardDescription>Daftar lokasi rak yang tersedia untuk penempatan buku</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Tambah lokasi rak baru (contoh: Rak A1)"
                id="new-shelf"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.target.value.trim();
                    if (val && !formData.shelf_locations.includes(val)) {
                      handleChange("shelf_locations", [...formData.shelf_locations, val]);
                      e.target.value = "";
                    }
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => {
                  const input = document.getElementById("new-shelf");
                  const val = input.value.trim();
                  if (val && !formData.shelf_locations.includes(val)) {
                    handleChange("shelf_locations", [...formData.shelf_locations, val]);
                    input.value = "";
                  }
                }}
              >
                Tambah
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.shelf_locations.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Belum ada lokasi rak yang diatur.</p>
              ) : (
                formData.shelf_locations.map((shelf, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    {shelf}
                    <button
                      type="button"
                      onClick={() => {
                        const newShelves = formData.shelf_locations.filter((_, i) => i !== index);
                        handleChange("shelf_locations", newShelves);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifikasi */}
        <Card>
          <CardHeader>
            <CardTitle>Notifikasi</CardTitle>
            <CardDescription>Pengaturan pengingat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Pengingat Sebelum Jatuh Tempo (hari)</Label>
              <Input
                type="number"
                min={0}
                max={7}
                value={formData.reminder_days_before_due}
                onChange={(e) => handleChange("reminder_days_before_due", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Siswa akan dikirimi notifikasi pengingat H-{formData.reminder_days_before_due}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Daftar Kelas */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kelas</CardTitle>
            <CardDescription>Kelola daftar kelas yang tersedia untuk anggota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Tambah kelas baru (contoh: X-RPL)"
                id="new-kelas"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.target.value.trim().toUpperCase();
                    if (val && !formData.kelas_list.includes(val)) {
                      handleChange("kelas_list", [...formData.kelas_list, val]);
                      e.target.value = "";
                    }
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => {
                  const input = document.getElementById("new-kelas");
                  const val = input.value.trim().toUpperCase();
                  if (val && !formData.kelas_list.includes(val)) {
                    handleChange("kelas_list", [...formData.kelas_list, val]);
                    input.value = "";
                  }
                }}
              >
                Tambah
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.kelas_list && formData.kelas_list.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Belum ada daftar kelas yang diatur.</p>
              ) : (
                formData.kelas_list?.map((kelas, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    {kelas}
                    <button
                      type="button"
                      onClick={() => {
                        const newKelas = formData.kelas_list.filter((_, i) => i !== index);
                        handleChange("kelas_list", newKelas);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </form>
    </div>
  );
};

export default AdminSettings;
