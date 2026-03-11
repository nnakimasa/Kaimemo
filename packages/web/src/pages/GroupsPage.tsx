import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroups, useCreateGroup, useDeleteGroup } from '../hooks/useGroups';
import { useAuth } from '../auth/AuthContext';

export default function GroupsPage() {
  const { data: groups, isLoading, error } = useGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await createGroup.mutateAsync({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || undefined,
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreating(false);
    } catch {
      // error handled by mutation
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('グループを削除しますか？')) return;
    try {
      await deleteGroup.mutateAsync(id);
    } catch {
      // error handled by mutation
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
        <h1 className="text-2xl font-bold">グループ</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          + 新規グループ
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateGroup}
          className="bg-white rounded-lg shadow p-4 space-y-3"
        >
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="グループ名を入力..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <input
            type="text"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            placeholder="説明（任意）"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createGroup.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {createGroup.isPending ? '作成中...' : '作成'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewGroupName('');
                setNewGroupDesc('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {groups && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center p-4">
                <Link to={`/groups/${group.id}`} className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {group.name}
                  </h2>
                  {group.description && (
                    <p className="text-sm text-gray-500 truncate">{group.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-400">
                      {group.memberCount} メンバー
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        group.role === 'owner'
                          ? 'bg-primary-100 text-primary-700'
                          : group.role === 'editor'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {group.role === 'owner'
                        ? 'オーナー'
                        : group.role === 'editor'
                        ? '編集者'
                        : '閲覧者'}
                    </span>
                  </div>
                </Link>
                {group.ownerId === user?.id && (
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 transition"
                    title="削除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            まだグループがありません。新規グループを作成してください。
          </p>
        </div>
      )}
    </div>
  );
}
