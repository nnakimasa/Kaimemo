/**
 * MOCKUP: ヘッダー通知ドロップダウン
 * 確認URL: http://localhost:5173/mockup/header
 */
import { useState } from 'react';

type Notification = {
  id: string;
  type: 'check' | 'add' | 'invite' | 'reminder';
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  listName?: string;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1', type: 'check',
    title: 'りんごがチェックされました',
    body: '週末の食材',
    time: '2分前', isRead: false, listName: '週末の食材',
  },
  {
    id: '2', type: 'add',
    title: 'パンが追加されました',
    body: '週末の食材',
    time: '15分前', isRead: false, listName: '週末の食材',
  },
  {
    id: '3', type: 'invite',
    title: '仕事グループに招待されました',
    body: '田中 太郎より',
    time: '1時間前', isRead: true,
  },
  {
    id: '4', type: 'reminder',
    title: 'トイレットペーパー のリマインダー',
    body: '個人メモ',
    time: '昨日', isRead: true, listName: '個人メモ',
  },
  {
    id: '5', type: 'check',
    title: '牛乳がチェックされました',
    body: '週末の食材',
    time: '2日前', isRead: true, listName: '週末の食材',
  },
];

function NotifIcon({ type }: { type: Notification['type'] }) {
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
  // reminder
  return (
    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </div>
  );
}

export default function HeaderMockup() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" onClick={() => setNotifOpen(false)}>
      {/* ─── ヘッダー ─── */}
      <header className="bg-primary-600 text-white shadow-md relative z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Kaimemo</span>
          <nav className="flex items-center gap-1 sm:gap-4">
            <span className="text-sm font-semibold border-b-2 border-white pb-0.5 hidden sm:inline">リスト</span>
            <span className="text-sm opacity-75 hidden sm:inline">グループ</span>

            {/* 🔔 通知ベル */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
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

              {/* ─── 通知ドロップダウン ─── */}
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ヘッダー */}
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

                  {/* 通知リスト */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">通知はありません</p>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => { markRead(notif.id); setNotifOpen(false); }}
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

            <span className="text-sm opacity-90 hidden sm:inline">田中 太郎</span>
            <span className="text-sm opacity-75 hidden sm:inline">ログアウト</span>
          </nav>
        </div>
      </header>

      {/* ─── ページコンテンツ（ダミー） ─── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-3">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <strong>📋 モックアップ ③</strong> — 確認ポイント:
          🔔バッジ（未読数）/ ドロップダウン表示 / 既読・未読の見た目の差 / 「全て既読にする」ボタン /
          通知タップで既読化＆閉じる / 画面外タップで閉じる
        </div>

        {/* ダミーのリストカード */}
        {['週末の食材', '個人メモ', '仕事の備品'].map((name, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-gray-800">{name}</p>
              <p className="text-xs text-gray-400 mt-1">{i + 2} / {i + 6} 完了</p>
            </div>
            <div className="w-20 bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${[37, 20, 60][i]}%` }} />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
