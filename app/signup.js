import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, IconButton, Surface, ActivityIndicator } from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const signupMutation = useMutation({
    mutationFn: (userData) => api.post('/api/auth/signup', userData),
    onSuccess: () => {
      alert('Cadastro realizado!');
      router.replace('/login');
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Falha na conexão";
      alert("Erro: " + errorMessage);
    }
  });

  const handleGoBack = () => router.canGoBack() ? router.back() : router.replace('/login');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <IconButton icon="arrow-left" size={28} onPress={handleGoBack} style={styles.backButton} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>Criar conta</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>Junte-se ao TrackIt hoje.</Text>
        </View>

        <Surface style={styles.surface} elevation={2}>
          <TextInput label="Nome" mode="outlined" style={styles.input} onChangeText={(v) => setForm({...form, name: v})} />
          <TextInput label="E-mail" mode="outlined" style={styles.input} autoCapitalize="none" onChangeText={(v) => setForm({...form, email: v})} />
          <TextInput label="Senha" mode="outlined" style={styles.input} secureTextEntry onChangeText={(v) => setForm({...form, password: v})} />
          
          <Button 
            mode="contained" 
            style={styles.button} 
            contentStyle={{ height: 50 }} 
            onPress={() => signupMutation.mutate(form)}
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? <ActivityIndicator color="white" /> : "Finalizar cadastro"}
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContainer: { padding: 25, flexGrow: 1, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 50, left: 15, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle: { color: '#757575', marginTop: 8 },
  surface: { padding: 25, borderRadius: 16, backgroundColor: '#FFFFFF' },
  input: { marginBottom: 16, backgroundColor: '#FFFFFF' },
  button: { borderRadius: 12, marginTop: 10, backgroundColor: '#6200EE' }
});