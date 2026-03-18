import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringApi, type RecurringListData } from '../../services/api';

type Frequency = 'weekly' | 'biweekly' | 'monthly';
const FREQ_LABELS: Record<Frequency, string> = { weekly: '毎週', biweekly: '隔週', monthly: '毎月' };
const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
const NTH_LABELS = ['第1', '第2', '第3', '第4', '第5'];

type Schedule = {
  frequency: Frequency;
  weekday: number;
  monthlyWeek: number;
  daysBefore: number;
  reminderTime: string | null;
};

function scheduleLabel(list: RecurringListData): string {
  const days = ['月', '火', '水', '木', '金', '土', '日'];
  const nth = ['第1', '第2', '第3', '第4', '第5'];
  const freq = list.frequency;
  const wd = days[list.weekday] ?? '?';
  let shopDay: string;
  if (freq === 'weekly') shopDay = `毎週${wd}曜`;
  else if (freq === 'biweekly') shopDay = `隔週${wd}曜`;
  else shopDay = `毎月${nth[list.monthlyWeek - 1] ?? ''}${wd}曜`;
  const gen = list.daysBefore === 0 ? '1ヶ月前' : `${list.daysBefore}日前`;
  const reminder = list.reminderTime ? `${list.reminderTime} リマインド` : 'リマインドなし';
  return `${shopDay} · ${gen}に生成 · ${reminder}`;
}

export default function RecurringScreen() {
  const qc = useQueryClient();
  const { data: lists = [], isLoading, refetch } = useQuery({
    queryKey: ['recurring-lists'],
    queryFn: async () => {
      const res = await recurringApi.getAll();
      if (res.error) throw new Error(res.error.message);
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => recurringApi.create({ name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Schedule>) => recurringApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists'] }),
  });
  const generateMutation = useMutation({
    mutationFn: (id: string) => recurringApi.generate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-lists'] });
      qc.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [scheduleList, setScheduleList] = useState<RecurringListData | null>(null);
  const [form, setForm] = useState<Schedule>({ frequency: 'weekly', weekday: 5, monthlyWeek: 1, daysBefore: 2, reminderTime: '09:00' });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMutation.mutateAsync(newName.trim());
    setNewName(''); setIsCreating(false);
  };

  const openSchedule = (list: RecurringListData) => {
    setForm({ frequency: list.frequency as Frequency, weekday: list.weekday, monthlyWeek: list.monthlyWeek, daysBefore: list.daysBefore, reminderTime: list.reminderTime });
    setScheduleList(list);
  };

  const saveSchedule = async () => {
    if (!scheduleList) return;
    await updateMutation.mutateAsync({ id: scheduleList.id, ...form });
    setScheduleList(null);
  };

  const handleDelete = (list: RecurringListData) => {
    Alert.alert('削除確認', `「${list.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteMutation.mutate(list.id) },
    ]);
  };

  const handleGenerate = (list: RecurringListData) => {
    Alert.alert('今すぐ生成', `「${list.name}」からリストを生成しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '生成する', onPress: async () => {
        await generateMutation.mutateAsync(list.id);
        Alert.alert('完了', 'リストを生成しました。ホームに追加されました。');
      }},
    ]);
  };

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color="#16a34a" /></View>;

  return (
    <View style={s.container}>
      {isCreating ? (
        <View style={s.createForm}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="定期リスト名を入力..."
            autoFocus
            style={s.createInput}
          />
          <View style={s.createButtons}>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}>
              <Text style={s.createBtnText}>作成</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setIsCreating(false); setNewName(''); }}>
              <Text style={s.cancelBtnText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.addButton} onPress={() => setIsCreating(true)}>
          <Text style={s.addButtonText}>+ 新規定期リスト</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.info}>
              <View style={s.nameRow}>
                <Text style={s.name}>{item.name}</Text>
                {item.group && (
                  <View style={s.groupBadge}>
                    <Text style={s.groupText}>{item.group.name}</Text>
                  </View>
                )}
              </View>
              <Text style={s.itemCount}>🛒 {item.itemCount}アイテム</Text>
              <View style={s.scheduleRow}>
                <Ionicons
                  name={item.nextGenerationAt ? 'notifications-outline' : 'add-circle-outline'}
                  size={13}
                  color={item.nextGenerationAt ? '#f97316' : '#9ca3af'}
                />
                <Text style={[s.schedule, !item.nextGenerationAt && s.scheduleUnset]}>
                  {item.nextGenerationAt ? scheduleLabel(item) : '定期設定なし'}
                </Text>
              </View>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => openSchedule(item)}>
                <Ionicons name="settings-outline" size={18} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={() => handleGenerate(item)}>
                <Ionicons name="play-outline" size={18} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="repeat-outline" size={48} color="#d1d5db" />
            <Text style={s.emptyText}>定期リストがありません{'\n'}上のボタンで作成してください</Text>
          </View>
        }
      />

      {/* 定期設定モーダル */}
      <Modal visible={!!scheduleList} transparent animationType="fade" onRequestClose={() => setScheduleList(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>定期設定</Text>
                <Text style={s.modalSubtitle}>{scheduleList?.name}</Text>
              </View>

              {/* 購入周期 */}
              <Text style={s.sectionLabel}>購入周期</Text>
              <View style={s.row}>
                {(['weekly', 'biweekly', 'monthly'] as Frequency[]).map((f) => (
                  <TouchableOpacity key={f} style={[s.chip, form.frequency === f && s.chipActive]}
                    onPress={() => setForm({ ...form, frequency: f })}>
                    <Text style={[s.chipText, form.frequency === f && s.chipTextActive]}>{FREQ_LABELS[f]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 毎月: 第N */}
              {form.frequency === 'monthly' && (
                <>
                  <Text style={s.sectionLabel}>週</Text>
                  <View style={s.row}>
                    {NTH_LABELS.map((label, idx) => (
                      <TouchableOpacity key={idx} style={[s.chip, form.monthlyWeek === idx + 1 && s.chipActive]}
                        onPress={() => setForm({ ...form, monthlyWeek: idx + 1 })}>
                        <Text style={[s.chipText, form.monthlyWeek === idx + 1 && s.chipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* 曜日 */}
              <Text style={s.sectionLabel}>曜日</Text>
              <View style={s.row}>
                {WEEKDAYS.map((day, idx) => (
                  <TouchableOpacity key={idx} style={[s.dayChip, form.weekday === idx && s.chipActive]}
                    onPress={() => setForm({ ...form, weekday: idx })}>
                    <Text style={[s.chipText, form.weekday === idx && s.chipTextActive]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 生成タイミング */}
              <Text style={s.sectionLabel}>リスト生成タイミング</Text>
              <View style={s.row}>
                {[1, 2, 3, 5, 7, 14, 30].map((d) => (
                  <TouchableOpacity key={d} style={[s.chip, form.daysBefore === d && s.chipActive]}
                    onPress={() => setForm({ ...form, daysBefore: d })}>
                    <Text style={[s.chipText, form.daysBefore === d && s.chipTextActive]}>{d}日前</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* リマインダー */}
              <View style={s.reminderRow}>
                <Text style={s.sectionLabel}>リマインダー</Text>
                <TouchableOpacity onPress={() => setForm({ ...form, reminderTime: form.reminderTime ? null : '09:00' })}
                  style={[s.toggle, form.reminderTime ? s.toggleOn : s.toggleOff]}>
                  <View style={[s.toggleThumb, form.reminderTime ? s.toggleThumbOn : s.toggleThumbOff]} />
                </TouchableOpacity>
              </View>
              {form.reminderTime && (
                <Text style={s.reminderNote}>当日 {form.reminderTime} に通知</Text>
              )}
            </ScrollView>

            <View style={s.modalButtons}>
              <TouchableOpacity style={s.cancelBtn2} onPress={() => setScheduleList(null)}>
                <Text style={s.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={saveSchedule} disabled={updateMutation.isPending}>
                <Text style={s.saveBtnText}>{updateMutation.isPending ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButton: { backgroundColor: '#16a34a', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  createForm: { margin: 16, backgroundColor: '#fff', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  createInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
  createButtons: { flexDirection: 'row', gap: 8 },
  createBtn: { flex: 1, backgroundColor: '#16a34a', padding: 10, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', padding: 10, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontSize: 14 },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  groupBadge: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  groupText: { fontSize: 11, color: '#3b82f6', fontWeight: '500' },
  itemCount: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  schedule: { fontSize: 12, color: '#f97316', flex: 1 },
  scheduleUnset: { color: '#9ca3af' },
  actions: { flexDirection: 'row', gap: 4, alignItems: 'center', marginLeft: 8 },
  actionBtn: { padding: 6 },
  empty: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '85%', paddingBottom: 20 },
  modalHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8, marginHorizontal: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  dayChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: '#16a34a' },
  toggleOff: { backgroundColor: '#d1d5db' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleThumbOff: { alignSelf: 'flex-start' },
  reminderNote: { fontSize: 12, color: '#9ca3af', marginHorizontal: 20, marginTop: 4 },
  modalButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cancelBtn2: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#16a34a', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
