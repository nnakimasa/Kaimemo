/**
 * MOCKUP: 全画面つながりレビュー ハブページ
 * 確認URL: http://localhost:5173/mockup
 */
import MockupHeader from './MockupHeader';

const SCREENS = [
  {
    num: '①',
    title: 'ホーム（リスト一覧）',
    path: '/mockup/home',
    description: '検索バー・進捗バー・グループバッジ・⋮メニュー・履歴セクション',
    links: [
      { label: 'リストをクリック → ② リスト詳細', path: '/mockup/list' },
      { label: '🔔 → ③ ヘッダー通知', path: '/mockup/header' },
      { label: '定期リスト → ⑦ 定期リスト', path: '/mockup/recurring' },
      { label: '設定 → ⑧ 設定ページ', path: '/mockup/settings' },
    ],
  },
  {
    num: '②',
    title: 'リスト詳細',
    path: '/mockup/list',
    description: 'アイテムカード・チェック・スワイプ削除・編集モーダル・共有シート',
    links: [
      { label: '← 戻る → ① ホーム', path: '/mockup/home' },
      { label: '共有 → 閲覧専用リンク → ⑥ 閲覧専用ページ', path: '/mockup/readonly' },
    ],
  },
  {
    num: '③',
    title: 'ヘッダー通知ドロップダウン',
    path: '/mockup/header',
    description: '未読バッジ・ドロップダウン・既読化・全て既読',
    links: [
      { label: '← 戻る → ① ホーム', path: '/mockup/home' },
    ],
  },
  {
    num: '⑥',
    title: '閲覧専用リストページ',
    path: '/mockup/readonly',
    description: 'ログイン不要・チェック表示のみ・ポーリング・登録誘導バナー',
    links: [
      { label: 'ログインして編集 → ① ホーム', path: '/mockup/home' },
    ],
  },
  {
    num: '⑦',
    title: '定期リスト',
    path: '/mockup/recurring',
    description: '定期リスト一覧・⋮メニュー → 定期設定モーダル（周期・曜日・リマインダー）',
    links: [
      { label: '← 戻る → ① ホーム', path: '/mockup/home' },
    ],
  },
  {
    num: '⑧',
    title: '設定ページ',
    path: '/mockup/settings',
    description: 'プロフィール変更・通知ON/OFF・Proプラン誘導',
    links: [
      { label: '← 戻る → ① ホーム', path: '/mockup/home' },
    ],
  },
  {
    num: '⑨',
    title: 'Mobile ボトムタブ',
    path: '/mockup/mobile-tab',
    description: 'スマホフレーム内でタブ切り替えを確認（リスト/グループ/通知/設定）',
    links: [],
  },
];

const FLOW = [
  { from: '① ホーム', to: '② リスト詳細', action: 'リストカードをクリック' },
  { from: '② リスト詳細', to: '① ホーム', action: '← 戻るボタン' },
  { from: '② リスト詳細', to: '⑥ 閲覧専用', action: '共有 → 閲覧専用リンクを生成' },
  { from: '① ホーム', to: '③ 通知', action: '🔔 ベルアイコン（ヘッダー）' },
  { from: '① ホーム', to: '⑦ 定期リスト', action: 'ヘッダー「定期リスト」' },
  { from: '① ホーム', to: '⑧ 設定', action: 'ヘッダー「設定」' },
  { from: '⑥ 閲覧専用', to: '① ホーム', action: '「ログインして編集」ボタン' },
];

export default function MockupHub() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MockupHeader />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <strong>📋 ⑩ 全画面つながりレビュー</strong> —
          下の「開く」ボタンで各画面を確認し、画面内のリンクで遷移フローを体験してください。
        </div>

        {/* ─── 遷移フロー ─── */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">画面遷移フロー</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {FLOW.map((f, i) => (
              <div key={i} className={`px-4 py-3 flex items-center gap-3 text-sm ${i < FLOW.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="font-semibold text-primary-700 whitespace-nowrap">{f.from}</span>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-400 text-xs flex-1">{f.action}</span>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-semibold text-primary-700 whitespace-nowrap">{f.to}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 画面一覧 ─── */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">画面一覧</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SCREENS.map((s) => (
              <div key={s.num} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-primary-600">{s.num}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
                  </div>
                  <a href={s.path}
                    className="flex-shrink-0 bg-primary-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary-700 transition">
                    開く
                  </a>
                </div>
                {s.links.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    {s.links.map((l, i) => (
                      <a key={i} href={l.path}
                        className="block text-xs text-primary-600 hover:text-primary-800 hover:underline transition">
                        → {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── チェックリスト ─── */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">確認チェックリスト</h2>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                '全画面の遷移フローに抜け・矛盾がないか',
                '「戻る」導線がすべての画面に存在するか',
                'モーダルとページ遷移の使い分けに一貫性があるか',
                'Web ヘッダーナビ（リスト/定期リスト/通知/設定）の対応が揃っているか',
                'Mobile ボトムタブ（リスト/グループ/通知/設定）の対応が揃っているか',
                '操作の流れが自然で直感的か',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">□</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
