import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/services/api';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const userId = user?.id || 1; 

  const [filtro, setFiltro] = useState(null);

  const { data: loans = [], isLoading, error } = useQuery({
    queryKey: ['userLoans', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/loans`);
      return response.data;
    },
  });

  const emprestimosQueMeDevem = loans.filter(l => l.lender_id === userId && l.status !== 'returned');
  const emprestimosQueEuDevo = loans.filter(l => l.borrower_id === userId && l.status !== 'returned');

  const teDevemQuantidade = emprestimosQueMeDevem.length;
  const voceDeveQuantidade = emprestimosQueEuDevo.length;
  const emprestimosFiltrados = filtro === 'devem' ? emprestimosQueMeDevem : filtro === 'devo' ? emprestimosQueEuDevo : [];

  return (
    <ScrollView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text size={48} label={user?.name ? user.name.substring(0,2).toUpperCase() : "CS"} />
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
                <Text variant="titleMedium" style={{ color: '#2e7d32', fontWeight: filtro === 'devem' ? 'bold' : 'normal' }}>Te Devem</Text>
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
                <Text variant="titleMedium" style={{ color: '#c62828', fontWeight: filtro === 'devo' ? 'bold' : 'normal' }}>Você Deve</Text>
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
                      title={`Empréstimo #${item.id}`}
                      description={`ID do Item: ${item.item_id} | Status: ${item.status}`}
                      left={props => (
                        <List.Icon 
                          {...props} 
                          icon={filtro === 'devem' ? "arrow-up-bold-box-outline" : "arrow-down-bold-box-outline"} 
                          color={filtro === 'devem' ? '#2e7d32' : '#c62828'}
                        />
                      )}
                      right={props => (
                        <Text style={styles.dataTexto}>
                          Prazo: {item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                        </Text>
                      )}
                      onPress={() => {
                        // se criar a tela de histórico de eventos, dá pra navegar pra ela aqui
                        router.push(`/loans/${item.id}/events`);
                      }}
                    />
                    <Divider />
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}

      <Button 
        mode="contained" 
        style={styles.aboutButton} 
        onPress={() => router.push('/sobre')}
      >
        Sobre o Aplicativo
      </Button>
      <View style={{ height: 40 }} />
    </ScrollView>
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
  dataTexto: { alignSelf: 'center', fontSize: 12, color: 'gray' }
});