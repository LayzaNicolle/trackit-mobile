import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Alert } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  Card,
  Text,
  ActivityIndicator,
  Button,
  Divider,
} from "react-native-paper";

import api from "../../src/services/api";

export default function LoanDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [loan, setLoan] = useState(null);

  
  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  }

  function normalizeStatus(status) {
    const s = (status || "").toLowerCase();

    if (["active", "ativo"].includes(s)) return "ATIVO";
    if (["returned", "devolvido"].includes(s)) return "DEVOLVIDO";
    if (["returning"].includes(s)) return "DEVOLVENDO";

    return s.toUpperCase();
  }

  function getStatusColor(status) {
    const s = (status || "").toLowerCase();

    if (["active", "ativo"].includes(s)) return "#FF9800";
    if (["returned", "devolvido"].includes(s)) return "#4CAF50"; 
    if (["returning"].includes(s)) return "#2196F3";

    return "#6200ee";
  }


  async function loadLoan() {
  try {
    const response = await api.get(`/loans/${id}`);
    setLoan(response.data || null);
  } catch (error) {
    console.log(error);
    setLoan(null);
  }
}

 
  async function loadEvents() {
    try {
      const response = await api.get(`/loans/${id}/events`);
      setEvents(response.data || []);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar histórico.");
      setEvents([]);
    }
  }


  async function markAsReturned() {
    try {
      setUpdating(true);

      await api.put(`/loans/${id}/status`, {
        status: "returned", // 🔥 PADRÃO UNIFICADO
      });

      await Promise.all([loadLoan(), loadEvents()]);

      Alert.alert("Sucesso", "Processo finalizado");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar empréstimo.");
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        await Promise.all([loadLoan(), loadEvents()]);
      } finally {
        setLoading(false);
      }
    }

    if (id) init();
  }, [id]);

 
  const isReturned =
    (loan?.status || "").toLowerCase() === "returned" ||
    (loan?.status || "").toLowerCase() === "devolvido";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!loan) {
    return (
      <>
        <Stack.Screen options={{ title: "Empréstimo" }} />
        <View style={styles.center}>
          <Text>Empréstimo não encontrado</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Empréstimo #${id}`,
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall">{loan.item_name}</Text>

            <Text style={styles.info}>
              Status:{" "}
              <Text style={{ color: getStatusColor(loan.status), fontWeight: "bold" }}>
                {normalizeStatus(loan.status)}
              </Text>
            </Text>

            <Text style={styles.info}>
              Prazo: {formatDate(loan.due_date)}
            </Text>

            <Text style={styles.info}>
              Tomador: {loan.borrower_name}
            </Text>
          </Card.Content>
        </Card>

       
        {!isReturned && (
          <Button
            mode="contained"
            loading={updating}
            onPress={markAsReturned}
            style={styles.button}
          >
            Marcar como Devolvido
          </Button>
        )}

        {isReturned && (
          <Button
            mode="contained"
            disabled
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
          >
            Processo finalizado
          </Button>
        )}

        <Divider style={styles.divider} />

        <Text variant="headlineSmall" style={styles.timelineTitle}>
          Histórico do Empréstimo
        </Text>

        {events.length === 0 ? (
          <Card>
            <Card.Content>
              <Text>Nenhum evento encontrado.</Text>
            </Card.Content>
          </Card>
        ) : (
          events.map((event, index) => (
            <View key={event.id || index} style={styles.timelineItem}>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineDot} />
                {index !== events.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <Card style={styles.timelineCard}>
                <Card.Content>
                  <Text variant="titleMedium">
                    {event.description || "Evento do sistema"}
                  </Text>

                  <Text style={styles.eventDate}>
                    {formatDate(event.created_at)}
                  </Text>
                </Card.Content>
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { marginBottom: 16, borderRadius: 12 },
  info: { marginTop: 8 },
  button: { marginBottom: 20 },
  divider: { marginBottom: 20 },
  timelineTitle: { marginBottom: 16, fontWeight: "bold" },
  timelineItem: { flexDirection: "row", marginBottom: 16 },
  timelineContainer: { marginRight: 12, alignItems: "center" },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#6200ee",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#6200ee",
    marginTop: 4,
  },
  timelineCard: { flex: 1 },
  eventDate: { marginTop: 6, opacity: 0.7 },
});