import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { StudentLayout } from "@/components/layout/student-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/home";
import { Login } from "@/pages/login";
import { Register } from "@/pages/register";
import { AdminLogin } from "@/pages/admin-login";

import { StudentDashboard } from "@/pages/student/dashboard";
import { CourseCatalog } from "@/pages/student/courses";
import { CourseDetail } from "@/pages/student/course-detail";
import { StudentEnrollments } from "@/pages/student/enrollments";
import { StudentWaitlist } from "@/pages/student/waitlist";
import { StudentNotifications } from "@/pages/student/notifications";
import { StudentProfile } from "@/pages/student/profile";
import { StudentFeedback } from "@/pages/student/feedback";

import { AdminDashboard } from "@/pages/admin/dashboard";
import { AdminStudents } from "@/pages/admin/students";
import { AdminStudentDetail } from "@/pages/admin/student-detail";
import { AdminCourses } from "@/pages/admin/courses";
import { AdminCourseForm } from "@/pages/admin/course-form";
import { AdminEnrollments } from "@/pages/admin/enrollments";
import { AdminActivity } from "@/pages/admin/activity";
import { AdminFeedback } from "@/pages/admin/feedback";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin/login" component={AdminLogin} />

      {/* Student Routes */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout><StudentDashboard /></StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/courses">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout><CourseCatalog /></StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/courses/:id">
        {(params) => (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout><CourseDetail params={params} /></StudentLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/enrollments">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout><StudentEnrollments /></StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/waitlist">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout><StudentWaitlist /></StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout><StudentNotifications /></StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout><StudentProfile /></StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/feedback">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout><StudentFeedback /></StudentLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout><AdminStudents /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students/:id">
        {(params) => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminStudentDetail params={params} /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout><AdminCourses /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses/new">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout><AdminCourseForm /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/courses/:id/edit">
        {(params) => (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout><AdminCourseForm params={params} /></AdminLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/enrollments">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout><AdminEnrollments /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/activity">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout><AdminActivity /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/feedback">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout><AdminFeedback /></AdminLayout>
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
