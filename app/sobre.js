import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Avatar, Divider } from 'react-native-paper';

export default function Sobre() {
  const integrantes = [
    { nome: 'Bárbara Luiza', ra: '855654', funcao: 'Infraestrutura, inicialização e Estado Global' },
    { nome: 'Layza Nicolle', ra: '855207', funcao: 'Autenticação e Segurança' },
    { nome: 'Matheus Pablo', ra: '855289', funcao: 'Gestão e CRUD de Itens' },
    { nome: 'Vinicius Simas', ra: '852538', funcao: 'Controle de Empréstimos e Histórico' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.mainCard}>
        <Card.Content style={styles.centerContent}>
          <Avatar.Icon size={64} icon="package-variant-closed" style={{ backgroundColor: '#6200ee' }} />
          <Text variant="headlineMedium" style={styles.title}>TrackIt</Text>
          <Text variant="bodyMedium" style={styles.description}>
            O TrackIt é a solução definitiva para o gerenciamento e controle de empréstimos de itens e valores entre amigos e conhecidos. Nunca mais esqueça para quem você emprestou seus pertences ou de quem pegou algo emprestado!
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleLarge" style={styles.sectionTitle}>Equipe de Desenvolvimento</Text>
      <Divider style={{ marginBottom: 16 }} />

      {integrantes.map((item, index) => (
        <Card key={index} style={styles.memberCard}>
          <Card.Content>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee' }}>{item.nome}</Text>
            <Text variant="bodyMedium">RA: {item.ra}</Text>
            <Text variant="bodySmall" style={{ color: 'gray', marginTop: 2 }}>{item.funcao}</Text>
          </Card.Content>
        </Card>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', padding: 16 },
  mainCard: { marginBottom: 24, paddingVertical: 10, borderRadius: 12 },
  centerContent: { alignItems: 'center', textAlign: 'center' },
  title: { fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  description: { textAlign: 'center', color: '#555', lineHeight: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  memberCard: { marginBottom: 12, borderRadius: 8, backgroundColor: '#ffffff' }
});