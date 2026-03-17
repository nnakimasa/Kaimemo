/**
 * MOCKUP: ⑧ 設定ページ（シンプル版）
 * 確認URL: http://localhost:5173/mockup/settings
 */
import { useState, useRef } from 'react';
import MockupHeader from './MockupHeader';

type NotifSetting = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

const INITIAL_NOTIF: NotifSetting[] = [
  { key: 'check',    label: 'チェック通知',    description: 'グループメンバーがアイテムをチェックしたとき', enabled: true },
  { key: 'add',      label: 'アイテム追加通知', description: 'グループメンバーがアイテムを追加したとき',   enabled: true },
  { key: 'invite',   label: 'グループ招待',     description: 'グループへの招待を受け取ったとき',         enabled: true },
  { key: 'reminder', label: 'リマインダー通知', description: '定期リストの買い物当日に通知',             enabled: true },
];

type AvatarStyle =
  | { type: 'initials'; initials: string; bg: string; textColor: string }
  | { type: 'photo'; src: string };

const BG_COLORS = [
  { bg: 'bg-primary-100', textColor: 'text-primary-700', dot: 'bg-primary-400' },
  { bg: 'bg-red-100',     textColor: 'text-red-600',     dot: 'bg-red-400' },
  { bg: 'bg-green-100',   textColor: 'text-green-700',   dot: 'bg-green-500' },
  { bg: 'bg-purple-100',  textColor: 'text-purple-700',  dot: 'bg-purple-400' },
  { bg: 'bg-orange-100',  textColor: 'text-orange-600',  dot: 'bg-orange-400' },
  { bg: 'bg-pink-100',    textColor: 'text-pink-600',    dot: 'bg-pink-400' },
  { bg: 'bg-teal-100',    textColor: 'text-teal-700',    dot: 'bg-teal-400' },
  { bg: 'bg-yellow-100',  textColor: 'text-yellow-700',  dot: 'bg-yellow-400' },
];

function initialsSize(len: number) {
  if (len <= 2) return 'text-xl';
  if (len <= 4) return 'text-sm';
  if (len <= 6) return 'text-xs';
  return 'text-[10px]';
}

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

function AvatarDisplay({ avatar, size = 'lg' }: { avatar: AvatarStyle; size?: 'lg' | 'sm' }) {
  const wh = size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  if (avatar.type === 'photo') {
    return <img src={avatar.src} alt="avatar" className={`${wh} rounded-full object-cover`} />;
  }
  return (
    <div className={`${wh} rounded-full flex items-center justify-center ${avatar.bg}`}>
      <span className={`font-bold leading-none ${avatar.textColor} ${initialsSize(avatar.initials.length)}`}>
        {avatar.initials}
      </span>
    </div>
  );
}

export default function SettingsMockup() {
  const [displayName, setDisplayName] = useState('田中 太郎');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('田中 太郎');
  const [notifSettings, setNotifSettings] = useState<NotifSetting[]>(INITIAL_NOTIF);
  const [allNotifEnabled, setAllNotifEnabled] = useState(true);

  // ─── アバター ───
  const [avatar, setAvatar] = useState<AvatarStyle>({
    type: 'initials', initials: '田', bg: 'bg-primary-100', textColor: 'text-primary-700',
  });
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'initials' | 'photo'>('initials');
  const [initialsInput, setInitialsInput] = useState('田');
  const [selectedColor, setSelectedColor] = useState(BG_COLORS[0]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (avatar.type === 'initials') {
      setInitialsInput(avatar.initials);
      setSelectedColor(BG_COLORS.find((c) => c.bg === avatar.bg) ?? BG_COLORS[0]);
      setPickerTab('initials');
    } else {
      setPhotoPreview(avatar.src);
      setPickerTab('photo');
    }
    setAvatarPickerOpen(true);
  };

  const saveInitials = () => {
    const val = initialsInput.trim().slice(0, 8);
    if (!val) return;
    setAvatar({ type: 'initials', initials: val, bg: selectedColor.bg, textColor: selectedColor.textColor });
    setAvatarPickerOpen(false);
  };

  const savePhoto = () => {
    if (!photoPreview) return;
    setAvatar({ type: 'photo', src: photoPreview });
    setAvatarPickerOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleNotif = (key: string) => {
    setNotifSettings((prev) => prev.map((n) => n.key === key ? { ...n, enabled: !n.enabled } : n));
  };
  const toggleAllNotif = () => {
    const next = !allNotifEnabled;
    setAllNotifEnabled(next);
    setNotifSettings((prev) => prev.map((n) => ({ ...n, enabled: next })));
  };
  const saveName = () => {
    if (nameInput.trim()) setDisplayName(nameInput.trim());
    setEditingName(false);
  };

  // ピッカーでリアルタイムプレビュー
  const previewAvatar: AvatarStyle = pickerTab === 'initials'
    ? { type: 'initials', initials: initialsInput.trim().slice(0, 8) || '？', bg: selectedColor.bg, textColor: selectedColor.textColor }
    : photoPreview ? { type: 'photo', src: photoPreview } : { type: 'initials', initials: '？', bg: 'bg-gray-100', textColor: 'text-gray-400' };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ─── ヘッダー ─── */}
      <MockupHeader activeLabel="設定" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <strong>📋 モックアップ ⑧</strong> — 設定ページ。
          プロフィール名変更 / アバター変更（テキスト2〜8文字・写真） / 通知ON/OFF（全体・個別） / Proプラン誘導エリア
        </div>

        {/* ─── プロフィール ─── */}
        <section className="bg-white rounded-xl shadow divide-y divide-gray-50">
          <div className="px-5 py-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">プロフィール</h2>
            <div className="flex items-center gap-4">
              {/* アバター（クリックで変更） */}
              <div className="relative flex-shrink-0">
                <button onClick={openPicker} className="block hover:opacity-80 transition focus:outline-none">
                  <AvatarDisplay avatar={avatar} size="lg" />
                  {/* カメラバッジ */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center border-2 border-white pointer-events-none">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                      autoFocus
                      className="flex-1 border border-primary-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <button onClick={saveName}
                      className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition">保存</button>
                    <button onClick={() => setEditingName(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">キャンセル</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-900">{displayName}</span>
                    <button onClick={() => { setNameInput(displayName); setEditingName(true); }}
                      className="text-xs text-primary-600 hover:text-primary-700 transition">変更</button>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-0.5">Googleアカウントで登録</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-3">
            <button className="text-sm text-red-500 hover:text-red-600 transition">ログアウト</button>
          </div>
        </section>

        {/* ─── 通知設定 ─── */}
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
            <div key={n.key} className={`px-5 py-3.5 flex items-center justify-between gap-4 transition ${!allNotifEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.description}</p>
              </div>
              <Toggle enabled={n.enabled} onChange={() => toggleNotif(n.key)} />
            </div>
          ))}
        </section>

        {/* ─── Proプラン誘導 ─── */}
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

        {/* ─── その他 ─── */}
        <section className="bg-white rounded-xl shadow divide-y divide-gray-100">
          <div className="px-5 py-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">その他</h2>
          </div>
          {[
            { label: 'プライバシーポリシー', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { label: '利用規約',             icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { label: 'お問い合わせ',         icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          ].map(({ label, icon }) => (
            <button key={label} className="w-full px-5 py-3.5 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition">
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
      </main>

      {/* ─── アバター変更モーダル ─── */}
      {avatarPickerOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setAvatarPickerOpen(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>

            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">アバターを変更</h2>
              <button onClick={() => setAvatarPickerOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* タブ */}
            <div className="flex border-b border-gray-100">
              {(['initials', 'photo'] as const).map((tab) => (
                <button key={tab} onClick={() => setPickerTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-medium transition
                    ${pickerTab === tab ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>
                  {tab === 'initials' ? 'テキスト' : '写真'}
                </button>
              ))}
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* プレビュー */}
              <div className="flex justify-center">
                <AvatarDisplay avatar={previewAvatar} size="lg" />
              </div>

              {pickerTab === 'initials' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">表示テキスト（1〜8文字）</label>
                    <input
                      type="text"
                      value={initialsInput}
                      onChange={(e) => setInitialsInput(e.target.value.slice(0, 8))}
                      maxLength={8}
                      placeholder="例: 田中、T.T"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-right text-xs text-gray-400">{initialsInput.length} / 8</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500">背景カラー</label>
                    <div className="flex gap-2 flex-wrap">
                      {BG_COLORS.map((c, i) => (
                        <button key={i} onClick={() => setSelectedColor(c)}
                          className={`w-7 h-7 rounded-full transition hover:scale-110 ${c.dot}
                            ${selectedColor.bg === c.bg ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {pickerTab === 'photo' && (
                <div className="space-y-3">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">写真を選択</span>
                  </button>
                  {photoPreview && (
                    <button onClick={() => setPhotoPreview(null)}
                      className="text-xs text-red-400 hover:text-red-500 w-full text-center transition">
                      写真を削除
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setAvatarPickerOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                キャンセル
              </button>
              <button
                onClick={pickerTab === 'initials' ? saveInitials : savePhoto}
                disabled={pickerTab === 'initials' ? !initialsInput.trim() : !photoPreview}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
