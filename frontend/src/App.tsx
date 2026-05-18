import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useResponsive } from './hooks/useResponsive';
import { DesktopLayout, PhoneLayout } from './components/Layout';
import Home from './features/home';
import EntryDetail from './features/entry/components/EntryDetail';
import SearchPage from './features/search/components/SearchPage';
import LoginPage from './features/admin/Login/LoginPage';
import DashboardLayout from './features/admin/Dashboard/DashboardLayout';
import Dashboard from './features/admin/Dashboard';
import EntryManager from './features/admin/EntryManager';
import EditorPage from './features/editor/components/EditorPage';
import { getToken } from './services/auth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!getToken()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const { isMobile } = useResponsive();

  return (
    <BrowserRouter>
      <Routes>
        {isMobile ? (
          <>
            <Route path="/" element={<PhoneLayout />}>
              <Route index element={<Home />} />
              <Route path="entry/:id" element={<EntryDetail />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="entries" element={<EntryManager />} />
              <Route path="editor" element={<EditorPage />} />
              <Route path="editor/:id" element={<EditorPage />} />
            </Route>
          </>
        ) : (
          <>
            <Route path="*" element={<DesktopLayout />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="entries" element={<EntryManager />} />
              <Route path="editor" element={<EditorPage />} />
              <Route path="editor/:id" element={<EditorPage />} />
            </Route>
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;