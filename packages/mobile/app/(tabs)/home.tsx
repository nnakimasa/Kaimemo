// リスト一覧タブ (/home)
import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
  Modal, TouchableWithoutFeedback, Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLists, useCreateList, useDeleteList, useUpdateList } from '../../hooks/useLists';
import { useGroups } from '../../hooks/useGroups';
import type { ListWithCount } from '@kaimemo/shared';

type ListWithGroup = ListWithCount & {
  group: { id: string; name: string } | null;
};

type ReminderData = { date: string; time: string };

export default function HomeScreen() {
  const { data: listsRaw, isLoading, error, refetch } = useLists();
  const lists = (listsRaw ?? []) as ListWithGroup[];
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const updateList = useUpdateList();
  const { data: groups } = useGroups();

  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [groupModalId, setGroupModalId] = useState<string | null>(null);
  const [reminderModalId, setReminderModalId] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  // ローカルリマインダー（APIは Phase 5 で実装予定）
  const [reminders, setReminders] = useState<Record<string, ReminderData | null>>({});

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
    setMenuId(null);
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

  const handleDuplicate = async (id: string, name: string) => {
    setMenuId(null);
    try {
      await createList.mutateAsync({ name: `${name} のコピー` });
    } catch {
      Alert.alert('エラー', '複製に失敗しました');
    }
  };

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return;
    try {
      await updateList.mutateAsync({ id: renameId, name: renameName.trim() });
      setRenameId(null);
    } catch {
      Alert.alert('エラー', '名前変更に失敗しました');
    }
  };

  const handleSetGroup = async (listId: string, groupId: string | null) => {
    setGroupModalId(null);
    try {
      await updateList.mutateAsync({ id: listId, groupId });
    } catch {
      Alert.alert('エラー', 'グループ設定に失敗しました');
    }
  };

  const openReminderModal = (listId: string) => {
    const existing = reminders[listId];
    setReminderDate(existing?.date ?? '');
    setReminderTime(existing?.time ?? '09:00');
    setReminderModalId(listId);
    setMenuId(null);
  };

  const saveReminder = () => {
    if (!reminderModalId) return;
    setReminders(prev => ({
      ...prev,
      [reminderModalId]: reminderDate ? { date: reminderDate, time: reminderTime } : null,
    }));
    setReminderModalId(null);
  };

  const formatReminderLabel = (data: ReminderData): string => {
    const d = new Date(data.date);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]}) ${data.time}`;
  };

  const filteredLists = lists.filter(list =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (list.group?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  if (error) return <View style={s.center}><Text style={s.errorText}>エラーが発生しました</Text><Text style={{ fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>{error.message}</Text></View>;

  return (
    <View style={s.container}>
      {/* 検索バー */}
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="リスト名・グループ名で検索..."
          clearButtonMode="while-editing"
        />
      </View>

      {!isCreating && (
        <TouchableOpacity style={s.addButton} onPress={() => setIsCreating(true)}>
          <Text style={s.addButtonText}>+ 新規リスト</Text>
        </TouchableOpacity>
      )}

      {isCreating && (
        <View style={s.createForm}>
          <TextInput style={s.input} value={newListName} onChangeText={setNewListName}
            placeholder="リスト名を入力..." autoFocus />
          <View style={s.rowButtons}>
            <TouchableOpacity style={s.saveButton} onPress={handleCreateList} disabled={createList.isPending}>
              <Text style={s.saveButtonText}>{createList.isPending ? '作成中...' : '作成'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelButton} onPress={() => { setIsCreating(false); setNewListName(''); }}>
              <Text style={s.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={filteredLists}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
        renderItem={({ item }) => {
          const progress = item.itemCount > 0 ? item.checkedCount / item.itemCount : 0;
          const isComplete = item.itemCount > 0 && item.checkedCount === item.itemCount;
          const reminder = reminders[item.id];
          return (
            <View style={s.listCard}>
              <Link href={`/lists/${item.id}`} asChild>
                <TouchableOpacity style={s.listContent}>
                  {/* タイトル行 */}
                  <View style={s.titleRow}>
                    <Text style={[s.listName, isComplete && s.listNameComplete]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.group && (
                      <View style={s.groupBadge}>
                        <Ionicons name="people-outline" size={10} color="#2563eb" />
                        <Text style={s.groupBadgeText}>{item.group.name}</Text>
                      </View>
                    )}
                  </View>

                  {/* 進捗 */}
                  <View style={s.progressRow}>
                    <Text style={s.listCount}>
                      {item.itemCount === 0
                        ? 'アイテムなし'
                        : isComplete
                        ? '✅ 完了'
                        : `${item.checkedCount} / ${item.itemCount} 完了`}
                    </Text>
                  </View>
                  {item.itemCount > 0 && (
                    <View style={s.progressTrack}>
                      <View style={[
                        s.progressFill,
                        { width: `${Math.round(progress * 100)}%` as `${number}%` },
                        isComplete && s.progressFillComplete,
                      ]} />
                    </View>
                  )}

                  {/* リマインダー */}
                  {reminder && (
                    <View style={s.reminderRow}>
                      <Ionicons name="notifications-outline" size={12} color="#f97316" />
                      <Text style={s.reminderText}>{formatReminderLabel(reminder)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Link>
              <TouchableOpacity style={s.menuBtn} onPress={() => setMenuId(item.id)}>
                <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {searchQuery
                ? `「${searchQuery}」に一致するリストがありません`
                : 'まだリストがありません\n新規リストを作成してください'}
            </Text>
          </View>
        }
        contentContainerStyle={s.listContainer}
      />

      {/* ⋮ メニューモーダル */}
      <Modal visible={menuId !== null} transparent animationType="fade" onRequestClose={() => setMenuId(null)}>
        <TouchableWithoutFeedback onPress={() => setMenuId(null)}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={s.sheet}>
                <TouchableOpacity style={s.menuItem} onPress={() => {
                  const list = lists.find(l => l.id === menuId);
                  if (list) { setRenameName(list.name); setRenameId(list.id); }
                  setMenuId(null);
                }}>
                  <Ionicons name="pencil-outline" size={18} color="#374151" />
                  <Text style={s.menuItemText}>名前を変更</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => {
                  const list = lists.find(l => l.id === menuId);
                  if (list) handleDuplicate(list.id, list.name);
                }}>
                  <Ionicons name="copy-outline" size={18} color="#374151" />
                  <Text style={s.menuItemText}>複製</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => {
                  const id = menuId;
                  setMenuId(null);
                  setGroupModalId(id);
                }}>
                  <Ionicons name="people-outline" size={18} color="#2563eb" />
                  <Text style={[s.menuItemText, { color: '#2563eb' }]}>グループ設定</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => {
                  const id = menuId!;
                  openReminderModal(id);
                }}>
                  <Ionicons name="notifications-outline" size={18} color="#f97316" />
                  <Text style={[s.menuItemText, { color: '#f97316' }]}>リマインダー設定</Text>
                </TouchableOpacity>
                <View style={s.menuDivider} />
                <TouchableOpacity style={s.menuItem} onPress={() => {
                  const list = lists.find(l => l.id === menuId);
                  if (list) handleDeleteList(list.id, list.name);
                }}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[s.menuItemText, s.menuItemDanger]}>削除</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 名前変更モーダル */}
      <Modal visible={renameId !== null} transparent animationType="fade" onRequestClose={() => setRenameId(null)}>
        <TouchableWithoutFeedback onPress={() => setRenameId(null)}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={s.dialogSheet}>
                <Text style={s.dialogTitle}>名前を変更</Text>
                <TextInput
                  style={s.dialogInput}
                  value={renameName}
                  onChangeText={setRenameName}
                  autoFocus
                  selectTextOnFocus
                  returnKeyType="done"
                  onSubmitEditing={handleRename}
                />
                <View style={s.rowButtons}>
                  <TouchableOpacity style={s.cancelButton} onPress={() => setRenameId(null)}>
                    <Text style={s.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveButton} onPress={handleRename} disabled={updateList.isPending}>
                    <Text style={s.saveButtonText}>{updateList.isPending ? '保存中...' : '保存'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* グループ設定モーダル */}
      <Modal visible={groupModalId !== null} transparent animationType="slide" onRequestClose={() => setGroupModalId(null)}>
        <TouchableWithoutFeedback onPress={() => setGroupModalId(null)}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={s.sheet}>
                <View style={s.sheetHeader}>
                  <Text style={s.sheetTitle}>グループ設定</Text>
                  <TouchableOpacity onPress={() => setGroupModalId(null)}>
                    <Ionicons name="close" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {/* グループなし */}
                <TouchableOpacity style={s.groupOption} onPress={() => handleSetGroup(groupModalId!, null)}>
                  <View style={s.groupOptionIcon}>
                    <Ionicons name="ban-outline" size={18} color="#9ca3af" />
                  </View>
                  <Text style={s.groupOptionText}>グループなし</Text>
                  {lists.find(l => l.id === groupModalId)?.groupId === null && (
                    <Ionicons name="checkmark" size={18} color="#16a34a" style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
                {(groups ?? []).map(g => {
                  const current = lists.find(l => l.id === groupModalId);
                  const isSelected = current?.groupId === g.id;
                  return (
                    <TouchableOpacity key={g.id} style={[s.groupOption, isSelected && s.groupOptionSelected]}
                      onPress={() => handleSetGroup(groupModalId!, g.id)}>
                      <View style={s.groupOptionIconBlue}>
                        <Ionicons name="people-outline" size={18} color="#2563eb" />
                      </View>
                      <Text style={[s.groupOptionText, isSelected && s.groupOptionTextSelected]}>{g.name}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#16a34a" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                <View style={s.sheetFooter}>
                  <TouchableOpacity style={s.cancelButton} onPress={() => setGroupModalId(null)}>
                    <Text style={s.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* リマインダー設定モーダル */}
      <Modal visible={reminderModalId !== null} transparent animationType="slide" onRequestClose={() => setReminderModalId(null)}>
        <TouchableWithoutFeedback onPress={() => setReminderModalId(null)}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={s.dialogSheet}>
                <View style={s.sheetHeader}>
                  <Text style={s.sheetTitle}>リマインダー設定</Text>
                  <TouchableOpacity onPress={() => setReminderModalId(null)}>
                    <Ionicons name="close" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <Text style={s.fieldLabel}>通知日</Text>
                <TextInput
                  style={s.dialogInput}
                  value={reminderDate}
                  onChangeText={setReminderDate}
                  placeholder="例: 2026-03-22"
                  keyboardType="numeric"
                />
                <Text style={s.fieldLabel}>通知時刻</Text>
                <TextInput
                  style={s.dialogInput}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                />
                {!reminderDate && (
                  <Text style={s.hintText}>日付を設定しない場合、リマインダーは削除されます</Text>
                )}
                <View style={s.rowButtons}>
                  <TouchableOpacity style={s.cancelButton} onPress={() => setReminderModalId(null)}>
                    <Text style={s.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveButton} onPress={saveReminder}>
                    <Text style={s.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#dc2626', fontSize: 16 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },

  addButton: { backgroundColor: '#16a34a', marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  createForm: { backgroundColor: '#fff', margin: 12, marginBottom: 8, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  rowButtons: { flexDirection: 'row', gap: 8 },
  saveButton: { flex: 1, backgroundColor: '#16a34a', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  cancelButtonText: { color: '#6b7280' },

  listContainer: { padding: 12, paddingTop: 4 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  listContent: { flex: 1, padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  listName: { fontSize: 15, fontWeight: '600', color: '#111827', flexShrink: 1 },
  listNameComplete: { color: '#9ca3af', textDecorationLine: 'line-through' },
  groupBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  groupBadgeText: { fontSize: 11, color: '#2563eb' },
  progressRow: { marginTop: 4 },
  listCount: { fontSize: 12, color: '#9ca3af' },
  progressTrack: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginTop: 6 },
  progressFill: { height: 4, backgroundColor: '#16a34a', borderRadius: 2 },
  progressFillComplete: { backgroundColor: '#22c55e' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  reminderText: { fontSize: 11, color: '#f97316' },
  menuBtn: { padding: 16 },

  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 24 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },

  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },

  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 12 },
  menuItemText: { fontSize: 15, color: '#374151' },
  menuItemDanger: { color: '#ef4444' },
  menuDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  groupOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  groupOptionSelected: { backgroundColor: '#f0fdf4' },
  groupOptionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  groupOptionIconBlue: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  groupOptionText: { fontSize: 15, color: '#374151' },
  groupOptionTextSelected: { fontWeight: '600', color: '#15803d' },

  dialogSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  dialogTitle: { fontSize: 17, fontWeight: '600', marginBottom: 14, color: '#111827' },
  dialogInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 4 },
  fieldLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, marginTop: 12 },
  hintText: { fontSize: 11, color: '#9ca3af', marginTop: 6, marginBottom: 8 },
});
