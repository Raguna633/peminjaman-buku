import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username dan password harus diisi",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success === true) {
        toast({
          title: "Berhasil",
          description: `Selamat datang, ${result.user.username}!`,
        });
        
        // Redirect berdasarkan role jika ada
        if (result.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/user");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Login",
          description: result.message,
        });
      }
    } catch (error) {
      console.log("error: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 md:p-6">
      <Card className="w-full max-w-md shadow-lg border-none md:border sm:rounded-none md:rounded-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary p-3">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Perpustakaan Digital</CardTitle>
            <CardDescription className="text-base mt-2">
              Masuk ke akun Anda untuk mengakses layanan perpustakaan
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-2">Akun Demo:</p>
              <p><span className="text-muted-foreground">Admin:</span> admin / admin123</p>
              <p><span className="text-muted-foreground">User:</span> siswa1 / siswa123</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Daftar disini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
