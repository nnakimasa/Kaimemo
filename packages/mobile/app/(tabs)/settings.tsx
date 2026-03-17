// 設定タブ — ダミーデータで表示確認用
import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

export default function SettingsScreen() {
  const { signOut } = useAuthStore();
  const [notifAll, setNotifAll] = useState(true);
  const [notifCheck, setNotifCheck] = useState(true);
  const [notifAdd, setNotifAdd] = useState(true);
  const [notifInvite, setNotifInvite] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);

  const handleSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ─── プロフィール ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>プロフィール</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>田</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>田中 太郎</Text>
              <Text style={styles.profileSub}>Googleアカウントで登録</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editText}>変更</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={[styles.card, styles.rowItem]} onPress={handleSignOut}>
          <Text style={styles.dangerText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 通知設定 ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>通知設定</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>通知（全体）</Text>
              <Text style={styles.switchSub}>全通知のON/OFFをまとめて切り替え</Text>
            </View>
            <Switch
              value={notifAll}
              onValueChange={(v) => { setNotifAll(v); if (!v) { setNotifCheck(false); setNotifAdd(false); setNotifInvite(false); setNotifReminder(false); } else { setNotifCheck(true); setNotifAdd(true); setNotifInvite(true); setNotifReminder(true); } }}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={notifAll ? '#16a34a' : '#9ca3af'}
            />
          </View>
          {[
            { label: 'チェック通知',    value: notifCheck,    set: setNotifCheck },
            { label: 'アイテム追加通知', value: notifAdd,     set: setNotifAdd },
            { label: 'グループ招待',     value: notifInvite,  set: setNotifInvite },
            { label: 'リマインダー通知', value: notifReminder, set: setNotifReminder },
          ].map(({ label, value, set }) => (
            <View key={label} style={[styles.switchRow, styles.switchRowBorder, !notifAll && styles.disabled]}>
              <Text style={styles.switchLabel}>{label}</Text>
              <Switch
                value={value && notifAll}
                onValueChange={set}
                disabled={!notifAll}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={(value && notifAll) ? '#16a34a' : '#9ca3af'}
              />
            </View>
          ))}
        </View>
      </View>

      {/* ─── Proプラン誘導 ─── */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.proCard}>
          <View style={styles.proHeader}>
            <Ionicons name="star" size={18} color="#fbbf24" />
            <Text style={styles.proLabel}>Kaimemo Pro</Text>
          </View>
          <Text style={styles.proDesc}>定期リスト無制限・写真無制限など</Text>
          <View style={styles.proButton}>
            <Text style={styles.proButtonText}>Proプランを見る — ¥480 / 月</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── その他 ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>その他</Text>
        <View style={styles.card}>
          {['プライバシーポリシー', '利用規約', 'お問い合わせ'].map((label, i, arr) => (
            <TouchableOpacity key={label} style={[styles.rowItem, i < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.version}>バージョン 1.0.0</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, gap: 4 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  profileSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  editText: { fontSize: 14, color: '#16a34a', fontWeight: '500' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, gap: 12 },
  switchRowBorder: { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  switchInfo: { flex: 1 },
  switchLabel: { fontSize: 15, color: '#111827' },
  switchSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  disabled: { opacity: 0.4 },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 15, color: '#111827' },
  dangerText: { fontSize: 15, color: '#ef4444' },
  proCard: { backgroundColor: '#14532d', borderRadius: 12, padding: 16 },
  proHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  proLabel: { fontSize: 14, fontWeight: 'bold', color: '#fbbf24' },
  proDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  proButton: { backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center' },
  proButtonText: { fontSize: 14, fontWeight: 'bold', color: '#14532d' },
  version: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
});
