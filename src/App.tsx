import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import ThrowPaper from "@/pages/ThrowPaper";
import SearchPaper from "@/pages/SearchPaper";
import PaperDetail from "@/pages/PaperDetail";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Test from "@/pages/Test";
import BottomNav from "@/components/BottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <div className="App">
        <div className="pb-20"> {/* 为底部导航栏留出空间 */}
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="/throw" element={
              <ProtectedRoute>
                <ThrowPaper />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <SearchPaper />
              </ProtectedRoute>
            } />
            <Route path="/paper/:id" element={
              <ProtectedRoute>
                <PaperDetail />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/test" element={
              <ProtectedRoute>
                <Test />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        
        {/* 底部导航栏 */}
        <BottomNav />
        
        {/* Toast 通知组件 */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
            },
          }}
        />
      </div>
    </Router>
  );
}
