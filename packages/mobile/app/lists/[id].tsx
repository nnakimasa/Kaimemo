import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useList } from '../../hooks/useLists';
import { useCreateItem, useToggleItem, useDeleteItem } from '../../hooks/useItems';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: list, isLoading, error, refetch } = useList(id!);
  const createItem = useCreateItem(id!);
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();
  const [newItemName, setNewItemName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  const handleToggleItem = async (itemId: string, currentChecked: boolean) => {
    try {
      await toggleItem.mutateAsync({
        id: itemId,
        listId: id!,
        isChecked: !currentChecked,
      });
    } catch {
      Alert.alert('エラー', '更新に失敗しました');
    }
  };

  const handleDeleteItem = (itemId: string, name: string) => {
    Alert.alert('確認', `"${name}"を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem.mutateAsync({ id: itemId, listId: id! });
          } catch {
            Alert.alert('エラー', '削除に失敗しました');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !list) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>リストが見つかりません</Text>
      </View>
    );
  }

  const uncheckedItems = list.items.filter((item) => !item.isChecked);
  const checkedItems = list.items.filter((item) => item.isChecked);

  return (
    <>
      <Stack.Screen options={{ title: list.name }} />
      <View style={styles.container}>
        {/* Add item form */}
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="アイテムを追加..."
            returnKeyType="done"
            onSubmitEditing={handleAddItem}
          />
          <TouchableOpacity
            style={[styles.addButton, !newItemName.trim() && styles.addButtonDisabled]}
            onPress={handleAddItem}
            disabled={createItem.isPending || !newItemName.trim()}
          >
            <Text style={styles.addButtonText}>
              {createItem.isPending ? '...' : '+'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={[...uncheckedItems, ...checkedItems]}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, item.isChecked && styles.itemChecked]}
              onPress={() => handleToggleItem(item.id, item.isChecked)}
              onLongPress={() => handleDeleteItem(item.id, item.name)}
            >
              <View
                style={[
                  styles.checkbox,
                  item.isChecked && styles.checkboxChecked,
                ]}
              >
                {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemName,
                    item.isChecked && styles.itemNameChecked,
                  ]}
                >
                  {item.name}
                </Text>
                {item.quantity > 1 && (
                  <Text style={styles.itemQuantity}>
                    x{item.quantity}
                    {item.unit && ` ${item.unit}`}
                  </Text>
                )}
                {item.note && (
                  <Text style={styles.itemNote} numberOfLines={1}>
                    {item.note}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                アイテムがありません{'\n'}上のフォームから追加してください
              </Text>
            </View>
          }
          ListHeaderComponent={
            uncheckedItems.length > 0 && checkedItems.length > 0 ? (
              <Text style={styles.sectionHeader}>
                完了 ({checkedItems.length})
              </Text>
            ) : null
          }
          stickyHeaderIndices={
            uncheckedItems.length > 0 && checkedItems.length > 0
              ? [uncheckedItems.length]
              : undefined
          }
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
  },
  addForm: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#16a34a',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemChecked: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#111827',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemNote: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
