import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useResponsive } from './hooks/useResponsive';
import { DesktopLayout, PhoneLayout } from './components/Layout';
import Home from './features/home';
import EntryDetail from './features/entry/components/EntryDetail';
import SearchPage from './features/search/components/SearchPage';
import LoginPage from './features/admin/Login/LoginPage';
import DashboardPage from './features/admin/Dashboard/DashboardPage';

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
            <Route path="/admin/*" element={<DashboardPage />} />
          </>
        ) : (
          <>
            <Route path="/" element={<DesktopLayout />}>
              <Route index element={<Home />} />
              <Route path="entry/:id" element={<EntryDetail />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/*" element={<DashboardPage />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
