import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGroup, useGenerateInvite, useRemoveMember, useUpdateMemberRole } from '../hooks/useGroups';
import { useAuth } from '../auth/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  owner: 'オーナー',
  editor: '編集者',
  viewer: '閲覧者',
};

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: group, isLoading, error } = useGroup(id!);
  const generateInvite = useGenerateInvite();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  const [inviteInfo, setInviteInfo] = useState<{ code: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isOwner = group?.ownerId === user?.id;

  const handleGenerateInvite = async () => {
    try {
      const result = await generateInvite.mutateAsync(id!);
      if (result) setInviteInfo(result);
    } catch {
      // error handled
    }
  };

  const handleCopyInviteLink = () => {
    if (!inviteInfo) return;
    const url = `${window.location.origin}/invite/${inviteInfo.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (userId: string, displayName: string) => {
    const isSelf = userId === user?.id;
    const msg = isSelf
      ? `グループ「${group?.name}」を退出しますか？`
      : `${displayName} をグループから除外しますか？`;
    if (!confirm(msg)) return;
    try {
      await removeMember.mutateAsync({ groupId: id!, userId });
      if (isSelf) navigate('/groups');
    } catch {
      // error handled
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await updateRole.mutateAsync({ groupId: id!, userId, role });
    } catch {
      // error handled
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        グループが見つかりません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/groups" className="text-gray-400 hover:text-gray-600">
          ← グループ一覧
        </Link>
      </div>

      {/* Group Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        {group.description && (
          <p className="text-gray-500 mt-1">{group.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">{group.memberCount} メンバー</p>
      </div>

      {/* Invite Link */}
      {(isOwner || group.members.find((m) => m.userId === user?.id)?.role === 'editor') && (
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold">招待リンク</h2>
          <button
            onClick={handleGenerateInvite}
            disabled={generateInvite.isPending}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {generateInvite.isPending ? '生成中...' : '招待リンクを生成'}
          </button>

          {inviteInfo && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-sm font-mono text-gray-700 break-all">
                {`${window.location.origin}/invite/${inviteInfo.code}`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInviteLink}
                  className="text-sm bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition"
                >
                  {copied ? 'コピーしました！' : 'コピー'}
                </button>
                <span className="text-xs text-gray-400">
                  有効期限: {new Date(inviteInfo.expiresAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">メンバー</h2>
        <div className="space-y-3">
          {group.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {member.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.user.displayName}</p>
                  <p className="text-xs text-gray-400">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && member.userId !== user?.id ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="editor">編集者</option>
                    <option value="viewer">閲覧者</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      member.role === 'owner'
                        ? 'bg-primary-100 text-primary-700'
                        : member.role === 'editor'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                )}

                {(isOwner && member.userId !== user?.id) ||
                (member.userId === user?.id && member.role !== 'owner') ? (
                  <button
                    onClick={() => handleRemoveMember(member.userId, member.user.displayName)}
                    className="text-sm text-gray-400 hover:text-red-500 transition px-2 py-1"
                  >
                    {member.userId === user?.id ? '退出' : '除外'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
