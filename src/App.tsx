import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AdminDashboard } from "./components/dashboard/AdminDashboard";
import { TeacherDashboard } from "./components/dashboard/TeacherDashboard";
import { AccountantDashboard } from "./components/dashboard/AccountantDashboard";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { BillingPage } from "./pages/BillingPage";
import { GradesPage } from "./pages/GradesPage";
import { LoginPage } from "./pages/LoginPage";
import AcademicsPage from "./pages/AcademicsPage";
import ReportsPage from "./pages/ReportsPage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import SchoolFeesPage from "./pages/SchoolFeesPage";
import AcademicTermsPage from "./pages/AcademicTermsPage";
import { ClassAssignmentsPage } from "./pages/ClassAssignmentsPage";
import { TeacherClassStudentsPage } from "./pages/TeacherClassStudentsPage";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/OfflineAuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ReportCardPrintPage from "./pages/ReportCardPrintPage";
import PromotionsPage from "./pages/PromotionsPage";
import { useEffect } from "react";
import CanteenPage from "./pages/CanteenPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        currentUser ? (
          userRole === 'admin' ? <Navigate to="/admin" replace /> :
          userRole === 'teacher' ? <Navigate to="/teacher" replace /> :
          userRole === 'accountant' ? <Navigate to="/accountant" replace /> :
          <Navigate to="/" replace />
        ) : (
          <LoginPage />
        )
      } />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<MainLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:studentId" element={<StudentProfilePage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="canteen" element={<CanteenPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="grades/print/:classId" element={<ReportCardPrintPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          {/* Admissions route removed */}
          <Route path="classes" element={<AcademicsPage />} />
          <Route path="class-assignments" element={<ClassAssignmentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="school-fees" element={<SchoolFeesPage />} />
          <Route path="terms" element={<AcademicTermsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route path="/teacher" element={<MainLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:studentId" element={<StudentProfilePage />} />
          <Route path="class/:classId" element={<TeacherClassStudentsPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
        <Route path="/accountant" element={<MainLayout />}>
          <Route index element={<AccountantDashboard />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="terms" element={<AcademicTermsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Redirect root to login or appropriate dashboard */}
      <Route 
        path="/" 
        element={
          !currentUser ? (
            <Navigate to="/login" replace />
          ) : userRole === 'admin' ? (
            <Navigate to="/admin" replace />
          ) : userRole === 'teacher' ? (
            <Navigate to="/teacher" replace />
          ) : userRole === 'accountant' ? (
            <Navigate to="/accountant" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
