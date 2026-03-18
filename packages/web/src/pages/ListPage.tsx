import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useList } from '../hooks/useLists';
import { useCreateItem, useToggleItem, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import { shareApi } from '../services/api';
import type { Item } from '@kaimemo/shared';

type EditModal = { id: string; name: string; quantity: number; unit: string; note: string };


export default function ListPage() {
  const { id: listId } = useParams<{ id: string }>();
  const { data: list, isLoading, error } = useList(listId!);
  const createItem = useCreateItem(listId!);
  const toggleItem = useToggleItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [newItemName, setNewItemName] = useState('');
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [readonlyLinkDone, setReadonlyLinkDone] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // ドラッグ（未チェックアイテム並び替え）
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await createItem.mutateAsync({ name: newItemName.trim() });
    setNewItemName('');
  };

  const handleToggle = (item: Item) => {
    toggleItem.mutate({ id: item.id, listId: listId!, isChecked: !item.isChecked });
  };

  const handleDelete = (itemId: string) => {
    deleteItem.mutate({ id: itemId, listId: listId! });
  };

  const openEdit = (item: Item) => {
    setEditModal({
      id: item.id,
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? '',
      note: item.note ?? '',
    });
  };

  const commitEdit = async () => {
    if (!editModal) return;
    await updateItem.mutateAsync({
      id: editModal.id,
      listId: listId!,
      name: editModal.name,
      quantity: editModal.quantity,
      unit: editModal.unit || null,
      note: editModal.note || null,
    });
    setEditModal(null);
  };

  // テキストコピー
  const handleCopyText = useCallback(async () => {
    if (!list) return;
    const unchecked = list.items.filter((i) => !i.isChecked);
    const checked = list.items.filter((i) => i.isChecked);
    const lines = [
      `【${list.name}】`,
      ...unchecked.map((i) => `□ ${i.name}${i.quantity > 1 ? ` x${i.quantity}${i.unit || ''}` : ''}`),
      ...(checked.length > 0 ? ['', '── 済み ──', ...checked.map((i) => `✓ ${i.name}`)] : []),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }, [list]);

  // 閲覧専用リンクを生成してコピー
  const handleReadonlyLink = useCallback(async () => {
    if (!listId || generatingLink) return;
    setGeneratingLink(true);
    try {
      const res = await shareApi.generateToken(listId);
      if (res.data?.token) {
        const url = `${window.location.origin}/readonly/${res.data.token}`;
        await navigator.clipboard.writeText(url);
        setReadonlyLinkDone(true);
        setTimeout(() => setReadonlyLinkDone(false), 3000);
      }
    } finally {
      setGeneratingLink(false);
    }
  }, [listId, generatingLink]);

  // LINE共有
  const handleLine = useCallback(() => {
    if (!list) return;
    const text = encodeURIComponent(`【${list.name}】\n${list.items.filter((i) => !i.isChecked).map((i) => `□ ${i.name}`).join('\n')}`);
    window.open(`https://line.me/R/msg/text/?${text}`, '_blank');
  }, [list]);

  // ─── ドラッグ&ドロップ（未チェックアイテム並び替え） ───
  const handleDragStart = (id: string) => { dragIdRef.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = async (targetId: string) => {
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId || !list) { setDragOverId(null); return; }
    const unchecked = list.items.filter((i) => !i.isChecked);
    const fi = unchecked.findIndex((i) => i.id === fromId);
    const ti = unchecked.findIndex((i) => i.id === targetId);
    if (fi === -1 || ti === -1) { setDragOverId(null); return; }
    const arr = [...unchecked];
    const [moved] = arr.splice(fi, 1);
    arr.splice(ti, 0, moved);
    const prev = arr[ti - 1]?.sortOrder ?? (arr[ti + 1]?.sortOrder ?? 0) - 2000;
    const next = arr[ti + 1]?.sortOrder ?? (arr[ti - 1]?.sortOrder ?? 0) + 2000;
    setDragOverId(null);
    dragIdRef.current = null;
    await updateItem.mutateAsync({ id: fromId, listId: listId!, sortOrder: Math.round((prev + next) / 2) } as any);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12 text-gray-500">読み込み中...</div>;
  if (error || !list) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {error?.message || 'リストが見つかりません'}
    </div>
  );

  const checkedItems = list.items.filter((i) => i.isChecked);
  const allItems = [...list.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const totalCount = list.items.length;
  const checkedCount = checkedItems.length;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  return (
    <div className="space-y-4" onClick={() => {}}>
      {/* ─── ヘッダー ─── */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-gray-500 hover:text-gray-700 transition flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{list.name}</h1>
          {totalCount > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{checkedCount} / {totalCount} 完了</span>
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition flex-shrink-0 px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          共有
        </button>
      </div>

      {/* ─── アイテム追加フォーム ─── */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="アイテムを追加..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
        <button
          type="submit"
          disabled={createItem.isPending || !newItemName.trim()}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 text-sm font-medium"
        >
          追加
        </button>
      </form>

      {/* ─── 全アイテム（位置を保持して表示） ─── */}
      <div className="space-y-1.5">
        {allItems.map((item) => {
          if (item.isChecked) {
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm flex items-stretch overflow-hidden opacity-60"
                style={{
                  backgroundImage: 'repeating-linear-gradient(-45deg, rgba(156,163,175,0.12) 0px, rgba(156,163,175,0.12) 2px, transparent 2px, transparent 9px)',
                }}
              >
                <div className="w-1 flex-shrink-0" style={{ backgroundColor: (item as any).categoryColor ?? 'transparent' }} />
                <div className="flex-1 flex items-center gap-3 px-3 py-1">
                  <button
                    onClick={() => handleToggle(item)}
                    className="w-4 h-4 rounded-full border-2 border-primary-500 bg-primary-500 flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <span className="flex-1 text-xs text-gray-400 line-through truncate">{item.name}</span>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDrop={() => handleDrop(item.id)}
              onDragEnd={() => { setDragOverId(null); dragIdRef.current = null; }}
              className={`bg-white rounded-lg shadow-sm flex items-stretch overflow-hidden transition
                ${dragOverId === item.id ? 'ring-2 ring-primary-400' : 'hover:shadow-md'}`}
            >
              <div className="w-1 flex-shrink-0" style={{ backgroundColor: (item as any).categoryColor ?? 'transparent' }} />
              <div className="flex-1 flex items-center gap-3 px-3 py-3">
                <button
                  onClick={() => handleToggle(item)}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary-500 transition flex-shrink-0"
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(item)}>
                  <span className="text-sm text-gray-900">{item.name}</span>
                  {item.note && (
                    <p className="text-xs text-gray-400 italic truncate mt-0.5">{item.note}</p>
                  )}
                </div>
                {(item.quantity > 1 || item.unit) && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                    x{item.quantity}{item.unit || ''}
                  </span>
                )}
                <button onClick={() => handleDelete(item.id)}
                  className="p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 空状態 ─── */}
      {list.items.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
          まだアイテムがありません。上のフォームから追加してください。
        </div>
      )}

      {/* ─── 編集モーダル ─── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">アイテムを編集</h2>
              <button onClick={() => setEditModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">名前</label>
                <input type="text" value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">数量</label>
                  <input type="number" min={1} value={editModal.quantity}
                    onChange={(e) => setEditModal({ ...editModal, quantity: Number(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">単位</label>
                  <input type="text" value={editModal.unit} placeholder="個・本・kg…"
                    onChange={(e) => setEditModal({ ...editModal, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">メモ</label>
                <textarea value={editModal.note} rows={2}
                  onChange={(e) => setEditModal({ ...editModal, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
              <div className="text-xs text-gray-300 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                📷 写真・カテゴリは Phase 6 で追加予定
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                キャンセル
              </button>
              <button onClick={commitEdit} disabled={updateItem.isPending}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-50">
                {updateItem.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 共有シート ─── */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={() => setShareOpen(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-2"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-center text-gray-700 mb-3">共有</h2>
            <button onClick={handleCopyText}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition">
              <span className="text-lg">{copyDone ? '✅' : '📋'}</span>
              {copyDone ? 'コピーしました！' : 'テキストをコピー'}
            </button>
            <button onClick={handleLine}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition">
              <span className="text-lg">💬</span> LINEで送る
            </button>
            <button
              onClick={handleReadonlyLink}
              disabled={generatingLink}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition disabled:opacity-50"
            >
              <span className="text-lg">{readonlyLinkDone ? '✅' : '🔗'}</span>
              {generatingLink ? '生成中...' : readonlyLinkDone ? 'リンクをコピーしました！' : '閲覧専用リンクをコピー'}
            </button>
            <button onClick={() => setShareOpen(false)}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
