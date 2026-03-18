import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLists, useCreateList, useUpdateList, useDeleteList } from '../hooks/useLists';
import { useGroups } from '../hooks/useGroups';
import type { ListWithCount } from '@kaimemo/shared';

type HomeList = ListWithCount & { group: { id: string; name: string } | null };

// ─── 小コンポーネント ───────────────────────────────────────

function GroupBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 flex-shrink-0">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {name}
    </span>
  );
}

function formatReminder(isoString: string): string {
  const d = new Date(isoString);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dow = days[d.getDay()];
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${month}月${date}日(${dow}) ${h}:${m}`;
}

// ─── メインコンポーネント ────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { data: rawLists, isLoading, error } = useLists();
  const { data: groups } = useGroups();
  const createList = useCreateList();
  const updateList = useUpdateList();
  const deleteList = useDeleteList();

  // キャスト: APIはgroupを含む
  const lists = (rawLists ?? []) as HomeList[];
  const activeLists = lists.filter((l) => !l.isArchived);
  const historyLists = lists.filter((l) => l.isArchived);

  // ─── ローカル状態 ───
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [groupModalId, setGroupModalId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // ドラッグ＆ドロップ
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // リマインダーモーダル
  const [reminderModalId, setReminderModalId] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // 完了から12時間以上経過したリストを自動アーカイブ
  useEffect(() => {
    if (!lists.length) return;
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    lists.forEach((list) => {
      if (
        !list.isArchived &&
        list.itemCount > 0 &&
        list.checkedCount === list.itemCount &&
        Date.now() - new Date(list.updatedAt).getTime() > TWELVE_HOURS
      ) {
        updateList.mutate({ id: list.id, isArchived: true });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists.map((l) => l.id).join()]);

  // ─── フィルタ ───
  const filtered = activeLists.filter(
    (l) => l.name.includes(searchQuery) || (l.group?.name ?? '').includes(searchQuery)
  );

  // ─── 操作ハンドラ ───
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList.mutateAsync({ name: newListName.trim() });
    setNewListName('');
    setIsCreating(false);
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setOpenMenuId(null);
  };

  const commitEdit = async (id: string) => {
    if (editingName.trim() && editingName !== lists.find((l) => l.id === id)?.name) {
      await updateList.mutateAsync({ id, name: editingName.trim() });
    }
    setEditingId(null);
  };

  const handleDuplicate = async (list: HomeList) => {
    setOpenMenuId(null);
    await createList.mutateAsync({ name: `${list.name} (コピー)`, groupId: list.groupId ?? undefined });
  };

  const handleArchive = async (id: string, archive: boolean) => {
    setOpenMenuId(null);
    await updateList.mutateAsync({ id, isArchived: archive });
  };

  const handleDelete = async (id: string) => {
    setOpenMenuId(null);
    if (!confirm('このリストを削除しますか？')) return;
    await deleteList.mutateAsync(id);
  };

  const handleGroupSave = async (listId: string, groupId: string | null) => {
    await updateList.mutateAsync({ id: listId, groupId });
    setGroupModalId(null);
  };

  // ─── ドラッグ&ドロップ ───
  const handleDragStart = (id: string) => { dragIdRef.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = async (targetId: string) => {
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }
    const arr = [...filtered];
    const fi = arr.findIndex((l) => l.id === fromId);
    const ti = arr.findIndex((l) => l.id === targetId);
    if (fi === -1 || ti === -1) { setDragOverId(null); return; }
    // 前後のsortOrderの中間値を計算
    const sorted = [...arr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const newArr = [...sorted];
    const [moved] = newArr.splice(fi, 1);
    newArr.splice(ti, 0, moved);
    const prev = newArr[ti - 1]?.sortOrder ?? (newArr[ti + 1]?.sortOrder ?? 0) - 2000;
    const next = newArr[ti + 1]?.sortOrder ?? (newArr[ti - 1]?.sortOrder ?? 0) + 2000;
    const newOrder = Math.round((prev + next) / 2);
    setDragOverId(null);
    dragIdRef.current = null;
    await updateList.mutateAsync({ id: fromId, sortOrder: newOrder });
  };

  // ─── ローディング・エラー ───
  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-500">読み込み中...</div>;
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        エラーが発生しました: {error.message}
      </div>
    );
  }

  // ─── リストカード ───
  const renderCard = (list: HomeList, isHistory = false) => {
    const progress = list.itemCount > 0 ? list.checkedCount / list.itemCount : 0;
    const isComplete = list.itemCount > 0 && list.checkedCount === list.itemCount;

    return (
      <div
        key={list.id}
        draggable={!isHistory}
        onDragStart={() => !isHistory && handleDragStart(list.id)}
        onDragOver={(e) => !isHistory && handleDragOver(e, list.id)}
        onDrop={() => !isHistory && handleDrop(list.id)}
        onDragEnd={() => { setDragOverId(null); dragIdRef.current = null; }}
        className={`bg-white rounded-lg shadow transition relative select-none
          ${dragOverId === list.id ? 'ring-2 ring-primary-400 scale-[1.02]' : 'hover:shadow-md'}
          ${isHistory ? 'opacity-70' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center p-4 gap-2">
          {/* ドラッグハンドル */}
          {!isHistory && (
            <div className="flex-shrink-0 text-gray-300 hover:text-gray-500 px-1 cursor-grab active:cursor-grabbing">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
              </svg>
            </div>
          )}

          {/* リスト情報 */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => editingId !== list.id && navigate(`/lists/${list.id}`)}
          >
            {editingId === list.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => commitEdit(list.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit(list.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="w-full border border-primary-400 rounded px-2 py-0.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-gray-900 truncate">{list.name}</h2>
                {list.group && <GroupBadge name={list.group.name} />}
              </div>
            )}
            {editingId !== list.id && (
              <>
                <p className="text-xs text-gray-400 mt-1">
                  {list.checkedCount} / {list.itemCount} 完了
                </p>
                {list.itemCount > 0 && (
                  <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary-500'}`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
                {(list as any).reminderAt && (
                  <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                    🔔 {formatReminder((list as any).reminderAt)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* ⋮ メニュー */}
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === list.id ? null : list.id); }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>

            {openMenuId === list.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1"
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => startEdit(list.id, list.name)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  名前を変更
                </button>
                <button onClick={() => handleDuplicate(list)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  複製
                </button>
                <button onClick={() => {
                    const r = (list as any).reminderAt;
                    if (r) {
                      const d = new Date(r);
                      setReminderDate(d.toISOString().slice(0, 10));
                      setReminderTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
                    } else {
                      setReminderDate('');
                      setReminderTime('09:00');
                    }
                    setReminderModalId(list.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  リマインダー設定
                </button>
                <button onClick={() => { setGroupModalId(list.id); setOpenMenuId(null); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  グループ設定
                </button>
                {isHistory && (
                  <button onClick={() => handleArchive(list.id, false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    アクティブに戻す
                  </button>
                )}
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => handleDelete(list.id)}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* タイトル + 新規ボタン */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">買い物リスト</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          + 新規リスト
        </button>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="リスト名やグループ名で検索..."
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 新規作成フォーム */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="リスト名を入力..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              autoFocus
            />
            <button type="submit" disabled={createList.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 text-sm">
              {createList.isPending ? '作成中...' : '作成'}
            </button>
            <button type="button" onClick={() => { setIsCreating(false); setNewListName(''); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* アクティブリスト */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((list) => renderCard(list))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {searchQuery ? `「${searchQuery}」に一致するリストはありません` : 'リストがありません。新規リストを作成してください。'}
        </div>
      )}

      {/* 履歴セクション */}
      {historyLists.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition py-1"
          >
            <svg className={`w-4 h-4 transition-transform ${historyOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            履歴 ({historyLists.length})
          </button>
          {historyOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {historyLists.map((list) => renderCard(list, true))}
            </div>
          )}
        </div>
      )}

      {/* リマインダー設定モーダル */}
      {reminderModalId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setReminderModalId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">リマインダー設定</h2>
              <button onClick={() => setReminderModalId(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">通知日</label>
                <input type="date" value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">通知時刻</label>
                <input type="time" value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setReminderModalId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                キャンセル
              </button>
              {(lists.find((l) => l.id === reminderModalId) as any)?.reminderAt && (
                <button onClick={async () => {
                    await updateList.mutateAsync({ id: reminderModalId!, reminderAt: null });
                    setReminderModalId(null);
                  }}
                  className="px-4 py-2.5 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition">
                  削除
                </button>
              )}
              <button
                disabled={!reminderDate}
                onClick={async () => {
                  if (!reminderDate) return;
                  const isoString = new Date(`${reminderDate}T${reminderTime}`).toISOString();
                  await updateList.mutateAsync({ id: reminderModalId!, reminderAt: isoString });
                  setReminderModalId(null);
                }}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-50">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* グループ設定モーダル */}
      {groupModalId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setGroupModalId(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">グループ設定</h2>
              <button onClick={() => setGroupModalId(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-2">
              <button onClick={() => handleGroupSave(groupModalId, null)}
                className="w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">グループなし</span>
              </button>
              {(groups ?? []).map((g) => {
                const current = lists.find((l) => l.id === groupModalId)?.group;
                const isSelected = current?.id === g.id;
                return (
                  <button key={g.id} onClick={() => handleGroupSave(groupModalId, g.id)}
                    className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className={`text-sm ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>{g.name}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="px-6 pb-5 pt-2 border-t border-gray-100">
              <button onClick={() => setGroupModalId(null)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
