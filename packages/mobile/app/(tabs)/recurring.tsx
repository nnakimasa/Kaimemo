// 定期リストタブ — ダミーデータで表示確認用
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_LISTS = [
  { id: '1', name: '週末の食材', schedule: '毎週土曜 · 2日前に生成 · 9:00リマインド', group: '家族' },
  { id: '2', name: '日用品まとめ買い', schedule: '毎月第1土曜 · 7日前に生成 · リマインドなし', group: null },
  { id: '3', name: '職場のお菓子', schedule: '未設定', group: '仕事グループ' },
];

export default function RecurringScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ 新規定期リスト</Text>
      </TouchableOpacity>
      <FlatList
        data={DUMMY_LISTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.group && (
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupText}>{item.group}</Text>
                  </View>
                )}
              </View>
              <View style={styles.scheduleRow}>
                <Ionicons
                  name={item.schedule === '未設定' ? 'add-circle-outline' : 'notifications-outline'}
                  size={13}
                  color={item.schedule === '未設定' ? '#9ca3af' : '#f97316'}
                />
                <Text style={[styles.schedule, item.schedule === '未設定' && styles.scheduleUnset]}>
                  {item.schedule}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>定期リストがありません{'\n'}新規定期リストを作成してください</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  addButton: { backgroundColor: '#16a34a', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  groupBadge: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  groupText: { fontSize: 11, color: '#3b82f6', fontWeight: '500' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  schedule: { fontSize: 12, color: '#f97316' },
  scheduleUnset: { color: '#9ca3af' },
  empty: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
});
