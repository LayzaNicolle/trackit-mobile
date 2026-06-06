import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#6200ee',
        headerShown: true 
      }}
    >
      {/* Home (Já existente) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />

      {/* Matheus: CRUD de Itens */}
      <Tabs.Screen
        name="items"
        options={{
          title: 'Meus Itens',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" size={size} color={color} />
          ),
        }}
      />

      {/* Vinícius: Gestão de Empréstimos */}
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Empréstimos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="handshake" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}