import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJoinGroup } from '../hooks/useGroups';

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const joinGroup = useJoinGroup();
  const [status, setStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!code) return;
    handleJoin();
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;
    setStatus('joining');
    try {
      const result = await joinGroup.mutateAsync(code);
      if (result) {
        setStatus('success');
        setTimeout(() => {
          navigate(`/groups/${result.groupId}`);
        }, 1500);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'グループへの参加に失敗しました'
      );
    }
  };

  if (status === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center space-y-4 max-w-sm w-full mx-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-600">グループに参加中...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center space-y-4 max-w-sm w-full mx-4">
          <div className="text-4xl">✅</div>
          <p className="text-gray-700 font-medium">グループに参加しました！</p>
          <p className="text-sm text-gray-400">グループページに移動します...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center space-y-4 max-w-sm w-full mx-4">
          <div className="text-4xl">❌</div>
          <p className="text-red-600 font-medium">{errorMessage}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return null;
}
