/**
 * MOCKUP: 閲覧専用リストページ
 * 確認URL: http://localhost:5173/mockup/readonly
 * ログイン不要・トークンURLでアクセス・編集不可
 */
import { useState, useRef } from 'react';

type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note: string;
  isChecked: boolean;
  categoryColor: string | null;
  photos: string[];
};

// ダミー写真（グラデーションのSVGをDataURIで代用）
const DUMMY_PHOTO_RED = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23f87171'/><text x='50' y='58' font-size='28' text-anchor='middle' fill='white'>🍎</text></svg>`;
const DUMMY_PHOTO_BLUE = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%2360a5fa'/><text x='50' y='58' font-size='28' text-anchor='middle' fill='white'>🥛</text></svg>`;
const DUMMY_PHOTO_BLUE2 = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%2393c5fd'/><text x='50' y='58' font-size='28' text-anchor='middle' fill='white'>🥛</text></svg>`;

const ITEMS: Item[] = [
  { id: '1', name: 'りんご',           quantity: 3,  unit: '個', note: 'ふじが好み', isChecked: false, categoryColor: '#f87171', photos: [DUMMY_PHOTO_RED] },
  { id: '2', name: 'パン',             quantity: 1,  unit: '斤', note: '',           isChecked: false, categoryColor: '#f87171', photos: [] },
  { id: '3', name: '卵',               quantity: 10, unit: '個', note: '',           isChecked: true,  categoryColor: '#f87171', photos: [] },
  { id: '4', name: '牛乳',             quantity: 2,  unit: 'L',  note: '',           isChecked: false, categoryColor: '#60a5fa', photos: [DUMMY_PHOTO_BLUE, DUMMY_PHOTO_BLUE2] },
  { id: '5', name: 'ヨーグルト',        quantity: 1,  unit: '',   note: 'プレーン',   isChecked: false, categoryColor: '#60a5fa', photos: [] },
  { id: '6', name: 'トイレットペーパー', quantity: 1,  unit: '',   note: '',           isChecked: false, categoryColor: null,      photos: [] },
];

type PhotoViewer = { itemId: string; index: number };

export default function ReadOnlyListMockup() {
  const [lastUpdated, setLastUpdated] = useState('2分前');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<PhotoViewer | null>(null);
  const touchStartX = useRef<number | null>(null);

  const checkedCount = ITEMS.filter((i) => i.isChecked).length;
  const progress = Math.round((checkedCount / ITEMS.length) * 100);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('たった今');
    }, 800);
  };

  const viewerItem = photoViewer ? ITEMS.find((i) => i.id === photoViewer.itemId) : null;
  const viewerPhotos = viewerItem?.photos ?? [];
  const viewerIdx = photoViewer?.index ?? 0;
  const goViewer = (delta: number) =>
    setPhotoViewer((v) => v ? { ...v, index: Math.max(0, Math.min(viewerPhotos.length - 1, v.index + delta)) } : null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ─── ヘッダー（ログイン不要・シンプル版） ─── */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Kaimemo</span>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">閲覧専用</span>
          </div>
          <a
            href="/login"
            className="text-sm bg-white/10 hover:bg-white/20 transition px-3 py-1.5 rounded-lg"
          >
            ログインして編集
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {/* ─── リスト情報 ─── */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">週末の食材</h1>
              <p className="text-sm text-gray-400 mt-0.5">田中 太郎 · 家族グループ</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              編集不可
            </div>
          </div>

          {/* 進捗バー */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{checkedCount} / {ITEMS.length} 完了</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* 最終更新 + 手動更新ボタン */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <span className="text-xs text-gray-400">
              最終更新: {lastUpdated}
              <span className="ml-1 text-gray-300">（30秒ごとに自動更新）</span>
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? '更新中...' : '今すぐ更新'}
            </button>
          </div>
        </div>

        {/* ─── アイテム一覧（読み取り専用） ─── */}
        <div className="space-y-1">
          {ITEMS.map((item) => {
            const c = item.isChecked;
            return (
              <div
                key={item.id}
                className={`rounded-lg shadow flex overflow-hidden ${c ? 'opacity-50' : ''}`}
              >
                {/* 左端カラーバー */}
                <div className="w-1 flex-shrink-0" style={{ backgroundColor: item.categoryColor ?? 'transparent' }} />

                <div
                  className={`flex items-center gap-3 px-3 flex-1 min-w-0 bg-white ${c ? 'py-1' : 'py-3'}`}
                  style={c ? {
                    backgroundImage: 'repeating-linear-gradient(-45deg, rgba(156,163,175,0.18) 0px, rgba(156,163,175,0.18) 2px, transparent 2px, transparent 9px)',
                  } : {}}
                >
                  {/* チェック状態（表示のみ・タップ不可） */}
                  <div
                    className={`flex-shrink-0 rounded-full border-2 flex items-center justify-center cursor-default
                      ${c ? 'w-4 h-4 border-primary-400 bg-primary-400' : 'w-6 h-6 border-gray-200 bg-gray-50'}`}
                  >
                    {c && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* アイテム名 + メモ */}
                  <div className="flex-1 min-w-0 overflow-hidden flex items-baseline gap-2">
                    <span className={`flex-shrink-0 ${c ? 'text-xs line-through text-gray-400' : 'text-sm text-gray-900'}`}>
                      {item.name}
                    </span>
                    {item.note && !c && (
                      <span className="text-xs text-gray-400 italic truncate">{item.note}</span>
                    )}
                  </div>

                  {/* 写真サムネイル（タップでビューワー） */}
                  {item.photos.length > 0 && !c && (
                    <button
                      className="flex-shrink-0 relative"
                      onClick={() => setPhotoViewer({ itemId: item.id, index: 0 })}
                    >
                      <img src={item.photos[0]} alt=""
                        className="h-6 w-6 object-cover rounded border border-gray-200" />
                      {item.photos.length > 1 && (
                        <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                          {item.photos.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* 数量バッジ */}
                  {!c && (item.quantity > 1 || item.unit) && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                      {item.quantity}{item.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Kaimemoへの誘導 ─── */}
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center space-y-2">
          <p className="text-sm font-semibold text-primary-800">自分のリストを作りたいですか？</p>
          <p className="text-xs text-primary-600">Kaimemoなら買い物リストをグループで共有・編集できます</p>
          <a
            href="/login"
            className="inline-block mt-1 bg-primary-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            無料で始める
          </a>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <strong>📋 モックアップ ⑥</strong> — 確認ポイント:
          写真サムネイル表示・タップで全画面ビューワー（追加・削除不可）/
          「今すぐ更新」ボタン（30秒ごと自動更新） / チェック・追加・削除ボタンなし
        </div>
      </main>

      {/* ─── フォトビューワー ─── */}
      {photoViewer && viewerPhotos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50"
          onClick={() => setPhotoViewer(null)}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx < -50) goViewer(1);
            else if (dx > 50) goViewer(-1);
            touchStartX.current = null;
          }}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            onClick={() => setPhotoViewer(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute top-5 left-0 right-0 text-center text-white/60 text-sm">
            {viewerIdx + 1} / {viewerPhotos.length}
          </div>
          <img src={viewerPhotos[viewerIdx]} alt=""
            className="max-w-full max-h-[80vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()} />
          {viewerIdx > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); goViewer(-1); }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {viewerIdx < viewerPhotos.length - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); goViewer(1); }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {viewerPhotos.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {viewerPhotos.map((_, i) => (
                <button key={i}
                  onClick={(e) => { e.stopPropagation(); setPhotoViewer({ ...photoViewer, index: i }); }}
                  className={`w-2 h-2 rounded-full ${i === viewerIdx ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
