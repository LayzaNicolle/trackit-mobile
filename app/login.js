import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, IconButton, Surface, ActivityIndicator } from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore'; 
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { setToken } = useAuthStore(); 

  const loginMutation = useMutation({
    mutationFn: (userData) => api.post('/api/auth/login', userData),
    onSuccess: (res) => {
      
      const token = res.data.token; 
      setToken(token);
      
      
      router.replace('/(tabs)');
    },
    onError: (err) => {
      console.log("Erro no login:", err.response?.data);
      alert("Erro: " + (err.response?.data?.error || "Falha na conexão"));
    }
  });

  const handleGoBack = () => router.canGoBack() ? router.back() : router.replace('/');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <IconButton icon="arrow-left" size={28} onPress={handleGoBack} style={styles.backButton} />
      
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