import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ListPage from './pages/ListPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import InvitePage from './pages/InvitePage';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import HomePageMockup from './pages/mockups/HomePageMockup';
import ListPageMockup from './pages/mockups/ListPageMockup';
import HeaderMockup from './pages/mockups/HeaderMockup';
import ReadOnlyListMockup from './pages/mockups/ReadOnlyListMockup';
import ReminderMockup from './pages/mockups/ReminderMockup';
import SettingsMockup from './pages/mockups/SettingsMockup';
import MobileTabMockup from './pages/mockups/MobileTabMockup';
import MockupHub from './pages/mockups/MockupHub';
import ReadOnlyListPage from './pages/ReadOnlyListPage';
import SettingsPage from './pages/SettingsPage';
import RecurringListPage from './pages/RecurringListPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/readonly/:token" element={<ReadOnlyListPage />} />
      {/* モックアップ確認用（確認後削除） */}
      <Route path="/mockup/home" element={<HomePageMockup />} />
      <Route path="/mockup/list" element={<ListPageMockup />} />
      <Route path="/mockup/header" element={<HeaderMockup />} />
      <Route path="/mockup/readonly" element={<ReadOnlyListMockup />} />
      <Route path="/mockup/recurring" element={<ReminderMockup />} />
      <Route path="/mockup/settings" element={<SettingsMockup />} />
      <Route path="/mockup/mobile-tab" element={<MobileTabMockup />} />
      <Route path="/mockup" element={<MockupHub />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="lists/:id" element={<ListPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="invite/:code" element={<InvitePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="recurring" element={<RecurringListPage />} />
      </Route>
    </Routes>
  );
}

export default App;
