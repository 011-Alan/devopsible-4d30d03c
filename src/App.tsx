import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GitPath from "./pages/GitPath";
import GitCourse from "./pages/GitCourse";
import JenkinsPath from "./pages/JenkinsPath";
import JenkinsLabPage from "./pages/JenkinsLabPage";
import DockerPath from "./pages/DockerPath";
import DockerLabPage from "./pages/DockerLabPage";
import KubernetesPath from "./pages/KubernetesPath";
import KubernetesLabPage from "./pages/KubernetesLabPage";
import ProgressPage from "./pages/ProgressPage";
import ToolPage from "./pages/ToolPage";
import BugCreate from "./pages/BugCreate";
import BugDetail from "./pages/BugDetail";
import BugList from "./pages/BugList";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Dashboard & Overview */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/progress" element={<ProgressPage />} />

              {/* 1. Git Workflow */}
              <Route path="/learn/git" element={<GitPath />} />
              <Route path="/learn/git/course" element={<GitCourse />} />
              <Route path="/learn/git/lab/:levelId" element={<GitCourse />} />

              {/* 2. Jenkins Factory */}
              <Route path="/learn/jenkins" element={<JenkinsPath />} />
              <Route path="/learn/jenkins/lab/:levelId" element={<JenkinsLabPage />} />

              {/* 3. Docker Quest */}
              <Route path="/learn/docker" element={<DockerPath />} />
              <Route path="/learn/docker/:levelId" element={<DockerLabPage />} />
              <Route path="/learn/docker/lab/:levelId" element={<DockerLabPage />} />

              {/* 4. Kubernetes Kingdom */}
              <Route path="/learn/kubernetes" element={<KubernetesPath />} />
              <Route path="/learn/kubernetes/:levelId" element={<KubernetesLabPage />} />
              <Route path="/learn/kubernetes/lab/:levelId" element={<KubernetesLabPage />} />

              {/* Reference Documentation */}
              <Route path="/learn/:slug" element={<ToolPage />} />

              {/* Auth and Support */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

              {/* Secondary bugtracker routes */}
              <Route path="/overview" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/bugs" element={<ProtectedRoute><BugList /></ProtectedRoute>} />
              <Route path="/bugs/new" element={<ProtectedRoute><BugCreate /></ProtectedRoute>} />
              <Route path="/bugs/:id" element={<ProtectedRoute><BugDetail /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
