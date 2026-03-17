// 通知タブ — ダミーデータで表示確認用
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NotifType = 'check' | 'add' | 'invite' | 'reminder';

type Notif = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
};

const INITIAL: Notif[] = [
  { id: '1', type: 'check',    title: 'りんごがチェックされました', body: '週末の食材',         time: '2分前',  isRead: false },
  { id: '2', type: 'add',      title: 'パンが追加されました',       body: '週末の食材',         time: '15分前', isRead: false },
  { id: '3', type: 'invite',   title: '仕事グループに招待されました', body: '田中 太郎より',     time: '1時間前', isRead: true },
  { id: '4', type: 'reminder', title: '週末の食材 のリマインダー',   body: '買い物日: 今日',     time: '昨日',   isRead: true },
  { id: '5', type: 'check',    title: '牛乳がチェックされました',   body: '週末の食材',         time: '2日前',  isRead: true },
];

const TYPE_CONFIG: Record<NotifType, { icon: string; bg: string; color: string }> = {
  check:    { icon: 'checkmark-circle', bg: '#dcfce7', color: '#16a34a' },
  add:      { icon: 'add-circle',       bg: '#dbeafe', color: '#3b82f6' },
  invite:   { icon: 'people',           bg: '#f3e8ff', color: '#9333ea' },
  reminder: { icon: 'notifications',    bg: '#ffedd5', color: '#f97316' },
};

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL);

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllRow} onPress={markAllRead}>
          <Text style={styles.markAllText}>全て既読にする</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <TouchableOpacity
              style={[styles.row, !item.isRead && styles.rowUnread]}
              onPress={() => markRead(item.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={styles.content}>
                <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.time}>{item.time}</Text>
                {!item.isRead && <View style={styles.dot} />}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>通知はありません</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  markAllRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'flex-end' },
  markAllText: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  rowUnread: { backgroundColor: '#f0fdf4' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  titleUnread: { fontWeight: '600', color: '#111827' },
  body: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  time: { fontSize: 11, color: '#9ca3af' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a' },
  sep: { height: 1, backgroundColor: '#f9fafb' },
  empty: { padding: 64, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#6b7280' },
});
