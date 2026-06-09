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

    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case "active":
        return "#FF9800";
      case "devolvido":
        return "#4CAF50";
      default:
        return "#6200ee";
    }
  }

  async function loadLoan() {
    try {
      const response = await api.get("/loans");

      const loans = [
        ...(response.data?.coisasQueMeDevem || []),
        ...(response.data?.coisasQueEuDevo || []),
      ];

      const selectedLoan = loans.find(
        (loan) => String(loan.id) === String(id)
      );

      setLoan(selectedLoan || null);
    } catch (error) {
      console.log("Erro ao carregar empréstimo:", error);
      setLoan(null);
    }
  }

  async function loadEvents() {
    try {
      const response = await api.get(`/loans/${id}/events`);
      setEvents(response.data || []);
    } catch (error) {
      console.log("Erro ao carregar eventos:", error);

      Alert.alert(
        "Aviso",
        "Não foi possível carregar o histórico do empréstimo."
      );

      setEvents([]);
    }
  }

  async function markAsReturned() {
    try {
      setUpdating(true);

      await api.put(`/loans/${id}/status`, {
        status: "devolvido",
      });

      await Promise.all([loadLoan(), loadEvents()]);

      Alert.alert("Sucesso", "Empréstimo marcado como devolvido.");
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Erro",
        "Não foi possível atualizar o empréstimo."
      );
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);

      try {
        await Promise.all([loadLoan(), loadEvents()]);
      } catch (error) {
        console.log("Erro geral:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) init();
  }, [id]);

  const isReturned =
    loan?.status?.toLowerCase() === "devolvido";

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
            <Text variant="headlineSmall">
              {loan.item_name}
            </Text>

            {loan.borrower_name && (
              <Text style={styles.info}>
                Tomador: {loan.borrower_name}
              </Text>
            )}

            {loan.borrower_email && (
              <Text style={styles.info}>
                Email: {loan.borrower_email}
              </Text>
            )}

            <Text style={styles.info}>
              Prazo: {formatDate(loan.due_date)}
            </Text>

            <Text
              style={[
                styles.info,
                {
                  color: getStatusColor(loan.status),
                  fontWeight: "bold",
                },
              ]}
            >
              Status: {loan.status}
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          loading={updating}
          disabled={updating || isReturned}
          onPress={markAsReturned}
          style={styles.button}
        >
          {isReturned
            ? "Empréstimo já devolvido"
            : "Marcar como Devolvido"}
        </Button>

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
            <View
              key={event.id || index}
              style={styles.timelineItem}
            >
              <View style={styles.timelineContainer}>
                <View style={styles.timelineDot} />

                {index !== events.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              <Card style={styles.timelineCard}>
                <Card.Content>
                  <Text variant="titleMedium">
                    {event.description ||
                      event.title ||
                      "Evento do sistema"}
                  </Text>

                  <Text style={styles.eventDate}>
                    {formatDate(
                      event.created_at || event.date
                    )}
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
  container: {
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },

  info: {
    marginTop: 8,
  },

  button: {
    marginBottom: 20,
  },

  divider: {
    marginBottom: 20,
  },

  timelineTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 16,
  },

  timelineContainer: {
    alignItems: "center",
    marginRight: 12,
  },

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
    minHeight: 60,
  },

  timelineCard: {
    flex: 1,
  },

  eventDate: {
    marginTop: 6,
    opacity: 0.7,
  },
});