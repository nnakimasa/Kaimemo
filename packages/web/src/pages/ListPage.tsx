import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useList } from '../hooks/useLists';
import { useCreateItem, useToggleItem, useDeleteItem } from '../hooks/useItems';

export default function ListPage() {
  const { id } = useParams<{ id: string }>();
  const { data: list, isLoading, error } = useList(id!);
  const createItem = useCreateItem(id!);
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();
  const [newItemName, setNewItemName] = useState('');

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      await createItem.mutateAsync({ name: newItemName.trim() });
      setNewItemName('');
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleItem = async (itemId: string, currentChecked: boolean) => {
    try {
      await toggleItem.mutateAsync({
        id: itemId,
        listId: id!,
        isChecked: !currentChecked,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ id: itemId, listId: id! });
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

  if (error || !list) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error?.message || 'リストが見つかりません'}
      </div>
    );
  }

  const uncheckedItems = list.items.filter((item) => !item.isChecked);
  const checkedItems = list.items.filter((item) => item.isChecked);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="text-gray-500 hover:text-gray-700 transition"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{list.name}</h1>
      </div>

      {list.description && (
        <p className="text-gray-600">{list.description}</p>
      )}

      {/* Add item form */}
      <form
        onSubmit={handleAddItem}
        className="bg-white rounded-lg shadow p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="アイテムを追加..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={createItem.isPending || !newItemName.trim()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {createItem.isPending ? '追加中...' : '追加'}
          </button>
        </div>
      </form>

      {/* Unchecked items */}
      {uncheckedItems.length > 0 && (
        <div className="space-y-2">
          {uncheckedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-4 flex items-center gap-3"
            >
              <button
                onClick={() => handleToggleItem(item.id, item.isChecked)}
                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary-500 transition flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-gray-900">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-gray-500 ml-2">
                    x{item.quantity}
                    {item.unit && ` ${item.unit}`}
                  </span>
                )}
                {item.note && (
                  <p className="text-sm text-gray-500 truncate">{item.note}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition flex-shrink-0"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Checked items */}
      {checkedItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500">
            完了 ({checkedItems.length})
          </h2>
          {checkedItems.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 opacity-60"
            >
              <button
                onClick={() => handleToggleItem(item.id, item.isChecked)}
                className="w-6 h-6 rounded-full border-2 border-primary-500 bg-primary-500 flex items-center justify-center flex-shrink-0"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <span className="flex-1 line-through text-gray-500">
                {item.name}
              </span>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition flex-shrink-0"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {list.items.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            まだアイテムがありません。上のフォームから追加してください。
          </p>
        </div>
      )}
    </div>
  );
}
