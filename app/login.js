import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore'; 

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { setAuth } = useAuthStore(); 

  const loginMutation = useMutation({
    mutationFn: (userData) => api.post('/auth/login', userData),
    onSuccess: (res) => {
      const token = res.data.token;
      const user = res.data.user;
      setAuth(token, user);
      router.replace('/(tabs)');
    },
    onError: (err) => {
      console.log("Erro completo:", err.message);
      console.log("Erro response:", err.response?.data);
      console.log("Erro status:", err.response?.status);
      alert("Erro: " + (err.response?.data?.error || err.message || "Falha na conexão"));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>TrackIt</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>Gerencie seus itens com simplicidade.</Text>
        </View>

        <Surface style={styles.surface} elevation={2}>
          <TextInput 
            label="E-mail" mode="outlined" style={styles.input}
            outlineColor="#E0E0E0" activeOutlineColor="#6200EE"
            autoCapitalize="none" keyboardType="email-address"
            onChangeText={(v) => setForm({...form, email: v})} 
          />
          <TextInput 
            label="Senha" mode="outlined" style={styles.input}
            outlineColor="#E0E0E0" activeOutlineColor="#6200EE"
            secureTextEntry 
            onChangeText={(v) => setForm({...form, password: v})} 
          />
          
          <Button 
            mode="contained" style={styles.button} contentStyle={{ height: 50 }}
            onPress={() => loginMutation.mutate(form)}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? <ActivityIndicator color="white" /> : "Entrar"}
          </Button>

          <Button 
            mode="text" 
            onPress={() => router.navigate('/signup')}
            style={{ marginTop: 8 }}
            textColor="#6200EE"
          >
            Não tem conta? Cadastre-se
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContainer: { padding: 25, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle: { color: '#757575', marginTop: 8 },
  surface: { padding: 25, borderRadius: 16, backgroundColor: '#FFFFFF' },
  input: { marginBottom: 16, backgroundColor: '#FFFFFF' },
  button: { borderRadius: 12, marginTop: 10, backgroundColor: '#6200EE' }
});