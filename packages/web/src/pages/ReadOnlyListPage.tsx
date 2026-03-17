import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareApi } from '../services/api';
import type { Item } from '@kaimemo/shared';

type ReadOnlyList = {
  id: string;
  name: string;
  group: { id: string; name: string } | null;
  updatedAt: string;
  itemCount: number;
  checkedCount: number;
  items: Item[];
};

function formatTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function ReadOnlyListPage() {
  const { token } = useParams<{ token: string }>();
  const [list, setList] = useState<ReadOnlyList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const res = await shareApi.getReadOnlyList(token);
      if (res.data?.list) {
        setList(res.data.list);
        setError(null);
      } else {
        setError('リストが見つかりません。リンクが無効か期限切れの可能性があります。');
      }
    } catch {
      setError('読み込みに失敗しました。');
    } finally {
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchList();
    // 30秒ポーリング
    const interval = setInterval(fetchList, 30000);
    return () => clearInterval(interval);
  }, [fetchList]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-primary-600 text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <span className="text-xl font-bold">Kaimemo</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">閲覧専用</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <p className="text-gray-500">{error}</p>
            <Link to="/login" className="text-primary-600 hover:underline text-sm">
              ログインして自分のリストを見る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progress = list.itemCount > 0 ? Math.round((list.checkedCount / list.itemCount) * 100) : 0;
  const unchecked = list.items.filter((i) => !i.isChecked);
  const checked = list.items.filter((i) => i.isChecked);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Kaimemo</span>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">閲覧専用</span>
            <Link
              to="/login"
              className="text-xs bg-white text-primary-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              ログインして編集
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
        {/* リスト情報 */}
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{list.name}</h1>
              {list.group && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1">
                  {list.group.name}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {list.checkedCount} / {list.itemCount}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>最終更新: {formatTime(list.updatedAt)}</span>
            <button
              onClick={fetchList}
              disabled={isRefreshing}
              className="flex items-center gap-1 hover:text-primary-600 transition disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              今すぐ更新
            </button>
          </div>
        </div>

        {/* 未チェックアイテム */}
        {unchecked.length > 0 && (
          <div className="space-y-1">
            {unchecked.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm flex items-stretch overflow-hidden">
                <div className="w-1 flex-shrink-0" style={{ backgroundColor: (item as any).categoryColor || 'transparent' }} />
                <div className="flex items-center gap-3 px-3 py-3 flex-1 min-w-0">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-800">{item.name}</span>
                    {item.note && (
                      <p className="text-xs text-gray-400 truncate">{item.note}</p>
                    )}
                  </div>
                  {(item.quantity > 1 || item.unit) && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      x{item.quantity}{item.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* チェック済みアイテム */}
        {checked.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 px-1">完了済み</p>
            {checked.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm flex items-stretch overflow-hidden opacity-50">
                <div className="w-1 flex-shrink-0 bg-transparent" />
                <div className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0"
                  style={{ background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)' }}>
                  <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-400 line-through">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {list.items.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">アイテムがありません</div>
        )}

        {/* Kaimemo 登録誘導バナー */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center space-y-2">
          <p className="text-sm font-semibold text-primary-800">Kaimemoで買い物リストを共有しよう</p>
          <p className="text-xs text-primary-600">アイテムの追加・チェック・グループ共有が無料で使えます</p>
          <Link
            to="/login"
            className="inline-block bg-primary-600 text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            無料で始める
          </Link>
        </div>
      </main>
    </div>
  );
}
