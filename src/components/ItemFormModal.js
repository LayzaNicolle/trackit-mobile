import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, TextInput, Button } from 'react-native-paper';

// Formulario reutilizavel para criar e editar itens.
// Quando recebe a prop `item`, entra em modo edicao e pre-preenche os campos.
export default function ItemFormModal({ visible, onDismiss, onSubmit, item, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isEditing = !!item;

  // Sempre que o modal abre, sincroniza os campos com o item (ou limpa pra criar).
  useEffect(() => {
    if (visible) {
      setName(item?.name || '');
      setDescription(item?.description || '');
    }
  }, [visible, item]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return; // name e obrigatorio no back-end
    onSubmit({ name: trimmedName, description: description.trim() });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <Text variant="titleLarge" style={styles.title}>
          {isEditing ? 'Editar Item' : 'Novo Item'}
        </Text>

        <TextInput
          label="Nome *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          placeholder="Ex: PlayStation 5"
        />

        <TextInput
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          placeholder="Ex: Edição especial, valor aprox. R$ 50"
          multiline
          numberOfLines={3}
        />

        <View style={styles.actions}>
          <Button mode="text" onPress={onDismiss} disabled={loading}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !name.trim()}
          >
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 12 },
  title: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
