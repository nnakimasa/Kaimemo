/**
 * MOCKUP: ホーム画面サンプルUI
 * 確認URL: http://localhost:5173/mockup/home
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MockupHeader from './MockupHeader';

type ListItem = {
  id: string;
  name: string;
  itemCount: number;
  checkedCount: number;
  group: { id: string; name: string } | null;
  reminder: { label: string } | null;
};

const INITIAL_LISTS: ListItem[] = [
  { id: '1', name: '週末の食材', itemCount: 8, checkedCount: 3, group: { id: 'g1', name: '家族' }, reminder: { label: '3月22日(土) 09:00' } },
  { id: '2', name: '個人メモ',   itemCount: 2, checkedCount: 0, group: null, reminder: null },
  { id: '3', name: '仕事の備品', itemCount: 6, checkedCount: 1, group: { id: 'g2', name: '仕事グループ' }, reminder: { label: '3月25日(火) 10:00' } },
];

const INITIAL_HISTORY: ListItem[] = [
  { id: 'h1', name: '日用品',     itemCount: 4, checkedCount: 4, group: { id: 'g1', name: '家族' }, reminder: null },
  { id: 'h2', name: '先週の食材', itemCount: 5, checkedCount: 5, group: { id: 'g1', name: '家族' }, reminder: null },
];

function GroupBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 flex-shrink-0">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      {name}
    </span>
  );
}

const LONG_PRESS_MS = 500;

export default function HomePageMockup() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ListItem[]>(INITIAL_LISTS);
  const [history, setHistory] = useState<ListItem[]>(INITIAL_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reminderModalId, setReminderModalId] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [groupModalId, setGroupModalId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderListId, setReorderListId] = useState<string | null>(null);

  // マウスドラッグ用
  const dragIdRef = useRef<string | null>(null);
  // スマホ長押し用タイマー
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = lists.filter(
    (l) => l.name.includes(searchQuery) || (l.group?.name ?? '').includes(searchQuery)
  );

  // ─── マウス ドラッグ&ドロップ（PC） ───
  const handleDragStart = (id: string) => { dragIdRef.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (targetId: string) => {
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }
    setLists((prev) => {
      const arr = [...prev];
      const fi = arr.findIndex((l) => l.id === fromId);
      const ti = arr.findIndex((l) => l.id === targetId);
      if (fi === -1 || ti === -1) return prev;
      const [item] = arr.splice(fi, 1);
      arr.splice(ti, 0, item);
      return arr;
    });
    setDragOverId(null);
    dragIdRef.current = null;
  };

  // ─── スマホ長押し → ▲▼ 並び替え ───
  const handleHandleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(40);
      setReorderListId(id);
    }, LONG_PRESS_MS);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const moveList = (id: string, direction: 'up' | 'down') => {
    setLists((prev) => {
      const arr = [...prev];
      const filteredIds = arr
        .filter((l) => l.name.includes(searchQuery) || (l.group?.name ?? '').includes(searchQuery))
        .map((l) => l.id);
      const pos = filteredIds.indexOf(id);
      if (direction === 'up' && pos > 0) {
        const [a, b] = [arr.findIndex((l) => l.id === id), arr.findIndex((l) => l.id === filteredIds[pos - 1])];
        [arr[a], arr[b]] = [arr[b], arr[a]];
      } else if (direction === 'down' && pos < filteredIds.length - 1) {
        const [a, b] = [arr.findIndex((l) => l.id === id), arr.findIndex((l) => l.id === filteredIds[pos + 1])];
        [arr[a], arr[b]] = [arr[b], arr[a]];
      }
      return arr;
    });
  };

  // ─── 名前編集 ───
  const startEdit = (id: string, name: string) => { setEditingId(id); setEditingName(name); setOpenMenuId(null); };
  const commitEdit = (id: string) => {
    if (editingName.trim()) {
      const fn = (arr: ListItem[]) => arr.map((l) => l.id === id ? { ...l, name: editingName.trim() } : l);
      setLists(fn); setHistory(fn);
    }
    setEditingId(null);
  };

  // ─── 複製 ───
  const duplicateList = (list: ListItem, fromHistory = false) => {
    const newItem: ListItem = { ...list, id: `copy-${Date.now()}`, name: `${list.name} (コピー)`, checkedCount: 0, reminder: null };
    if (fromHistory) { setLists((p) => [...p, newItem]); }
    else { setLists((p) => { const a = [...p]; a.splice(a.findIndex((l) => l.id === list.id) + 1, 0, newItem); return a; }); }
    setOpenMenuId(null);
  };

  // ─── グループモーダル ───
  const DUMMY_GROUPS = [
    { id: 'g1', name: '家族' },
    { id: 'g2', name: '仕事グループ' },
  ];
  const openGroupModal = (list: ListItem) => { setGroupModalId(list.id); setOpenMenuId(null); };
  const saveGroup = (group: { id: string; name: string } | null) => {
    setLists((prev) => prev.map((l) => l.id !== groupModalId ? l : { ...l, group }));
    setGroupModalId(null);
  };

  // ─── リマインダーモーダルを開く ───
  const openReminderModal = (list: ListItem) => {
    setReminderModalId(list.id);
    if (list.reminder) {
      const parts = list.reminder.label.match(/(\d+)月(\d+)日.*?(\d+:\d+)/);
      if (parts) {
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        setReminderDate(`2026-${month}-${day}`);
        setReminderTime(parts[3]);
      }
    } else {
      setReminderDate('');
      setReminderTime('09:00');
    }
    setOpenMenuId(null);
  };

  const saveReminder = () => {
    if (!reminderModalId) return;
    const label = reminderDate
      ? (() => {
          const d = new Date(reminderDate);
          const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
          return `${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]}) ${reminderTime}`;
        })()
      : null;
    setLists((prev) => prev.map((l) => l.id !== reminderModalId ? l : { ...l, reminder: label ? { label } : null }));
    setReminderModalId(null);
  };

  // ─── 削除 ───
  const deleteList = (id: string, fromHistory = false) => {
    if (fromHistory) setHistory((p) => p.filter((l) => l.id !== id));
    else setLists((p) => p.filter((l) => l.id !== id));
    setOpenMenuId(null);
  };

  // ─── メニュー外クリック・タップで閉じる ───
  const handlePageClick = () => { setOpenMenuId(null); setReorderListId(null); };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" onClick={handlePageClick}>
      {/* ─── ヘッダー ─── */}
      <MockupHeader activeLabel="リスト" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
        {/* ─── タイトル + 新規ボタン ─── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">買い物リスト</h1>
          <button
            onClick={(e) => { e.stopPropagation(); setIsCreating(true); }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            + 新規リスト
          </button>
        </div>

        {/* ─── 検索バー ─── */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="リスト名やグループ名で検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ─── 新規リスト作成フォーム ─── */}
        {isCreating && (
          <form
            onSubmit={(e) => { e.preventDefault(); setIsCreating(false); setNewListName(''); }}
            className="bg-white rounded-lg shadow p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* スマホ: 入力1行 → ボタン2列 / PC: 全部1行 */}
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="リスト名を入力..."
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm mb-2 sm:mb-0"
            />
            <div className="flex gap-2 mt-2 sm:mt-0 sm:inline-flex sm:ml-2">
              <button type="submit"
                className="flex-1 sm:flex-none bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm">
                作成
              </button>
              <button type="button"
                onClick={() => { setIsCreating(false); setNewListName(''); }}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                キャンセル
              </button>
            </div>
          </form>
        )}

        {/* ─── リスト一覧 ─── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((list, idx) => {
              const progress = list.itemCount > 0 ? Math.round((list.checkedCount / list.itemCount) * 100) : 0;
              const isComplete = list.itemCount > 0 && list.checkedCount === list.itemCount;
              const isDragOver = dragOverId === list.id;
              const isReordering = reorderListId === list.id;
              const canMoveUp = idx > 0;
              const canMoveDown = idx < filtered.length - 1;

              return (
                <div
                  key={list.id}
                  data-list-id={list.id}
                  draggable
                  onDragStart={() => handleDragStart(list.id)}
                  onDragOver={(e) => handleDragOver(e, list.id)}
                  onDrop={() => handleDrop(list.id)}
                  onDragEnd={() => { setDragOverId(null); dragIdRef.current = null; }}
                  className={`bg-white rounded-lg shadow transition relative select-none
                    ${isDragOver ? 'ring-2 ring-primary-400 scale-[1.02]' : 'hover:shadow-md'}
                    ${isReordering ? 'ring-2 ring-primary-400 bg-primary-50' : ''}`}
                >
                  <div className="flex items-center p-4 gap-2">
                    {/* ドラッグハンドル（PC）／長押しで並び替えモード（スマホ） */}
                    <div
                      className="flex-shrink-0 text-gray-300 hover:text-gray-500 px-1 cursor-grab active:cursor-grabbing touch-none"
                      onTouchStart={() => handleHandleTouchStart(list.id)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                        <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                      </svg>
                    </div>

                    {/* リスト情報 */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => { if (editingId !== list.id) { e.stopPropagation(); navigate('/mockup/list'); } }}>
                      {editingId === list.id ? (
                        <input type="text" value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => commitEdit(list.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(list.id); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus onClick={(e) => e.stopPropagation()}
                          className="w-full border border-primary-400 rounded px-2 py-0.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className={`text-base font-semibold truncate ${isComplete ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {list.name}
                          </h2>
                          {list.group && <GroupBadge name={list.group.name} />}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {list.itemCount === 0 ? 'アイテムなし' : isComplete ? '✅ 完了' : `${list.checkedCount} / ${list.itemCount} 完了`}
                        </span>
                        {list.itemCount > 0 && (
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary-500'}`}
                              style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                      {list.reminder && (
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-orange-500">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <span>{list.reminder.label}</span>
                        </div>
                      )}
                    </div>

                    {isReordering ? (
                      /* ─── 並び替えモード: ▲▼✓ ─── */
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveList(list.id, 'up'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); moveList(list.id, 'up'); }}
                          disabled={!canMoveUp}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold transition
                            ${canMoveUp ? 'bg-primary-100 text-primary-600 active:bg-primary-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >▲</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveList(list.id, 'down'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); moveList(list.id, 'down'); }}
                          disabled={!canMoveDown}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold transition
                            ${canMoveDown ? 'bg-primary-100 text-primary-600 active:bg-primary-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >▼</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setReorderListId(null); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setReorderListId(null); }}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-base bg-green-100 text-green-600 active:bg-green-200 transition"
                        >✓</button>
                      </div>
                    ) : (
                      /* ─── ⋮ メニューボタン（常時表示） ─── */
                      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === list.id ? null : list.id); }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
                          title="メニュー"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                          </svg>
                        </button>
                        {openMenuId === list.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1"
                            onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => startEdit(list.id, list.name)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              名前を変更
                            </button>
                            <button onClick={() => duplicateList(list)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              複製
                            </button>
                            <button onClick={() => openReminderModal(list)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              リマインダー設定
                            </button>
                            <button onClick={() => openGroupModal(list)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              グループ設定
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => deleteList(list.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              削除
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            {searchQuery
              ? <p className="text-gray-500">「{searchQuery}」に一致するリストがありません</p>
              : <p className="text-gray-500">まだリストがありません。新規リストを作成してください。</p>}
          </div>
        )}

        {/* ─── 履歴セクション ─── */}
        <div className="border-t border-gray-200 pt-4">
          <button onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition w-full text-left">
            <svg className={`w-4 h-4 transition-transform ${historyOpen ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>履歴 ({history.length})</span>
            <span className="text-xs text-gray-300 ml-1">— 完了から12時間以上経過</span>
          </button>

          {historyOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {history.map((list) => (
                <div key={list.id} className={`bg-gray-50 rounded-lg border border-gray-200 relative opacity-70 hover:opacity-90 transition ${openMenuId === list.id ? 'z-10' : ''}`}>
                  <div className="flex items-center p-4 gap-2">
                    <div className="flex-1 min-w-0">
                      {editingId === list.id ? (
                        <input type="text" value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => commitEdit(list.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(list.id); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus onClick={(e) => e.stopPropagation()}
                          className="w-full border border-primary-400 rounded px-2 py-0.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-semibold text-gray-400 line-through truncate">{list.name}</h2>
                          {list.group && <GroupBadge name={list.group.name} />}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">✅ 完了 · {list.itemCount}アイテム</p>
                    </div>

                    {/* ⋮ メニュー（履歴・常時表示） */}
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === list.id ? null : list.id); }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                      {openMenuId === list.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1"
                          onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => startEdit(list.id, list.name)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            名前を変更
                          </button>
                          <button onClick={() => duplicateList(list, true)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            複製してリストに追加
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button onClick={() => deleteList(list.id, true)}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
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
              ))}
            </div>
          )}
        </div>

        {/* ─── グループ設定モーダル ─── */}
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
                {/* グループなし */}
                <button onClick={() => saveGroup(null)}
                  className="w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">グループなし</span>
                </button>
                {DUMMY_GROUPS.map((g) => {
                  const current = lists.find((l) => l.id === groupModalId)?.group;
                  const isSelected = current?.id === g.id;
                  return (
                    <button key={g.id} onClick={() => saveGroup(g)}
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

        {/* ─── リマインダー設定モーダル ─── */}
        {reminderModalId && (
          <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
            onClick={() => setReminderModalId(null)}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm"
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">通知日</label>
                  <input type="date" value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">通知時刻</label>
                  <input type="time" value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                {!reminderDate && (
                  <p className="text-xs text-gray-400">日付を設定しない場合、リマインダーは削除されます。</p>
                )}
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setReminderModalId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                  キャンセル
                </button>
                <button onClick={saveReminder}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── モックアップ注記 ─── */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <strong>📋 モックアップ</strong> — 確認ポイント:
          ⋮メニュー常時表示 / 並び替え: PCはドラッグ、スマホは左端ハンドルを長押し（0.5秒）→▲▼で移動→✓で完了 /
          リスト作成フォームのスマホ表示（入力1行→ボタン2列）
        </div>
      </main>
    </div>
  );
}
