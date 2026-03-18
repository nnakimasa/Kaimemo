import { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
  Modal, TouchableWithoutFeedback, Animated, PanResponder,
  Share, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useList } from '../../hooks/useLists';
import { useCreateItem, useToggleItem, useDeleteItem, useUpdateItem } from '../../hooks/useItems';
import { shareApi } from '../../services/api';
import type { Item } from '@kaimemo/shared';

// ─── スワイプ削除コンポーネント ───────────────────────────────
function SwipeableRow({
  isOpen,
  onOpen,
  onClose,
  onDelete,
  children,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);
  const DELETE_WIDTH = 80;

  useEffect(() => {
    isOpenRef.current = isOpen;
    Animated.spring(translateX, {
      toValue: isOpen ? -DELETE_WIDTH : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 9,
    }).start();
  }, [isOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        // 横取りされた場合も確実にスナップ
        Animated.spring(translateX, {
          toValue: isOpenRef.current ? -DELETE_WIDTH : 0,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
        }).start();
      },
      onPanResponderMove: (_, gs) => {
        const base = isOpenRef.current ? -DELETE_WIDTH : 0;
        const next = Math.max(-DELETE_WIDTH, Math.min(0, base + gs.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        const opened = isOpenRef.current;
        const fastSwipeLeft = gs.vx < -0.5;
        const fastSwipeRight = gs.vx > 0.5;
        const shouldOpen = fastSwipeLeft
          ? true
          : fastSwipeRight
          ? false
          : opened
          ? gs.dx < DELETE_WIDTH / 2
          : gs.dx < -(DELETE_WIDTH / 3);
        if (shouldOpen) {
          onOpen();
          Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true, tension: 120, friction: 9 }).start();
        } else {
          onClose();
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 9 }).start();
        }
      },
    })
  ).current;

  return (
    <View style={sw.wrap}>
      <TouchableOpacity style={[sw.deleteBtn, { width: DELETE_WIDTH }]} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={sw.deleteText}>削除</Text>
      </TouchableOpacity>
      <Animated.View {...panResponder.panHandlers} style={[sw.card, { transform: [{ translateX }] }]}>
        {children}
      </Animated.View>
    </View>
  );
}

const sw = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: 12, marginBottom: 8 },
  deleteBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', gap: 2 },
  deleteText: { color: '#fff', fontSize: 11 },
  card: { backgroundColor: '#fff' },
});

// ─── メイン画面 ───────────────────────────────────────────────
export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: list, isLoading, error, refetch } = useList(id!);
  const createItem = useCreateItem(id!);
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();
  const updateItem = useUpdateItem();

  const [newItemName, setNewItemName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // 編集モーダル
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editNote, setEditNote] = useState('');

  const openEditModal = (item: Item) => {
    setEditItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity > 1 ? String(item.quantity) : '');
    setEditUnit(item.unit ?? '');
    setEditNote(item.note ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editItem || !editName.trim()) return;
    try {
      await updateItem.mutateAsync({
        id: editItem.id,
        listId: id!,
        name: editName.trim(),
        quantity: editQuantity ? Number(editQuantity) : 1,
        unit: editUnit.trim() || null,
        note: editNote.trim() || null,
      });
      setEditItem(null);
    } catch {
      Alert.alert('エラー', '更新に失敗しました');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    try {
      await createItem.mutateAsync({ name: newItemName.trim() });
      setNewItemName('');
    } catch {
      Alert.alert('エラー', 'アイテムの追加に失敗しました');
    }
  };

  const handleToggle = async (item: Item) => {
    setOpenSwipeId(null);
    try {
      await toggleItem.mutateAsync({ id: item.id, listId: id!, isChecked: !item.isChecked });
    } catch {
      Alert.alert('エラー', '更新に失敗しました');
    }
  };

  const handleDelete = (item: Item) => {
    setOpenSwipeId(null);
    Alert.alert('確認', `"${item.name}"を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: async () => {
          try { await deleteItem.mutateAsync({ id: item.id, listId: id! }); }
          catch { Alert.alert('エラー', '削除に失敗しました'); }
        },
      },
    ]);
  };

  const handleShareText = async () => {
    if (!list) return;
    const unchecked = list.items.filter(i => !i.isChecked);
    const checked = list.items.filter(i => i.isChecked);
    const lines = [
      `【${list.name}】`,
      ...unchecked.map(i => `□ ${i.name}${i.quantity > 1 ? ` x${i.quantity}${i.unit ?? ''}` : ''}`),
      ...(checked.length > 0 ? ['', '✅ 購入済み', ...checked.map(i => `✓ ${i.name}`)] : []),
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // cancelled
    }
    setShareOpen(false);
  };

  const handleShareReadonlyLink = async () => {
    if (!id) return;
    try {
      const res = await shareApi.generateToken(id);
      if (res.data?.token) {
        const baseUrl = 'https://dj8tsqf6gqrp6.cloudfront.net';
        const url = `${baseUrl}/readonly/${res.data.token}`;
        setShareOpen(false);
        await Share.share({ message: url, url });
      }
    } catch {
      Alert.alert('エラー', 'リンクの生成に失敗しました');
    }
  };

  const handleShareLine = () => {
    if (!list) return;
    const unchecked = list.items.filter(i => !i.isChecked);
    const text = `【${list.name}】\n` + unchecked.map(i => `□ ${i.name}`).join('\n');
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => Alert.alert('エラー', 'LINEを開けませんでした'));
    setShareOpen(false);
  };

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  if (error || !list) return <View style={s.center}><Text style={s.errorText}>リストが見つかりません</Text></View>;

  const uncheckedItems = list.items.filter(i => !i.isChecked);
  const checkedItems = list.items.filter(i => i.isChecked);
  const allItems = [...uncheckedItems, ...checkedItems];

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    const checked = item.isChecked;
    const isFirstChecked = index === uncheckedItems.length;

    return (
      <>
        {isFirstChecked && checkedItems.length > 0 && (
          <Text style={s.sectionLabel}>完了 ({checkedItems.length})</Text>
        )}
        <SwipeableRow
          isOpen={openSwipeId === item.id}
          onOpen={() => setOpenSwipeId(item.id)}
          onClose={() => setOpenSwipeId(null)}
          onDelete={() => handleDelete(item)}
        >
          <TouchableOpacity
            style={[s.item, checked && s.itemChecked]}
            onPress={() => {
              if (openSwipeId) { setOpenSwipeId(null); return; }
              if (checked) { handleToggle(item); } else { openEditModal(item); }
            }}
            activeOpacity={0.7}
          >
            {/* チェックボックス */}
            <TouchableOpacity
              style={[s.checkbox, checked && s.checkboxChecked, checked && s.checkboxCheckedSmall]}
              onPress={() => handleToggle(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {checked && <Ionicons name="checkmark" size={checked ? 10 : 14} color="#fff" />}
            </TouchableOpacity>

            {/* アイテム内容 */}
            <View style={s.itemBody}>
              <View style={s.nameRow}>
                <Text style={[s.itemName, checked && s.itemNameChecked]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.note && !checked && (
                  <Text style={s.itemNoteInline} numberOfLines={1}>{item.note}</Text>
                )}
              </View>
            </View>

            {/* 右側: 数量バッジ（未チェックのみ） */}
            {!checked && (item.quantity > 1 || item.unit) && (
              <View style={s.qtyBadge}>
                <Text style={s.qtyText}>
                  {item.quantity}{item.unit ? item.unit : ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </SwipeableRow>
      </>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: list.name,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShareOpen(true)} style={{ marginRight: 4 }}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={s.container}>
        {/* アイテム追加フォーム */}
        <View style={s.addForm}>
          <TextInput
            style={s.addInput}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="アイテムを追加..."
            returnKeyType="done"
            onSubmitEditing={handleAddItem}
          />
          <TouchableOpacity
            style={[s.addButton, !newItemName.trim() && s.addButtonDisabled]}
            onPress={handleAddItem}
            disabled={createItem.isPending || !newItemName.trim()}
          >
            <Text style={s.addButtonText}>{createItem.isPending ? '...' : '+'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>アイテムがありません{'\n'}上のフォームから追加してください</Text>
            </View>
          }
          contentContainerStyle={s.listContainer}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setOpenSwipeId(null)}
        />

        {/* 共有シート */}
        <Modal visible={shareOpen} transparent animationType="slide" onRequestClose={() => setShareOpen(false)}>
          <TouchableWithoutFeedback onPress={() => setShareOpen(false)}>
            <View style={s.overlay}>
              <TouchableWithoutFeedback>
                <View style={s.shareSheet}>
                  <Text style={s.shareTitle}>共有</Text>
                  <TouchableOpacity style={s.shareOption} onPress={handleShareText}>
                    <Text style={s.shareOptionIcon}>📋</Text>
                    <Text style={s.shareOptionText}>テキストをコピー / 共有</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.shareOption} onPress={handleShareLine}>
                    <Text style={s.shareOptionIcon}>💬</Text>
                    <Text style={s.shareOptionText}>LINEで送る</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.shareOption} onPress={handleShareReadonlyLink}>
                    <Text style={s.shareOptionIcon}>🔗</Text>
                    <Text style={s.shareOptionText}>閲覧専用リンクをコピー</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.shareCancelBtn} onPress={() => setShareOpen(false)}>
                    <Text style={s.shareCancelText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* アイテム編集モーダル */}
        <Modal visible={editItem !== null} transparent animationType="fade" onRequestClose={() => setEditItem(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => setEditItem(null)}>
            <View style={[s.overlay, s.overlayCenter]}>
              <TouchableWithoutFeedback>
                <View style={s.editSheet}>
                  <View style={s.editHeader}>
                    <Text style={s.editTitle}>アイテムを編集</Text>
                    <TouchableOpacity onPress={() => setEditItem(null)}>
                      <Ionicons name="close" size={22} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <Text style={s.fieldLabel}>名前</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    returnKeyType="done"
                  />

                  <View style={s.fieldRow}>
                    <View style={s.fieldHalf}>
                      <Text style={s.fieldLabel}>数量</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={editQuantity}
                        onChangeText={setEditQuantity}
                        keyboardType="numeric"
                        placeholder="1"
                        returnKeyType="done"
                      />
                    </View>
                    <View style={s.fieldHalf}>
                      <Text style={s.fieldLabel}>単位</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={editUnit}
                        onChangeText={setEditUnit}
                        placeholder="個・本・袋"
                        returnKeyType="done"
                      />
                    </View>
                  </View>

                  <Text style={s.fieldLabel}>メモ（任意）</Text>
                  <TextInput
                    style={[s.fieldInput, s.fieldInputMulti]}
                    value={editNote}
                    onChangeText={setEditNote}
                    placeholder="ブランド・こだわりなど"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  <View style={s.editButtons}>
                    <TouchableOpacity style={s.cancelButton} onPress={() => setEditItem(null)}>
                      <Text style={s.cancelButtonText}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.saveButton} onPress={handleSaveEdit} disabled={updateItem.isPending}>
                      <Text style={s.saveButtonText}>{updateItem.isPending ? '保存中...' : '保存'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#dc2626', fontSize: 16 },

  addForm: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  addButton: { backgroundColor: '#16a34a', width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: { color: '#fff', fontSize: 22, fontWeight: '600' },

  listContainer: { padding: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', paddingVertical: 8, paddingHorizontal: 4 },

  item: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, gap: 10 },
  itemChecked: { backgroundColor: '#f3f4f6', opacity: 0.65, paddingVertical: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  checkboxChecked: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  checkboxCheckedSmall: { width: 18, height: 18, borderRadius: 9 },
  itemBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' },
  itemName: { fontSize: 15, color: '#111827', flexShrink: 0, maxWidth: '75%' },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#9ca3af', fontSize: 13 },
  itemNoteInline: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic', flexShrink: 1 },
  qtyBadge: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  qtyText: { fontSize: 12, color: '#374151', fontWeight: '500' },

  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 24 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  overlayCenter: { justifyContent: 'center', paddingHorizontal: 16 },

  shareSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  shareTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', color: '#374151', marginBottom: 12 },
  shareOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  shareOptionIcon: { fontSize: 22 },
  shareOptionText: { fontSize: 15, color: '#374151' },
  shareCancelBtn: { alignItems: 'center', paddingTop: 16 },
  shareCancelText: { fontSize: 15, color: '#9ca3af' },

  editSheet: { backgroundColor: '#fff', borderRadius: 20, padding: 20, paddingBottom: 24 },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  editTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  fieldLabel: { fontSize: 13, color: '#6b7280', marginBottom: 4, marginTop: 12 },
  fieldInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  fieldInputMulti: { minHeight: 72, paddingTop: 10 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  editButtons: { flexDirection: 'row', gap: 8, marginTop: 20 },
  saveButton: { flex: 1, backgroundColor: '#16a34a', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  cancelButtonText: { color: '#6b7280', fontSize: 15 },
});
