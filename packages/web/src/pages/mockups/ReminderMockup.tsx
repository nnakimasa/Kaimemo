/**
 * MOCKUP: ⑦ 定期リスト画面 + 定期設定モーダル
 * 確認URL: http://localhost:5173/mockup/recurring
 */
import { useState, useRef } from 'react';
import MockupHeader from './MockupHeader';

type Frequency = 'weekly' | 'biweekly' | 'monthly';
const FREQ_LABELS: Record<Frequency, string> = { weekly: '毎週', biweekly: '隔週', monthly: '毎月' };
const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'] as const;
const NTH_LABELS = ['第1', '第2', '第3', '第4', '第5'] as const;

// daysBefore: 1〜30 = N日前、0 = 1ヶ月前
type Schedule = {
  frequency: Frequency;
  weekday: number;        // 0=月〜6=日（全周期で使用）
  monthlyWeek: number;    // 1〜5（毎月のみ）
  daysBefore: number;     // 1〜30 or 0（=1ヶ月前）
  reminderTime: string | null;  // null = 通知なし
};

type RecurringList = {
  id: string;
  name: string;
  itemCount: number;
  group: { id: string; name: string } | null;
  schedule: Schedule | null;
};

function shoppingDayLabel(s: Schedule): string {
  if (s.frequency === 'monthly') {
    return `毎月${NTH_LABELS[s.monthlyWeek - 1]}${WEEKDAYS[s.weekday]}曜`;
  }
  return `${FREQ_LABELS[s.frequency]}${WEEKDAYS[s.weekday]}曜`;
}

function generationLabel(s: Schedule): string {
  if (s.daysBefore === 0) return '1ヶ月前';
  if (s.frequency === 'monthly') return `${s.daysBefore}日前`;
  const genIdx = ((s.weekday - (s.daysBefore % 7)) + 7) % 7;
  return `${s.daysBefore}日前（${WEEKDAYS[genIdx]}曜）`;
}

function scheduleLabel(s: Schedule): string {
  const reminder = s.reminderTime ? `${s.reminderTime} リマインド` : 'リマインドなし';
  return `${shoppingDayLabel(s)} ／ ${generationLabel(s)}に生成 ／ ${reminder}`;
}

const DEFAULT_SCHEDULE: Schedule = {
  frequency: 'weekly', weekday: 5, monthlyWeek: 1, daysBefore: 2, reminderTime: '09:00',
};

const INITIAL_LISTS: RecurringList[] = [
  {
    id: '1', name: '週末の食材', itemCount: 8,
    group: { id: 'g1', name: '家族' },
    schedule: { frequency: 'weekly', weekday: 5, monthlyWeek: 1, daysBefore: 2, reminderTime: '09:00' },
  },
  {
    id: '2', name: '日用品まとめ買い', itemCount: 5,
    group: null,
    schedule: { frequency: 'monthly', weekday: 5, monthlyWeek: 1, daysBefore: 7, reminderTime: '10:00' },
  },
  {
    id: '3', name: '職場のお菓子', itemCount: 3,
    group: { id: 'g2', name: '仕事グループ' },
    schedule: null,
  },
];

export default function ReminderMockup() {
  const [lists, setLists] = useState<RecurringList[]>(INITIAL_LISTS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingList, setEditingList] = useState<RecurringList | null>(null);
  const [groupModalId, setGroupModalId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [form, setForm] = useState<Schedule>({ ...DEFAULT_SCHEDULE });

  // ─── 並び替え（PC: ドラッグ / スマホ: 長押し→▲▼） ───
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderListId, setReorderListId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setDragOverId(null); dragIdRef.current = null;
  };
  const handleHandleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(40);
      setReorderListId(id);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  const moveList = (id: string, direction: 'up' | 'down') => {
    setLists((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((l) => l.id === id);
      if (direction === 'up' && idx > 0) [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      else if (direction === 'down' && idx < arr.length - 1) [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  const DUMMY_GROUPS = [
    { id: 'g1', name: '家族' },
    { id: 'g2', name: '仕事グループ' },
  ];
  const openGroupModal = (list: RecurringList) => { setGroupModalId(list.id); setOpenMenuId(null); };
  const saveGroup = (group: { id: string; name: string } | null) => {
    setLists((prev) => prev.map((l) => l.id !== groupModalId ? l : { ...l, group }));
    setGroupModalId(null);
  };

  const openScheduleModal = (list: RecurringList) => {
    setEditingList(list);
    setForm(list.schedule ? { ...list.schedule } : { ...DEFAULT_SCHEDULE });
    setOpenMenuId(null);
  };

  const saveSchedule = () => {
    if (!editingList) return;
    setLists((prev) => prev.map((l) => l.id !== editingList.id ? l : { ...l, schedule: { ...form } }));
    setEditingList(null);
  };

  const deleteList = (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    setOpenMenuId(null);
  };

  const addList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLists((prev) => [...prev, {
      id: `new-${Date.now()}`, name: newName.trim(), itemCount: 0, group: null, schedule: null,
    }]);
    setNewName(''); setIsCreating(false);
  };

  const previewText = (): string => {
    const reminder = form.reminderTime ? `当日${form.reminderTime}にリマインド` : 'リマインドなし';
    return `${shoppingDayLabel(form)}が買い物日 → ${generationLabel(form)}にリスト生成 → ${reminder}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" onClick={() => { setOpenMenuId(null); setReorderListId(null); }}>
      {/* ─── ヘッダー ─── */}
      <MockupHeader activeLabel="定期リスト" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <strong>📋 モックアップ ⑦</strong> — 定期リスト画面。
          ⋮メニュー →「定期設定」でモーダルを開いて確認。
          毎月設定時は「第N曜日」で指定可。
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">定期リスト</h1>
          <button onClick={(e) => { e.stopPropagation(); setIsCreating(true); }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium">
            + 新規定期リスト
          </button>
        </div>

        <p className="text-sm text-gray-500">
          定期的な買い物のテンプレートです。設定した周期で自動的にアクティブリストが生成され、当日リマインド通知が届きます。
        </p>

        {isCreating && (
          <form onSubmit={addList} className="bg-white rounded-lg shadow p-4" onClick={(e) => e.stopPropagation()}>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="定期リスト名を入力..." autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm mb-2 sm:mb-0" />
            <div className="flex gap-2 mt-2 sm:mt-0 sm:inline-flex sm:ml-2">
              <button type="submit" className="flex-1 sm:flex-none bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">作成</button>
              <button type="button" onClick={() => { setIsCreating(false); setNewName(''); }}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-gray-600 text-sm">キャンセル</button>
            </div>
          </form>
        )}

        {/* 定期リスト一覧 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lists.map((list, idx) => {
            const isReordering = reorderListId === list.id;
            const canMoveUp = idx > 0;
            const canMoveDown = idx < lists.length - 1;
            return (
            <div key={list.id}
              data-list-id={list.id}
              draggable
              onDragStart={() => handleDragStart(list.id)}
              onDragOver={(e) => handleDragOver(e, list.id)}
              onDrop={() => handleDrop(list.id)}
              onDragEnd={() => { setDragOverId(null); dragIdRef.current = null; }}
              className={`bg-white rounded-lg shadow transition select-none
                ${dragOverId === list.id ? 'ring-2 ring-primary-400 scale-[1.02]' : 'hover:shadow-md'}
                ${isReordering ? 'ring-2 ring-primary-400 bg-primary-50' : ''}`}
              onClick={(e) => e.stopPropagation()}>
              <div className="p-4 flex items-start gap-2">
                {/* ドラッグハンドル（PC）／長押しで並び替えモード（スマホ） */}
                <div
                  className="flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none pt-0.5"
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{list.name}</h2>
                    {list.group && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 flex-shrink-0">
                        {list.group.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">🛒 {list.itemCount}アイテム</p>
                  {list.schedule ? (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="leading-relaxed">{scheduleLabel(list.schedule)}</span>
                    </div>
                  ) : (
                    <button onClick={() => openScheduleModal(list)}
                      className="mt-2 text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      定期設定を追加
                    </button>
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
                  /* ─── ⋮ メニュー ─── */
                  <div className={`relative flex-shrink-0 ${openMenuId === list.id ? 'z-10' : ''}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === list.id ? null : list.id); }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                      </svg>
                    </button>
                    {openMenuId === list.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1">
                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          名前を変更
                        </button>
                        <button onClick={() => openScheduleModal(list)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          定期設定
                        </button>
                        <button onClick={() => openGroupModal(list)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          グループ設定
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button onClick={() => deleteList(list.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
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
          ); })}
        </div>
      </main>

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

      {/* ─── 定期設定モーダル ─── */}
      {editingList && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setEditingList(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">定期設定</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingList.name}</p>
              </div>
              <button onClick={() => setEditingList(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">

              {/* ① 購入周期 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">購入周期</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['weekly', 'biweekly', 'monthly'] as Frequency[]).map((f) => (
                    <button key={f} onClick={() => setForm({ ...form, frequency: f })}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition
                        ${form.frequency === f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              {/* ② 毎月: 第N + 曜日 */}
              {form.frequency === 'monthly' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">買い物する週</label>
                  <div className="flex gap-2">
                    {NTH_LABELS.map((label, idx) => (
                      <button key={idx} onClick={() => setForm({ ...form, monthlyWeek: idx + 1 })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition
                          ${form.monthlyWeek === idx + 1 ? 'bg-primary-50 text-primary-600 border-primary-300' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">曜日</label>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((day, idx) => (
                      <button key={idx} onClick={() => setForm({ ...form, weekday: idx })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition
                          ${form.weekday === idx
                            ? idx >= 5 ? 'bg-red-50 text-red-500 border-red-300' : 'bg-primary-50 text-primary-600 border-primary-300'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ② 毎週・隔週: 曜日のみ */}
              {form.frequency !== 'monthly' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">買い物する曜日</label>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((day, idx) => (
                      <button key={idx} onClick={() => setForm({ ...form, weekday: idx })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition
                          ${form.weekday === idx
                            ? idx >= 5 ? 'bg-red-50 text-red-500 border-red-300' : 'bg-primary-50 text-primary-600 border-primary-300'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ③ リスト生成タイミング */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">リスト生成タイミング</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">買い物日の</span>
                  <select value={form.daysBefore}
                    onChange={(e) => setForm({ ...form, daysBefore: Number(e.target.value) })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}日前</option>
                    ))}
                    <option value={0}>1ヶ月前</option>
                  </select>
                  <span className="text-sm text-gray-600">に生成</span>
                </div>
              </div>

              {/* ④ リマインダー時刻 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    リマインダー時刻
                    <span className="ml-1 font-normal normal-case text-gray-400">（買い物当日に通知）</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, reminderTime: form.reminderTime ? null : '09:00' })}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
                      ${form.reminderTime ? 'bg-primary-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
                      ${form.reminderTime ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                {form.reminderTime ? (
                  <input type="time" value={form.reminderTime}
                    onChange={(e) => setForm({ ...form, reminderTime: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                ) : (
                  <p className="text-xs text-gray-400">通知なし（当日リマインドをスキップ）</p>
                )}
              </div>

              {/* プレビュー */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-orange-700">設定内容</p>
                <p className="text-sm text-orange-700 leading-relaxed">{previewText()}</p>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditingList(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                キャンセル
              </button>
              <button onClick={saveSchedule}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
