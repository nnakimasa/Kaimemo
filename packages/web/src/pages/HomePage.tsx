import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLists, useCreateList, useDeleteList } from '../hooks/useLists';

export default function HomePage() {
  const { data: lists, isLoading, error } = useLists();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      await createList.mutateAsync({ name: newListName.trim() });
      setNewListName('');
      setIsCreating(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList.mutateAsync(id);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        エラーが発生しました: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">買い物リスト</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          + 新規リスト
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateList}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="リスト名を入力..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={createList.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {createList.isPending ? '作成中...' : '作成'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewListName('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {lists && lists.length > 0 ? (
        <div className="space-y-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition"
            >
              <div className="flex items-center p-4">
                <Link
                  to={`/lists/${list.id}`}
                  className="flex-1 min-w-0"
                >
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {list.name}
                  </h2>
                  {list.description && (
                    <p className="text-sm text-gray-500 truncate">
                      {list.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    {list.itemCount} アイテム
                  </p>
                </Link>
                <button
                  onClick={() => handleDeleteList(list.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-500 transition"
                  title="削除"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            まだリストがありません。新規リストを作成してください。
          </p>
        </div>
      )}
    </div>
  );
}
