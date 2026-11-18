import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SearchResultPage from './pages/SearchResultPage';
import StoryPage from './pages/StoryPage';
import StoryChapterPage from './pages/StoryChapterPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const location = useLocation();
  const hideHeader = false;
  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/s" element={<SearchResultPage />} />
        <Route path="/mainstory" element={<StoryPage />} />
        <Route path="/pastevent" element={<StoryPage />} />
        <Route path="/mainstory/:chapterSlug" element={<StoryChapterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
