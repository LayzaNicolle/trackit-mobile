import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, Modal, Portal, Provider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/services/api';
import { useRouter } from 'expo-router';

function normalizeStatus(status) {
  return (status || "").toLowerCase();
}

function isReturned(status) {
  return ["returned", "devolvido"].includes(normalizeStatus(status));
}

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const userId = user?.id || 1;

  const [filtro, setFiltro] = useState(null);
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState(null);
  const [modalVisivel, setModalVisivel] = useState(false);

 
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['userLoans'] });
    }, [])
  );

  const { data: dbItems = [] } = useQuery({
    queryKey: ['allDbItems'],
    queryFn: async () => {
      const response = await api.get('/items');
      return Array.isArray(response.data) ? response.data : response.data?.items || [];
    },
  });

  const { data: dbUsers = [] } = useQuery({
    queryKey: ['allDbUsers'],
    queryFn: async () => {
      const response = await api.get('/users');
      return Array.isArray(response.data) ? response.data : response.data?.users || [];
    },
  });

  const { data: loans = [], isLoading, error } = useQuery({
    queryKey: ['userLoans', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/loans`);
      return response.data;
    },
  });

  const updateLoanMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.put(`/loans/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLoans'] });
      queryClient.invalidateQueries({ queryKey: ['allDbItems'] });
      fecharModal();
    },
    onError: () => {
      fecharModal();
    },
  });

  const traduzirStatus = (status) => {
    const s = normalizeStatus(status);
    if (s === 'active' || s === 'ativo') return 'Em andamento';
    if (s === 'pending') return 'Pendente';
    if (isReturned(s)) return 'Devolvido';
    return status || '';
  };

  const mesclarDadosEmprestimo = (loanArray) => {
    if (!Array.isArray(loanArray)) return [];
    return loanArray.map((loan) => {
      const itemEncontrado = dbItems.find((i) => Number(i.id) === Number(loan.item_id));
      const lenderEncontrado = dbUsers.find((u) => Number(u.id) === Number(loan.lender_id));
      const borrowerEncontrado = dbUsers.find((u) => Number(u.id) === Number(loan.borrower_id));

      let nomeDoItem = 'Item não encontrado';
      if (itemEncontrado) {
        if (itemEncontrado.name && itemEncontrado.name.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(itemEncontrado.name);
            nomeDoItem = parsed.name || nomeDoItem;
          } catch (e) {
            nomeDoItem = itemEncontrado.name;
          }
        } else {
          nomeDoItem = itemEncontrado.name;
        }
      }

      return {
        ...loan,
        item_name: loan.item_name || nomeDoItem,
        lender_name: loan.lender_name || (lenderEncontrado ? lenderEncontrado.name : 'Desconhecido'),
        lender_email: loan.lender_email || (lenderEncontrado ? lenderEncontrado.email : 'Não informado'),
        borrower_name: loan.borrower_name || (borrowerEncontrado ? borrowerEncontrado.name : 'Desconhecido'),
        borrower_email: loan.borrower_email || (borrowerEncontrado ? borrowerEncontrado.email : 'Não informado'),
      };
    });
  };

  const emprestimosTratados = mesclarDadosEmprestimo(
    Array.isArray(loans) ? loans : loans.coisasQueMeDevem || loans.coisasQueEuDevo || []
  );

  const emprestimosQueMeDevem = emprestimosTratados.filter(
    (l) => Number(l.lender_id) === Number(userId) && !isReturned(l.status)
  );
  const emprestimosQueEuDevo = emprestimosTratados.filter(
    (l) => Number(l.borrower_id) === Number(userId) && !isReturned(l.status)
  );

  const teDevemQuantidade = emprestimosQueMeDevem.length;
  const voceDeveQuantidade = emprestimosQueEuDevo.length;
  const emprestimosFiltrados =
    filtro === 'devem' ? emprestimosQueMeDevem :
    filtro === 'devo' ? emprestimosQueEuDevo : [];

  const abrirModal = (item) => {
    setEmprestimoSelecionado(item);
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setEmprestimoSelecionado(null);
    setModalVisivel(false);
  };

  const handleConfirmarDevolucao = () => {
    if (emprestimoSelecionado) {
      updateLoanMutation.mutate({ id: emprestimoSelecionado.id, status: 'devolvido' });
    }
  };

  return (
    <Provider>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text size={48} label={user?.name ? user.name.substring(0, 2).toUpperCase() : "CS"} />
            <View style={styles.userText}>
              <Text variant="titleMedium">Olá, {user?.name || 'Carlos Silva'}!</Text>
              <Text variant="bodySmall" style={{ color: 'gray' }}>
                {user?.id ? 'Bem-vindo ao TrackIt' : 'Visualizando Perfil ID: 1'}
              </Text>
            </View>
          </View>
          {user && <Button mode="outlined" compact onPress={logout}>Sair</Button>}
        </View>

        <Text variant="headlineSmall" style={styles.sectionTitle}>Resumo de Atividades</Text>

        {isLoading ? (
          <ActivityIndicator animating={true} style={{ marginTop: 40 }} size="large" />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erro ao carregar dados em tempo real do servidor.</Text>
            <Text style={{ color: 'gray', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
              Verifique se a rota do backend foi publicada na Vercel.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.cardContainer}>
              <Card
                style={[styles.card, filtro === 'devem' && styles.cardSelecionadoDevem]}
                onPress={() => setFiltro(filtro === 'devem' ? null : 'devem')}
              >
                <Card.Content style={{ backgroundColor: '#e8f5e9', borderRadius: 12 }}>
                  <Text variant="titleMedium" style={{ color: '#2e7d32', fontWeight: filtro === 'devem' ? 'bold' : 'normal' }}>
                    Te Devem
                  </Text>
                  <Text variant="displaySmall" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    {teDevemQuantidade} {teDevemQuantidade === 1 ? 'item' : 'itens'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#4caf50' }}>
                    {filtro === 'devem' ? '👇 Ver itens abaixo' : 'Toque para ver os detalhes'}
                  </Text>
                </Card.Content>
              </Card>

              <Card
                style={[styles.card, filtro === 'devo' && styles.cardSelecionadoDevo]}
                onPress={() => setFiltro(filtro === 'devo' ? null : 'devo')}
              >
                <Card.Content style={{ backgroundColor: '#ffebee', borderRadius: 12 }}>
                  <Text variant="titleMedium" style={{ color: '#c62828', fontWeight: filtro === 'devo' ? 'bold' : 'normal' }}>
                    Você Deve
                  </Text>
                  <Text variant="displaySmall" style={{ color: '#c62828', fontWeight: 'bold' }}>
                    {voceDeveQuantidade} {voceDeveQuantidade === 1 ? 'item' : 'itens'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#f44336' }}>
                    {filtro === 'devo' ? '👇 Ver itens abaixo' : 'Toque para ver os detalhes'}
                  </Text>
                </Card.Content>
              </Card>
            </View>

            {filtro && (
              <View style={styles.listaContainer}>
                <Text variant="titleLarge" style={styles.listaTitle}>
                  {filtro === 'devem' ? 'Itens que pegaram com você:' : 'Itens que você pegou emprestado:'}
                </Text>

                {emprestimosFiltrados.length === 0 ? (
                  <Text style={styles.listaVazia}>Nenhum item pendente nesta categoria.</Text>
                ) : (
                  emprestimosFiltrados.map((item) => (
                    <View key={item.id}>
                      <List.Item
                        title={item.item_name}
                        description={`ID do Empréstimo: #${item.id} | Status: ${traduzirStatus(item.status)}`}
                        left={(props) => (
                          <List.Icon
                            {...props}
                            icon={filtro === 'devem' ? "arrow-up-bold-box-outline" : "arrow-down-bold-box-outline"}
                            color={filtro === 'devem' ? '#2e7d32' : '#c62828'}
                          />
                        )}
                        right={() => (
                          <Text style={styles.dataTexto}>
                            Prazo: {item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                          </Text>
                        )}
                        onPress={() => abrirModal(item)}
                      />
                      <Divider />
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        <Portal>
          <Modal visible={modalVisivel} onDismiss={fecharModal} contentContainerStyle={styles.modalContent}>
            {emprestimoSelecionado && (
              <View>
                <Text variant="titleLarge" style={styles.modalTitle}>Detalhes do Empréstimo</Text>
                <Divider style={{ marginBottom: 12 }} />

                <Text variant="bodyMedium" style={styles.modalLinha}>
                  📦 <Text style={{ fontWeight: 'bold' }}>Item:</Text> {emprestimoSelecionado.item_name}
                </Text>
                <Text variant="bodyMedium" style={styles.modalLinha}>
                  🔑 <Text style={{ fontWeight: 'bold' }}>ID do Empréstimo:</Text> #{emprestimoSelecionado.id}
                </Text>
                <Text variant="bodyMedium" style={styles.modalLinha}>
                  📊 <Text style={{ fontWeight: 'bold' }}>Status Atual:</Text> {traduzirStatus(emprestimoSelecionado.status)}
                </Text>
                <Text variant="bodyMedium" style={styles.modalLinha}>
                  📅 <Text style={{ fontWeight: 'bold' }}>Prazo de Entrega:</Text>{" "}
                  {emprestimoSelecionado.due_date
                    ? new Date(emprestimoSelecionado.due_date).toLocaleDateString('pt-BR')
                    : 'Não definido'}
                </Text>

                {filtro === 'devem' ? (
                  <View style={{ marginTop: 12 }}>
                    <Text variant="bodyMedium" style={styles.modalLinha}>
                      👤 <Text style={{ fontWeight: 'bold' }}>Quem pegou:</Text> {emprestimoSelecionado.borrower_name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.modalLinha}>
                      ✉️ <Text style={{ fontWeight: 'bold' }}>Contato:</Text> {emprestimoSelecionado.borrower_email}
                    </Text>
                    <Button
                      mode="contained"
                      style={{ marginTop: 20, backgroundColor: '#2e7d32' }}
                      loading={updateLoanMutation.isPending}
                      onPress={handleConfirmarDevolucao}
                    >
                      Confirmar Devolução
                    </Button>
                  </View>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <Text variant="bodyMedium" style={styles.modalLinha}>
                      👤 <Text style={{ fontWeight: 'bold' }}>Dono do item:</Text> {emprestimoSelecionado.lender_name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.modalLinha}>
                      ✉️ <Text style={{ fontWeight: 'bold' }}>Contato:</Text> {emprestimoSelecionado.lender_email}
                    </Text>
                    <Text style={styles.avisoTexto}>
                      Lembre-se de devolver o item para o dono no prazo combinado!
                    </Text>
                  </View>
                )}

                <Button mode="text" onPress={fecharModal} style={{ marginTop: 15 }}>
                  Fechar
                </Button>
              </View>
            )}
          </Modal>
        </Portal>

        <Button
          mode="contained"
          style={styles.aboutButton}
          onPress={() => router.push('/sobre')}
        >
          Sobre o Aplicativo
        </Button>
        <View style={{ height: 40 }} />
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userText: { marginLeft: 12 },
  sectionTitle: { marginBottom: 16, fontWeight: 'bold' },
  cardContainer: { gap: 16, marginBottom: 24 },
  card: { borderRadius: 12, elevation: 2 },
  cardSelecionadoDevem: { borderWidth: 2, borderColor: '#2e7d32' },
  cardSelecionadoDevo: { borderWidth: 2, borderColor: '#c62828' },
  aboutButton: { marginTop: 16, paddingVertical: 6, backgroundColor: '#6200ee' },
  errorContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 12, elevation: 1, marginVertical: 10 },
  errorText: { color: 'red', textAlign: 'center', fontWeight: 'bold' },
  listaContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 24 },
  listaTitle: { marginBottom: 12, fontWeight: 'bold', fontSize: 16 },
  listaVazia: { color: 'gray', fontStyle: 'italic', paddingVertical: 10 },
  dataTexto: { alignSelf: 'center', fontSize: 12, color: 'gray' },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 12 },
  modalTitle: { fontWeight: 'bold', marginBottom: 8 },
  modalLinha: { marginVertical: 4, fontSize: 15 },
  avisoTexto: { color: '#c62828', fontStyle: 'italic', marginTop: 15, textAlign: 'center', fontSize: 13 },
});