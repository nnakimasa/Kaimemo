import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type AppNotification = {
  id: string;
  type: 'check' | 'add' | 'invite' | 'reminder';
  title: string;
  body: string;
  time: string;
  isRead: boolean;
};

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'check') return (
    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
  if (type === 'add') return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </div>
  );
  if (type === 'invite') return (
    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 画面遷移時にメニュー・通知を閉じる
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setNotifOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Kaimemo
          </Link>

          {/* PC: 横並びナビ */}
          <nav className="hidden sm:flex items-center gap-4">
            <Link to="/" className="text-sm opacity-75 hover:opacity-100 transition">
              リスト
            </Link>
            <Link to="/groups" className="text-sm opacity-75 hover:opacity-100 transition">
              グループ
            </Link>
            <Link to="/recurring" className="text-sm opacity-75 hover:opacity-100 transition">
              定期リスト
            </Link>

            <Link to="/settings" className="text-sm opacity-75 hover:opacity-100 transition">
              設定
            </Link>

            {/* 🔔 通知ベル */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition"
                title="通知"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">通知</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary-600 hover:text-primary-700 transition"
                      >
                        全て既読にする
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">通知はありません</p>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => markRead(notif.id)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition
                            ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                        >
                          <NotifIcon type={notif.type} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{notif.body}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

          {/* スマホ: ハンバーガーメニュー */}
          <div className="sm:hidden relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 opacity-75 hover:opacity-100 transition"
              aria-label="メニュー"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 text-gray-800">
                <Link to="/" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition text-gray-700">
                  リスト
                </Link>
                <Link to="/groups" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition text-gray-700">
                  グループ
                </Link>
                <Link to="/recurring" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition text-gray-700">
                  定期リスト
                </Link>
                <Link to="/settings" className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition text-gray-700">
                  設定
                </Link>
                <div className="border-t border-gray-100 my-1" />
                {user && (
                  <div className="px-4 py-2 text-sm text-gray-500">{user.displayName}</div>
                )}
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
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
