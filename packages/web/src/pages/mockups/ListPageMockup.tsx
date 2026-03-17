/**
 * MOCKUP: リスト詳細画面サンプルUI
 * 確認URL: http://localhost:5173/mockup/list
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

const COLOR_ORDER: (string | null)[] = ['#f87171', '#60a5fa', null];

const INITIAL_ITEMS: Item[] = [
  { id: '1', name: 'りんご',           quantity: 3,  unit: '個', note: 'ふじが好み', isChecked: false, categoryColor: '#f87171', photos: [] },
  { id: '2', name: 'パン',             quantity: 1,  unit: '斤', note: '',           isChecked: false, categoryColor: '#f87171', photos: [] },
  { id: '3', name: '卵',               quantity: 10, unit: '個', note: '',           isChecked: true,  categoryColor: '#f87171', photos: [] },
  { id: '4', name: '牛乳',             quantity: 2,  unit: 'L',  note: '',           isChecked: false, categoryColor: '#60a5fa', photos: [] },
  { id: '5', name: 'ヨーグルト',        quantity: 1,  unit: '',   note: 'プレーン',   isChecked: false, categoryColor: '#60a5fa', photos: [] },
  { id: '6', name: 'トイレットペーパー', quantity: 1,  unit: '',   note: '',           isChecked: false, categoryColor: null,      photos: [] },
];

type EditModal = { id: string; name: string; quantity: number; unit: string; note: string; photos: string[] };
type PhotoViewer = { itemId: string; index: number };

function groupByColor(items: Item[]) {
  const map = new Map<string | null, Item[]>();
  COLOR_ORDER.forEach((c) => map.set(c, []));
  items.forEach((item) => {
    const key = COLOR_ORDER.includes(item.categoryColor) ? item.categoryColor : null;
    map.get(key)!.push(item);
  });
  return COLOR_ORDER.map((color) => ({ color, items: map.get(color)! })).filter((g) => g.items.length > 0);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

export default function ListPageMockup() {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [newItemName, setNewItemName] = useState('');
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<PhotoViewer | null>(null);
  const [reorderItemId, setReorderItemId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const groups = groupByColor(items);

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isChecked: !i.isChecked } : i));
  const deleteItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setItems((prev) => [...prev, {
      id: `new-${Date.now()}`, name: newItemName.trim(),
      quantity: 1, unit: '', note: '', isChecked: false, categoryColor: null, photos: [],
    }]);
    setNewItemName('');
  };
  const openEdit = (item: Item) =>
    setEditModal({ id: item.id, name: item.name, quantity: item.quantity, unit: item.unit, note: item.note, photos: [...item.photos] });
  const commitEdit = () => {
    if (!editModal) return;
    setItems((prev) => prev.map((i) => i.id === editModal.id ? { ...i, ...editModal } : i));
    setEditModal(null);
  };

  // ─── ドラッグ並び替え（PC） ───
  const getColor = (id: string) => items.find((i) => i.id === id)?.categoryColor ?? null;
  const handleDragStart = (id: string) => { dragIdRef.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (getColor(dragIdRef.current!) === getColor(id)) setDragOverId(id);
  };
  const handleDrop = (targetId: string) => {
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId || getColor(fromId) !== getColor(targetId)) { setDragOverId(null); return; }
    setItems((prev) => {
      const arr = [...prev];
      const fi = arr.findIndex((i) => i.id === fromId);
      const ti = arr.findIndex((i) => i.id === targetId);
      const [item] = arr.splice(fi, 1);
      arr.splice(ti, 0, item);
      return arr;
    });
    setDragOverId(null);
    dragIdRef.current = null;
  };

  // ─── スマホ用 ▲▼ 並び替え ───
  const moveItem = (id: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const arr = [...prev];
      const colorVal = arr.find((i) => i.id === id)?.categoryColor ?? null;
      const sameGroup = arr.map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.categoryColor === colorVal);
      const posInGroup = sameGroup.findIndex(({ item }) => item.id === id);
      if (direction === 'up' && posInGroup > 0) {
        const [a, b] = [sameGroup[posInGroup].idx, sameGroup[posInGroup - 1].idx];
        [arr[a], arr[b]] = [arr[b], arr[a]];
      } else if (direction === 'down' && posInGroup < sameGroup.length - 1) {
        const [a, b] = [sameGroup[posInGroup].idx, sameGroup[posInGroup + 1].idx];
        [arr[a], arr[b]] = [arr[b], arr[a]];
      }
      return arr;
    });
  };

  // ─── 写真追加ヘルパー（複数対応） ───
  const addPhotos = async (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (!valid.length || !editModal) return;
    const dataUrls = await Promise.all(valid.map(readFileAsDataURL));
    setEditModal((m) => m ? { ...m, photos: [...m.photos, ...dataUrls] } : m);
  };
  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    addPhotos(Array.from(e.target.files ?? []));
  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault(); setPhotoDragOver(false);
    addPhotos(Array.from(e.dataTransfer.files));
  };
  const handlePhotoPaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData?.items ?? [])
      .filter((i) => i.type.startsWith('image/'))
      .map((i) => i.getAsFile())
      .filter(Boolean) as File[];
    addPhotos(files);
  };
  const removePhoto = (idx: number) =>
    setEditModal((m) => m ? { ...m, photos: m.photos.filter((_, i) => i !== idx) } : m);

  // ─── フォトビューワー操作 ───
  const viewerItem = photoViewer ? items.find((i) => i.id === photoViewer.itemId) : null;
  const viewerPhotos = viewerItem?.photos ?? [];
  const viewerIdx = photoViewer?.index ?? 0;
  const goViewer = (delta: number) =>
    setPhotoViewer((v) => v ? { ...v, index: Math.max(0, Math.min(viewerPhotos.length - 1, v.index + delta)) } : null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" onClick={() => setReorderItemId(null)}>
      {/* ─── ヘッダー ─── */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/mockup/home" className="text-white opacity-75 hover:opacity-100 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-lg font-bold">週末の食材</h1>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
            className="flex items-center gap-1.5 text-sm opacity-75 hover:opacity-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            共有
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {/* ─── アイテム追加フォーム ─── */}
        <form onSubmit={addItem} className="bg-white rounded-lg shadow p-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
              placeholder="アイテムを追加..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            <button type="submit" disabled={!newItemName.trim()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-40 text-sm">追加</button>
          </div>
        </form>

        {/* ─── アイテム一覧 ─── */}
        <div className="space-y-1">
          {groups.map((group, gi) => (
            <div key={group.color ?? 'none'}>
              {gi > 0 && <div className="h-2" />}
              {group.items.map((item, idx) => (
                <div key={item.id} className="mb-1">
                  <ItemCard
                    item={item}
                    onToggle={toggle}
                    onEdit={openEdit}
                    onDelete={deleteItem}
                    onOpenPhotoViewer={(itemId) => setPhotoViewer({ itemId, index: 0 })}
                    isDragOver={dragOverId === item.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={() => setDragOverId(null)}
                    isReordering={reorderItemId === item.id}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < group.items.length - 1}
                    onLongPress={(id) => setReorderItemId(id)}
                    onMoveUp={() => moveItem(item.id, 'up')}
                    onMoveDown={() => moveItem(item.id, 'down')}
                    onEndReorder={() => setReorderItemId(null)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 mt-4">
          <strong>📋 モックアップ</strong> — 確認ポイント:
          写真サムネイルタップ→全画面モーダル（矢印でスワイプ）/
          編集モーダル：複数写真追加（クリック・ドロップ・Ctrl+V）/
          リスト表示は1枚目のみ /
          並び替え: PCはドラッグ、スマホは左端ハンドルを長押し（0.5秒）→▲▼ボタンで移動→✓で完了
        </div>
      </main>

      {/* ─── アイテム編集モーダル ─── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4"
          onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onPaste={handlePhotoPaste}>
            <h2 className="text-lg font-bold">アイテムを編集</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">名前</label>
                <input type="text" value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">数量</label>
                  <input type="number" min={1} value={editModal.quantity}
                    onChange={(e) => setEditModal({ ...editModal, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">単位</label>
                  <input type="text" value={editModal.unit}
                    onChange={(e) => setEditModal({ ...editModal, unit: e.target.value })}
                    placeholder="個・L・袋…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">メモ（任意）</label>
                <input type="text" value={editModal.note}
                  onChange={(e) => setEditModal({ ...editModal, note: e.target.value })}
                  placeholder="ブランド・こだわりなど"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>

              {/* ─── 写真（複数） ─── */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">
                  写真（任意・複数可）— クリック・ドロップ・Ctrl+V で追加
                </label>

                {editModal.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editModal.photos.map((url, idx) => (
                      <div key={idx} className="relative group/photo">
                        <img src={url} alt={`photo-${idx}`}
                          className="w-[100px] h-[100px] object-cover rounded-lg border border-gray-200" />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover/photo:opacity-100 transition"
                        >✕</button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">表紙</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <label
                  className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition
                    ${photoDragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'}`}
                  onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
                  onDragLeave={() => setPhotoDragOver(false)}
                  onDrop={handlePhotoDrop}
                >
                  <svg className="w-6 h-6 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-400">
                    {photoDragOver ? 'ドロップして追加' : '写真を追加'}
                  </span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoInputChange} />
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">カテゴリ <span className="text-gray-300">（Phase 6 で追加予定）</span></label>
                <div className="border border-dashed border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-300">未設定</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">キャンセル</button>
              <button onClick={commitEdit}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 共有シート ─── */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={() => setShareOpen(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-center text-gray-700">共有</h2>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
              <span className="text-lg">📋</span> テキストをコピー
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
              <span className="text-lg">💬</span> LINEで送る
            </button>
            <a href="/mockup/readonly" target="_blank" rel="noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
              <span className="text-lg">🔗</span> 閲覧専用リンクを生成（→ 閲覧専用ページを確認）
            </a>
            <button onClick={() => setShareOpen(false)} className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-600">キャンセル</button>
          </div>
        </div>
      )}

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
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            onClick={() => setPhotoViewer(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute top-5 left-0 right-0 text-center text-white/60 text-sm">
            {viewerIdx + 1} / {viewerPhotos.length}
          </div>

          <img
            src={viewerPhotos[viewerIdx]}
            alt=""
            className="max-w-full max-h-[80vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {viewerIdx > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition"
              onClick={(e) => { e.stopPropagation(); goViewer(-1); }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {viewerIdx < viewerPhotos.length - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition"
              onClick={(e) => { e.stopPropagation(); goViewer(1); }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {viewerPhotos.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {viewerPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setPhotoViewer({ ...photoViewer, index: i }); }}
                  className={`w-2 h-2 rounded-full transition ${i === viewerIdx ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// アイテムカードコンポーネント
// ─────────────────────────────────────────────
function ItemCard({ item, onToggle, onEdit, onDelete, onOpenPhotoViewer,
  isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
  isReordering, canMoveUp, canMoveDown, onLongPress, onMoveUp, onMoveDown, onEndReorder }: {
  item: Item;
  onToggle: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onOpenPhotoViewer: (itemId: string) => void;
  isDragOver: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  isReordering: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onLongPress: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEndReorder: () => void;
}) {
  const c = item.isChecked;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hatchStyle: React.CSSProperties = c ? {
    backgroundImage: 'repeating-linear-gradient(-45deg, rgba(156,163,175,0.18) 0px, rgba(156,163,175,0.18) 2px, transparent 2px, transparent 9px)',
  } : {};

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(40);
      onLongPress(item.id);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDrop={() => onDrop(item.id)}
      onDragEnd={onDragEnd}
      className={`rounded-lg shadow flex overflow-hidden transition-all
        ${c ? 'opacity-50' : 'hover:shadow-md'}
        ${isDragOver ? 'ring-2 ring-primary-400 scale-[1.01]' : ''}
        ${isReordering ? 'ring-2 ring-primary-400 bg-primary-50' : ''}`}
    >
      {/* 左端カラーバー */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: item.categoryColor ?? 'transparent' }} />

      <div
        className={`flex items-center gap-2 px-3 flex-1 min-w-0 bg-white ${c ? 'py-1' : 'py-3'}`}
        style={c ? hatchStyle : {}}
      >
        {/* ドラッグハンドル（PC）／長押しで並び替えモード（スマホ） */}
        <div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 transition touch-none select-none p-1 -m-1"
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
        </div>

        {/* チェックボックス — onTouchEnd で1タップ動作 */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(item.id); }}
          className={`flex-shrink-0 rounded-full border-2 flex items-center justify-center transition
            ${c ? 'w-4 h-4 border-primary-400 bg-primary-400' : 'w-6 h-6 border-gray-300 hover:border-primary-400'}`}
        >
          {c && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* アイテム名 + メモ */}
        <div
          className="flex-1 min-w-0 overflow-hidden flex items-baseline gap-2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
        >
          <span className={`flex-shrink-0 ${c ? 'text-xs line-through text-gray-400' : 'text-sm text-gray-900'}`}>
            {item.name}
          </span>
          {item.note && !c && (
            <span className="text-xs text-gray-400 italic truncate">{item.note}</span>
          )}
        </div>

        {isReordering ? (
          /* ─── 並び替えモード: ▲▼✓ ─── */
          <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onMoveUp(); }}
              disabled={!canMoveUp}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold transition
                ${canMoveUp ? 'bg-primary-100 text-primary-600 active:bg-primary-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >▲</button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onMoveDown(); }}
              disabled={!canMoveDown}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold transition
                ${canMoveDown ? 'bg-primary-100 text-primary-600 active:bg-primary-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            >▼</button>
            <button
              onClick={(e) => { e.stopPropagation(); onEndReorder(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onEndReorder(); }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base bg-green-100 text-green-600 active:bg-green-200 transition"
            >✓</button>
          </div>
        ) : (
          <>
            {/* 写真サムネイル（1枚目のみ・タップでビューワー起動） */}
            {item.photos.length > 0 && !c && (
              <button
                className="flex-shrink-0 relative"
                onClick={(e) => { e.stopPropagation(); onOpenPhotoViewer(item.id); }}
                title={`写真 ${item.photos.length}枚`}
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

            {/* 数量バッジ（未完了のみ） */}
            {!c && (item.quantity > 1 || item.unit) && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                {item.quantity}{item.unit}
              </span>
            )}

            {/* ゴミ箱ボタン（常時表示） */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 active:text-red-600 transition rounded"
              title="削除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
