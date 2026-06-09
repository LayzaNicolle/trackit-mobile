import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import {
  Text,
  Card,
  IconButton,
  FAB,
  ActivityIndicator,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/services/api';
import ItemFormModal from '../../src/components/ItemFormModal';

export default function Items() {
  const queryClient = useQueryClient();

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = modo criacao
  const [itemToDelete, setItemToDelete] = useState(null); // controla o dialog de exclusao

  // READ: lista os itens do usuario logado (GET /items)
  const { data: items, isLoading, isError } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/items');
      return response.data;
    },
  });

  // Apos qualquer mutacao, invalida a query pra lista se atualizar sozinha.
  const invalidateItems = () => queryClient.invalidateQueries({ queryKey: ['items'] });

  // CREATE: POST /items
  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/items', payload),
    onSuccess: () => {
      invalidateItems();
      closeForm();
    },
  });

  // UPDATE: PUT /items/:id
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/items/${id}`, payload),
    onSuccess: () => {
      invalidateItems();
      closeForm();
    },
  });

  // DELETE: DELETE /items/:id
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/items/${id}`),
    onSuccess: () => {
      invalidateItems();
      setItemToDelete(null);
    },
  });

  const openCreateForm = () => {
    setEditingItem(null);
    setFormVisible(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingItem(null);
  };

  const handleSubmit = (payload) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card} onPress={() => openEditForm(item)}>
      <Card.Title
        title={item.name}
        subtitle={item.description || 'Sem descrição'}
        right={(props) => (
          <IconButton
            {...props}
            icon="delete"
            iconColor="#c62828"
            onPress={() => setItemToDelete(item)}
          />
        )}
      />
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Não foi possível carregar os itens.{'\n'}
          Verifique se você está autenticado.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text variant="bodyLarge" style={{ color: 'gray' }}>
              Nenhum item cadastrado ainda.
            </Text>
            <Text variant="bodySmall" style={{ color: 'gray', marginTop: 4 }}>
              Toque no botão + para adicionar.
            </Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={openCreateForm} />

      {/* Formulario de criar/editar */}
      <ItemFormModal
        visible={formVisible}
        onDismiss={closeForm}
        onSubmit={handleSubmit}
        item={editingItem}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirmacao de exclusao */}
      <Portal>
        <Dialog visible={!!itemToDelete} onDismiss={() => setItemToDelete(null)}>
          <Dialog.Title>Excluir item</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Tem certeza que deseja excluir "{itemToDelete?.name}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setItemToDelete(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              textColor="#c62828"
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              onPress={() => deleteMutation.mutate(itemToDelete.id)}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 40 },
  listContent: { padding: 16, paddingBottom: 88 },
  card: { marginBottom: 12, backgroundColor: 'white', borderRadius: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#6200ee' },
  errorText: { color: '#c62828', textAlign: 'center' },
});
