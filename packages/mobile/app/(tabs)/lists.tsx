// リスト一覧タブ (/lists)
import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Link } from 'expo-router';
import { useLists, useCreateList, useDeleteList } from '../../hooks/useLists';

export default function HomeScreen() {
  const { data: lists, isLoading, error, refetch } = useLists();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createList.mutateAsync({ name: newListName.trim() });
      setNewListName('');
      setIsCreating(false);
    } catch {
      Alert.alert('エラー', 'リストの作成に失敗しました');
    }
  };

  const handleDeleteList = (id: string, name: string) => {
    Alert.alert('確認', `"${name}"を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: async () => {
          try { await deleteList.mutateAsync(id); }
          catch { Alert.alert('エラー', '削除に失敗しました'); }
        },
      },
    ]);
  };

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  if (error) return <View style={s.center}><Text style={s.errorText}>エラーが発生しました</Text></View>;

  return (
    <View style={s.container}>
      {!isCreating && (
        <TouchableOpacity style={s.addButton} onPress={() => setIsCreating(true)}>
          <Text style={s.addButtonText}>+ 新規リスト</Text>
        </TouchableOpacity>
      )}
      {isCreating && (
        <View style={s.createForm}>
          <TextInput style={s.input} value={newListName} onChangeText={setNewListName}
            placeholder="リスト名を入力..." autoFocus />
          <View style={s.createButtons}>
            <TouchableOpacity style={s.createButton} onPress={handleCreateList} disabled={createList.isPending}>
              <Text style={s.createButtonText}>{createList.isPending ? '作成中...' : '作成'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelButton} onPress={() => { setIsCreating(false); setNewListName(''); }}>
              <Text style={s.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
        renderItem={({ item }) => (
          <Link href={`/lists/${item.id}`} asChild>
            <TouchableOpacity style={s.listItem} onLongPress={() => handleDeleteList(item.id, item.name)}>
              <View style={s.listContent}>
                <Text style={s.listName}>{item.name}</Text>
                <Text style={s.listCount}>{item.itemCount} アイテム</Text>
              </View>
              <Text style={s.chevron}>{'>'}</Text>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>まだリストがありません{'\n'}新規リストを作成してください</Text>
          </View>
        }
        contentContainerStyle={s.listContainer}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#dc2626', fontSize: 16 },
  addButton: { backgroundColor: '#16a34a', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  createForm: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  createButtons: { flexDirection: 'row', gap: 8 },
  createButton: { flex: 1, backgroundColor: '#16a34a', padding: 12, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: '#fff', fontWeight: '600' },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#6b7280' },
  listContainer: { padding: 16, paddingTop: 0 },
  listItem: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  listContent: { flex: 1 },
  listName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  listCount: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  chevron: { fontSize: 20, color: '#9ca3af', marginLeft: 8 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
});
