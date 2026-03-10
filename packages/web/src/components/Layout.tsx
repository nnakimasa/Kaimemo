import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Kaimemo
          </Link>
          <nav className="flex items-center gap-4">
            {user && (
              <span className="text-sm opacity-90">{user.displayName}</span>
            )}
            <button
              onClick={logout}
              className="text-sm opacity-75 hover:opacity-100 transition"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-gray-100 border-t py-4 text-center text-sm text-gray-500">
        Kaimemo - 買い物リスト共有アプリ
      </footer>
    </div>
  );
}
