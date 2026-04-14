import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Eye, EyeOff, Phone } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    nis: "",
    class: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const kelasOptions = [
    "X-A", "X-B", "X-C", "X-D",
    "XI-A", "XI-B", "XI-C", "XI-D",
    "XII-A", "XII-B", "XII-C", "XII-D",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi
    if (!formData.fullName.trimStart().trimEnd() || !formData.nis.trim() || !formData.class ||
      !formData.username.trim() || !formData.password.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Semua field harus diisi",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password dan konfirmasi password tidak sama",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password minimal 6 karakter",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        fullName: formData.fullName,
        nis: formData.nis,
        class: formData.class,
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
      });

      if (result.success === true) {
        toast({
          title: "Berhasil",
          description: result.message,
        });
        navigate("/login");
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Registrasi",
          description: result.message,
        });
      }
    }
    catch (error) {
      console.log("error: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat register",
      });
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 md:p-6 py-8">
      <Card className="w-full max-w-md shadow-lg border-none md:border sm:rounded-none md:rounded-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary p-3">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Daftar Anggota</CardTitle>
            <CardDescription className="text-base mt-2">
              Daftar sebagai anggota perpustakaan sekolah
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  name="nis"
                  type="text"
                  placeholder="Nomor Induk Siswa"
                  value={formData.nis}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas</Label>
                <Select
                  value={formData.class}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, class: value }))}
                  disabled={isLoading}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Opsional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contoh@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Whatsapp (Wajib)</Label>
              <Input
                id="phone"
                name="phone"
                type="phone"
                placeholder="08987654321"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Buat username"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat password (min. 6 karakter)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Daftar"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Masuk disini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
