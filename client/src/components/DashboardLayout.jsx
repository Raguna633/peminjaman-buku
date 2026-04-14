import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useLibrary } from "../context/LibraryContext";
import NotificationInbox from "./NotificationInbox";
import UserPendingModal from "./UserPendingModal";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Home,
  BookPlus,
  Users,
  ArrowLeftRight,
  FileText,
  Search,
  History,
  BookCheck,
  LogOut,
  Menu,
  Settings,
  Tag,
  Shield,
  Keyboard,
} from "lucide-react";

const adminMenuItems = [
  { title: "Beranda", url: "/admin", icon: Home },
  { title: "Kelola Buku", url: "/admin/books", icon: BookOpen },
  { title: "Kelola Kategori", url: "/admin/categories", icon: Tag },
  { title: "Kelola Anggota", url: "/admin/members", icon: Users },
  { title: "Transaksi", url: "/admin/transactions", icon: ArrowLeftRight },
  { title: "Laporan", url: "/admin/reports", icon: FileText },
  { title: "Pengaturan", url: "/admin/settings", icon: Settings },
];

const userMenuItems = [
  { title: "Beranda", url: "/user", icon: Home },
  { title: "Cari Buku", url: "/user/search", icon: Search },
  { title: "Pinjam Buku", url: "/user/borrow", icon: BookPlus },
  { title: "Pengembalian", url: "/user/return", icon: BookCheck },
  { title: "Riwayat", url: "/user/history", icon: History },
];

const SidebarNav = ({ isAdmin }) => {
  const location = useLocation();
  const { pendingCounts } = useSocket();
  const { transactions } = useLibrary();
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <SidebarMenu>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.url;
        
        let showBadge = false;
        let badgeCount = 0;

        if (isAdmin && item.url === "/admin/transactions" && pendingCounts.total > 0) {
          showBadge = true;
          badgeCount = pendingCounts.total;
        }

        if (!isAdmin && item.url === "/user/return") {
          const overdueCount = transactions.filter(t => t.status === "overdue").length;
          if (overdueCount > 0) {
            showBadge = true;
            badgeCount = overdueCount;
          }
        }

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link to={item.url} className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.title}</span>
                {showBadge && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {badgeCount}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

const AppSidebar = () => {
  const { user, logout, updateUser } = useAuth();
  const { toggleDutyStatus } = useLibrary();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDutyToggle = async () => {
    const result = await toggleDutyStatus();
    if (result.success) {
      updateUser({ is_on_duty: result.data.is_on_duty });
      toast({
        title: result.data.is_on_duty ? "🟢 Sedang Berjaga" : "🔴 Selesai Berjaga",
        description: result.data.is_on_duty
          ? "Anda sekarang menerima request dari siswa"
          : "Siswa tidak dapat mengirim request saat ini",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: result.message,
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link to={isAdmin ? "/admin" : "/user"} className="flex items-center gap-3">
          <div className="rounded-lg bg-sidebar-primary p-2">
            <BookOpen className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Perpustakaan</h1>
            <p className="text-xs text-sidebar-foreground/70">Sekolah Digital</p>
          </div>
        </Link>
      </SidebarHeader>

      <Separator className="bg-sidebar-border" />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Menu {isAdmin ? "Admin" : "Siswa"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNav isAdmin={isAdmin} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="bg-sidebar-border mb-4" />

        {/* Admin Duty Toggle */}
        {isAdmin && (
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sidebar-foreground/70" />
              <span className="text-xs text-sidebar-foreground/70">Status Berjaga</span>
            </div>
            <Switch
              checked={user?.is_on_duty || false}
              onCheckedChange={handleDutyToggle}
            />
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {getInitials(user?.nama_lengkap)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.nama_lengkap || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {isAdmin ? "Administrator" : user?.class || user?.nis || "Anggota"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { on } = useSocket();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Listen for admin real-time notifications
  useEffect(() => {
    if (!isAdmin || !on) return;

    const showRequestToast = (title, description) => {
      toast({
        title,
        description,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin/transactions")}
          >
            Lihat
          </Button>
        ),
      });
    };

    const unsubBorrow = on("peminjaman:request", (data) => {
      showRequestToast(
        "📚 Permohonan Peminjaman",
        `${data.siswa.nama} ingin meminjam "${data.buku.judul}"`
      );
    });

    const unsubReturn = on("pengembalian:request", (data) => {
      showRequestToast(
        "🔄 Permohonan Pengembalian",
        `${data.siswa.nama} ingin mengembalikan "${data.buku.judul}"`
      );
    });

    const unsubExtend = on("perpanjangan:request", (data) => {
      showRequestToast(
        "📅 Permohonan Perpanjangan",
        `${data.siswa.nama} mengajukan perpanjangan "${data.buku.judul}"`
      );
    });

    return () => {
      unsubBorrow();
      unsubReturn();
      unsubExtend();
    };
  }, [isAdmin, on, toast, navigate]);

  // Keyboard Shortcuts for Admin
  useEffect(() => {
    if (!isAdmin) return;

    const handleKeyDown = (e) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "1": e.preventDefault(); navigate("/admin"); break;
          case "2": e.preventDefault(); navigate("/admin/books"); break;
          case "3": e.preventDefault(); navigate("/admin/transactions"); break;
          case "4": e.preventDefault(); navigate("/admin/members"); break;
          case "5": e.preventDefault(); navigate("/admin/settings"); break;
          case "n": e.preventDefault(); window.dispatchEvent(new CustomEvent("toggle-notifications")); break;
          case "h": e.preventDefault(); setShowShortcutHelp((prev) => !prev); break;
          case "q": e.preventDefault(); if (confirm("Apakah Anda yakin ingin logout?")) logout(); break;
          default: break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin, navigate, logout]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center px-4 gap-4 sticky top-0 z-20">
          <SidebarTrigger />
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => setShowShortcutHelp(true)} title="Shortcut Keyboard (Alt+H)">
            <Keyboard className="h-4 w-4" />
          </Button>
          <NotificationInbox />
        </header>
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="p-4 md:p-6 w-full max-w-full">
            {children}
            <UserPendingModal />
          </div>
        </div>
      </SidebarInset>

      <Dialog open={showShortcutHelp} onOpenChange={setShowShortcutHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Shortcut Keyboard Admin
            </DialogTitle>
            <DialogDescription>Gunakan kombinasi tombol berikut untuk mempercepat pengoperasian aplikasi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigasi</h4>
                {["Dashboard", "Kelola Buku", "Transaksi", "Anggota", "Pengaturan"].map((item, i) => (
                  <div key={item} className="flex justify-between items-center text-sm">
                    <span>{item}</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Alt + {i + 1}</kbd>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</h4>
                <div className="flex justify-between items-center text-sm"><span>Notifikasi</span><kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Alt + N</kbd></div>
                <div className="flex justify-between items-center text-sm"><span>Bantuan</span><kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Alt + H</kbd></div>
                <div className="flex justify-between items-center text-sm"><span>Logout</span><kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Alt + Q</kbd></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default DashboardLayout;
