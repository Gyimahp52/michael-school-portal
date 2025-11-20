import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/HybridAuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy load components for faster initial page load
const MainLayout = lazy(() => import("./components/layout/MainLayout").then(m => ({ default: m.MainLayout })));
const AdminDashboard = lazy(() => import("./components/dashboard/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const TeacherDashboard = lazy(() => import("./components/dashboard/TeacherDashboard").then(m => ({ default: m.TeacherDashboard })));
const AccountantDashboard = lazy(() => import("./components/dashboard/AccountantDashboard").then(m => ({ default: m.AccountantDashboard })));
const StudentsPage = lazy(() => import("./pages/StudentsPage").then(m => ({ default: m.StudentsPage })));
const StudentProfilePage = lazy(() => import("./pages/StudentProfilePage").then(m => ({ default: m.StudentProfilePage })));
const BillingPage = lazy(() => import("./pages/BillingPage").then(m => ({ default: m.BillingPage })));
const GradesPage = lazy(() => import("./pages/GradesPage").then(m => ({ default: m.GradesPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const AcademicsPage = lazy(() => import("./pages/AcademicsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SchoolFeesPage = lazy(() => import("./pages/SchoolFeesPage"));
const AcademicTermsPage = lazy(() => import("./pages/AcademicTermsPage"));
const ClassAssignmentsPage = lazy(() => import("./pages/ClassAssignmentsPage").then(m => ({ default: m.ClassAssignmentsPage })));
const TeacherClassStudentsPage = lazy(() => import("./pages/TeacherClassStudentsPage").then(m => ({ default: m.TeacherClassStudentsPage })));
const NotFound = lazy(() => import("./pages/NotFound"));
const ReportCardPrintPage = lazy(() => import("./pages/ReportCardPrintPage"));
const PromotionsPage = lazy(() => import("./pages/PromotionsPage"));
const CanteenPage = lazy(() => import("./pages/CanteenPage"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));
const SetupPage = lazy(() => import("./pages/SetupPage").then(m => ({ default: m.SetupPage })));

const queryClient = new QueryClient();

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AppContent = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
      {/* Public Routes */}
      <Route path="/setup" element={<SetupPage />} />
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
          <Route path="audit-log" element={<AuditLogPage />} />
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
    </Suspense>
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
