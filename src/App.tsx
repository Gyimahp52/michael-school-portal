import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AdminDashboard } from "./components/dashboard/AdminDashboard";
import { StudentsPage } from "./pages/StudentsPage";
import { BillingPage } from "./pages/BillingPage";
import { GradesPage } from "./pages/GradesPage";
import { LoginPage } from "./pages/LoginPage";
import AdmissionsPage from "./pages/AdmissionsPage";
import AcademicsPage from "./pages/AcademicsPage";
import ReportsPage from "./pages/ReportsPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<MainLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="classes" element={<AcademicsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="teachers" element={<div className="p-6">Teachers page coming soon...</div>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
