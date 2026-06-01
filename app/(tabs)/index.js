import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/services/api';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // mock pra testar a tela visualmente.
  const userId = user?.id || 1; 

//   const { data: loans, isLoading, error } = useQuery({
//     queryKey: ['userLoans', userId],
//     queryFn: async () => {
//       const response = await api.get(`/users/${userId}/loans`);
//       return response.data;
//     },
//   });

const isLoading = false;
  const error = false;
  const loans = [
    { lender_id: 1, borrower_id: 2, status: 'pending' }, // Te devem 1
    { lender_id: 2, borrower_id: 1, status: 'active' }   // Você deve 1
  ];

  const teDevem = loans ? loans.filter(l => l.lender_id === userId && l.status !== 'returned').length : 0;
  const voceDeve = loans ? loans.filter(l => l.borrower_id === userId && l.status !== 'returned').length : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text size={48} label={user?.name ? user.name.substring(0,2).toUpperCase() : "US"} />
          <View style={styles.userText}>
            <Text variant="titleMedium">Olá, {user?.name || 'Usuário Teste'}!</Text>
            <Text variant="bodySmall" style={{ color: 'gray' }}>Bem-vindo ao TrackIt</Text>
          </View>
        </View>
        <Button mode="outlined" compact onPress={logout}>Sair</Button>
      </View>

      <Text variant="headlineSmall" style={styles.sectionTitle}>Resumo de Atividades</Text>

      {isLoading ? (
        <ActivityIndicator animating={true} style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>Erro ao carregar dados do servidor.</Text>
      ) : (
        <View style={styles.cardContainer}>
          <Card style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#2e7d32' }}>Te Devem</Text>
              <Text variant="displaySmall" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                {teDevem} {teDevem === 1 ? 'item' : 'itens'}
              </Text>
              <Text variant="bodySmall" style={{ color: '#4caf50' }}>Pendentes de devolução</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.card, { backgroundColor: '#ffebee' }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#c62828' }}>Você Deve</Text>
              <Text variant="displaySmall" style={{ color: '#c62828', fontWeight: 'bold' }}>
                {voceDeve} {voceDeve === 1 ? 'item' : 'itens'}
              </Text>
              <Text variant="bodySmall" style={{ color: '#f44336' }}>Precisa devolver</Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* esse botao eh pra tela sobre */}
      <Button 
        mode="contained" 
        style={styles.aboutButton} 
        onPress={() => router.push('/sobre')}
      >
        Sobre o Aplicativo
      </Button>
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
  aboutButton: { marginTop: 16, paddingVertical: 6, backgroundColor: '#6200ee' }
});