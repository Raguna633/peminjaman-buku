import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LibraryProvider } from "./context/LibraryContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBooks from "./pages/admin/AdminBooks";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import UserSearch from "./pages/user/UserSearch";
import UserBorrow from "./pages/user/UserBorrow";
import UserReturn from "./pages/user/UserReturn";
import UserHistory from "./pages/user/UserHistory";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <LibraryProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/books" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminBooks /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminCategories /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/members" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminMembers /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminTransactions /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminReports /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminSettings /></DashboardLayout></ProtectedRoute>} />

                {/* User Routes */}
                <Route path="/user" element={<ProtectedRoute allowedRoles={["user"]}><DashboardLayout><UserDashboard /></DashboardLayout></ProtectedRoute>} />
                <Route path="/user/search" element={<ProtectedRoute allowedRoles={["user"]}><DashboardLayout><UserSearch /></DashboardLayout></ProtectedRoute>} />
                <Route path="/user/borrow" element={<ProtectedRoute allowedRoles={["user"]}><DashboardLayout><UserBorrow /></DashboardLayout></ProtectedRoute>} />
                <Route path="/user/return" element={<ProtectedRoute allowedRoles={["user"]}><DashboardLayout><UserReturn /></DashboardLayout></ProtectedRoute>} />
                <Route path="/user/history" element={<ProtectedRoute allowedRoles={["user"]}><DashboardLayout><UserHistory /></DashboardLayout></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LibraryProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
