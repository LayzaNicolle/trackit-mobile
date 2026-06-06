import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/authStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { token } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const isAuthRoute = segments[0] === 'login' || segments[0] === 'signup';

    if (!token && !isAuthRoute) {
      router.replace('/login');
    } else if (token && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [token, segments, isReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={MD3LightTheme}>
        <Slot />
      </PaperProvider>
    </QueryClientProvider>
  );
}