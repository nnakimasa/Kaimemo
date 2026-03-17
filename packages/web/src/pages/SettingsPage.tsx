import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

type NotifSetting = { key: string; label: string; description: string; enabled: boolean };

const NOTIF_DEFAULTS: NotifSetting[] = [
  { key: 'check',    label: 'チェック通知',    description: 'グループメンバーがアイテムをチェックしたとき', enabled: true },
  { key: 'add',      label: 'アイテム追加通知', description: 'グループメンバーがアイテムを追加したとき',   enabled: true },
  { key: 'invite',   label: 'グループ招待',     description: 'グループへの招待を受け取ったとき',         enabled: true },
  { key: 'reminder', label: 'リマインダー通知', description: '定期リストの買い物当日に通知',             enabled: true },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
        ${enabled ? 'bg-primary-500' : 'bg-gray-200'}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200
        ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [notifSettings, setNotifSettings] = useState<NotifSetting[]>(NOTIF_DEFAULTS);
  const [allNotifEnabled, setAllNotifEnabled] = useState(true);

  const toggleNotif = (key: string) => {
    setNotifSettings((prev) => prev.map((n) => n.key === key ? { ...n, enabled: !n.enabled } : n));
  };

  const toggleAllNotif = () => {
    const next = !allNotifEnabled;
    setAllNotifEnabled(next);
    setNotifSettings((prev) => prev.map((n) => ({ ...n, enabled: next })));
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900">設定</h1>

      {/* プロフィール */}
      <section className="bg-white rounded-xl shadow divide-y divide-gray-50">
        <div className="px-5 py-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">プロフィール</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary-700">
                {user?.displayName?.charAt(0) ?? '？'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900">{user?.displayName ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email ?? ''}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3">
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-600 transition"
          >
            ログアウト
          </button>
        </div>
      </section>

      {/* 通知設定 */}
      <section className="bg-white rounded-xl shadow divide-y divide-gray-50">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">通知設定</h2>
            <p className="text-xs text-gray-400 mt-0.5">全通知のON/OFFをまとめて切り替えられます</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{allNotifEnabled ? 'ON' : 'OFF'}</span>
            <Toggle enabled={allNotifEnabled} onChange={toggleAllNotif} />
          </div>
        </div>
        {notifSettings.map((n) => (
          <div key={n.key}
            className={`px-5 py-3.5 flex items-center justify-between gap-4 transition ${!allNotifEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{n.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{n.description}</p>
            </div>
            <Toggle enabled={n.enabled} onChange={() => toggleNotif(n.key)} />
          </div>
        ))}
      </section>

      {/* Proプラン誘導 */}
      <section className="rounded-xl overflow-hidden shadow">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-5 py-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-sm font-bold text-yellow-300">Kaimemo Pro</span>
          </div>
          <p className="text-base font-bold mb-1">もっと便利に使いたいですか？</p>
          <ul className="text-xs text-white/80 space-y-1 mb-4">
            <li>✓ 定期リスト数: 無制限（無料: 3件まで）</li>
            <li>✓ 写真添付: 無制限（無料: アイテムごと1枚）</li>
            <li>✓ グループメンバー: 無制限（無料: 5人まで）</li>
            <li>✓ 広告非表示</li>
          </ul>
          <button className="w-full bg-white text-primary-700 font-bold text-sm py-2.5 rounded-lg hover:bg-primary-50 transition">
            Proプランを見る — ¥480 / 月
          </button>
        </div>
        <div className="bg-primary-50 px-5 py-2.5 text-center">
          <span className="text-xs text-primary-600">現在: 無料プラン</span>
        </div>
      </section>

      {/* その他 */}
      <section className="bg-white rounded-xl shadow divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">その他</h2>
        </div>
        {[
          { label: 'プライバシーポリシー', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: '利用規約',             icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'お問い合わせ',         icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        ].map(({ label, icon }) => (
          <button key={label}
            className="w-full px-5 py-3.5 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              {label}
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
        <div className="px-5 py-3 text-center">
          <span className="text-xs text-gray-300">バージョン 1.0.0</span>
        </div>
      </section>
    </div>
  );
}
