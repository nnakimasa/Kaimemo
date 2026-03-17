// グループタブ — ダミーデータで表示確認用
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_GROUPS = [
  { id: 'g1', name: '家族', memberCount: 3, listCount: 4 },
  { id: 'g2', name: '仕事グループ', memberCount: 5, listCount: 2 },
];

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ 新規グループ</Text>
      </TouchableOpacity>
      <FlatList
        data={DUMMY_GROUPS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="people" size={24} color="#16a34a" />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>メンバー {item.memberCount}人 · リスト {item.listCount}件</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>グループがありません{'\n'}新規グループを作成してください</Text>
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
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  empty: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
});
