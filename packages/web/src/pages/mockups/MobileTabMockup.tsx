/**
 * MOCKUP: ⑨ Mobileボトムタブ構成
 * 確認URL: http://localhost:5173/mockup/mobile-tab
 */
import { useState } from 'react';

type Tab = 'lists' | 'groups' | 'notifications' | 'settings';

const TABS: { key: Tab; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    key: 'lists',
    label: 'リスト',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'groups',
    label: 'グループ',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'notifications',
    label: '通知',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: '設定',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ─── ダミーデータ ───

const LISTS = [
  { id: '1', name: '週末の食材', itemCount: 8, checkedCount: 3, group: { name: '家族' } },
  { id: '2', name: '日用品',     itemCount: 5, checkedCount: 5, group: null },
  { id: '3', name: '職場のお菓子', itemCount: 3, checkedCount: 0, group: { name: '仕事グループ' } },
];

const GROUPS = [
  { id: '1', name: '家族',       memberCount: 3, role: 'owner' },
  { id: '2', name: '仕事グループ', memberCount: 5, role: 'member' },
];

const NOTIFICATIONS = [
  { id: '1', type: 'check', text: '山田さんが「りんご」をチェックしました', time: '5分前', read: false },
  { id: '2', type: 'add',   text: '山田さんが「牛乳」を追加しました',       time: '15分前', read: false },
  { id: '3', type: 'invite', text: '仕事グループに招待されました',           time: '1時間前', read: true },
  { id: '4', type: 'reminder', text: '「週末の食材」の買い物日です',         time: '昨日',   read: true },
];

function notifIcon(type: string) {
  switch (type) {
    case 'check':    return <span className="text-green-500 text-base">✓</span>;
    case 'add':      return <span className="text-blue-500 text-base">＋</span>;
    case 'invite':   return <span className="text-purple-500 text-base">👥</span>;
    case 'reminder': return <span className="text-orange-500 text-base">🔔</span>;
    default:         return <span className="text-gray-400 text-base">•</span>;
  }
}

// ─── タブコンテンツ ───

function ListsTab() {
  const [search, setSearch] = useState('');
  const filtered = LISTS.filter(
    (l) => l.name.includes(search) || l.group?.name.includes(search)
  );
  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="bg-primary-600 px-4 pt-10 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white text-lg font-bold">リスト</h1>
          <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl leading-none font-light">＋</span>
          </button>
        </div>
        <div className="bg-white/20 rounded-xl flex items-center px-3 py-2 gap-2">
          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="リストを検索..."
            className="bg-transparent text-white placeholder-white/60 text-sm outline-none flex-1"
          />
        </div>
      </div>
      {/* リスト一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
        {filtered.map((list) => {
          const progress = list.itemCount > 0 ? list.checkedCount / list.itemCount : 0;
          const done = list.itemCount > 0 && list.checkedCount === list.itemCount;
          return (
            <div key={list.id} className="bg-white rounded-xl shadow-sm px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{list.name}</span>
                    {list.group && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                        {list.group.name}
                      </span>
                    )}
                  </div>
                  {done ? (
                    <p className="text-xs text-green-600 mt-1 font-medium">✅ 完了</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {list.checkedCount} / {list.itemCount}
                    </p>
                  )}
                  {list.itemCount > 0 && !done && (
                    <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <button className="p-1.5 text-gray-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupsTab() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary-600 px-4 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-bold">グループ</h1>
          <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl leading-none font-light">＋</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
        {GROUPS.map((g) => (
          <div key={g.id} className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{g.name}</p>
              <p className="text-xs text-gray-400">{g.memberCount}人 ・ {g.role === 'owner' ? 'オーナー' : 'メンバー'}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const unreadCount = notifs.filter((n) => !n.read).length;
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary-600 px-4 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-bold">
            通知
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-white/80 hover:text-white transition">
              すべて既読
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {notifs.map((n) => (
          <div
            key={n.id}
            onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
            className={`px-4 py-3 flex items-start gap-3 border-b border-gray-100 cursor-pointer active:bg-gray-100
              ${n.read ? 'bg-white' : 'bg-blue-50'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              {notifIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${n.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                {n.text}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [allNotif, setAllNotif] = useState(true);
  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary-600 px-4 pt-10 pb-4">
        <h1 className="text-white text-lg font-bold">設定</h1>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3 space-y-3">
        {/* プロフィール */}
        <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-lg">田</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">田中 太郎</p>
            <p className="text-xs text-gray-400">Googleアカウントで登録</p>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* 通知 */}
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">通知</p>
            <button
              onClick={() => setAllNotif((v) => !v)}
              className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors
                ${allNotif ? 'bg-primary-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform
                ${allNotif ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Pro誘導 */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl px-4 py-4 text-white">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-yellow-300 text-sm">★</span>
            <span className="text-xs font-bold text-yellow-300">Kaimemo Pro</span>
          </div>
          <p className="text-sm font-bold mb-1">もっと便利に使いたいですか？</p>
          <p className="text-xs text-white/70 mb-3">定期リスト無制限・写真無制限・広告非表示</p>
          <button className="w-full bg-white text-primary-700 font-bold text-sm py-2 rounded-lg">
            Proプランを見る — ¥480 / 月
          </button>
        </div>

        {/* ログアウト */}
        <div className="bg-white rounded-xl shadow-sm">
          <button className="w-full px-4 py-3.5 text-sm text-red-500 text-left">ログアウト</button>
        </div>

        <p className="text-center text-xs text-gray-300 pb-2">バージョン 1.0.0</p>
      </div>
    </div>
  );
}

export default function MobileTabMockup() {
  const [activeTab, setActiveTab] = useState<Tab>('lists');
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-start py-8 px-4">
      {/* 説明バナー */}
      <div className="w-full max-w-sm mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
        <strong>📋 モックアップ ⑨</strong> — Mobileボトムタブ構成。
        下のタブをタップして各画面を確認してください。
        （実機では Expo Go で動作確認済み）
      </div>

      {/* スマホフレーム */}
      <div className="w-full max-w-sm bg-black rounded-[2.5rem] p-2 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden" style={{ height: '680px' }}>
          <div className="flex flex-col h-full">
            {/* コンテンツ */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'lists'         && <ListsTab />}
              {activeTab === 'groups'        && <GroupsTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'settings'      && <SettingsTab />}
            </div>

            {/* ボトムタブ */}
            <div className="bg-white border-t border-gray-200 flex items-center px-2 pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition`}
                >
                  <div className="relative">
                    {tab.icon(activeTab === tab.key)}
                    {tab.key === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${activeTab === tab.key ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ナビゲーションリンク */}
      <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
        <p>他のモックアップ:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <a href="/mockup/home"      className="text-primary-600 hover:underline">① ホーム</a>
          <a href="/mockup/list"      className="text-primary-600 hover:underline">② リスト詳細</a>
          <a href="/mockup/header"    className="text-primary-600 hover:underline">③ ヘッダー通知</a>
          <a href="/mockup/readonly"  className="text-primary-600 hover:underline">⑥ 閲覧専用</a>
          <a href="/mockup/recurring" className="text-primary-600 hover:underline">⑦ 定期リスト</a>
          <a href="/mockup/settings"  className="text-primary-600 hover:underline">⑧ 設定</a>
        </div>
      </div>
    </div>
  );
}
