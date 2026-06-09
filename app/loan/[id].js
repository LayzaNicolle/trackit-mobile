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

  function isLoanReturned(status) {
    return ["devolvido", "returned"].includes((status || "").toLowerCase());
  }

  function formatStatus(status) {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "ativo") return "ATIVO";
    if (isLoanReturned(s)) return "DEVOLVIDO";
    if (s === "em andamento") return "EM ANDAMENTO";
    return s.toUpperCase();
  }

  function getStatusColor(status) {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "ativo") return "#FF9800";
    if (isLoanReturned(s)) return "#4CAF50";
    return "#6200ee";
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

  async function markAsReturned() {
    try {
      setUpdating(true);
      await api.put(`/loans/${id}/status`, { status: "devolvido" });
      await loadLoan();
      Alert.alert("Sucesso", "Empréstimo marcado como devolvido.");
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível atualizar o empréstimo.");
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        await loadLoan();
      } catch (error) {
        console.log("Erro geral:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) init();
  }, [id]);

  const isReturned = isLoanReturned(loan?.status);

  
  function buildTimeline(loan) {
    const events = [];

    if (loan.created_at) {
      events.push({
        label: "Empréstimo criado",
        date: loan.created_at,
        color: "#6200ee",
        icon: "📦",
        done: true,
      });
    }

    if (loan.due_date) {
      const isPrazoVencido = new Date(loan.due_date) < new Date() && !isLoanReturned(loan.status);
      events.push({
        label: "Prazo de devolução",
        date: loan.due_date,
        color: isPrazoVencido ? "#f44336" : "#FF9800",
        icon: isPrazoVencido ? "⚠️" : "📅",
        done: false,
      });
    }


    return events;
  }

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

  const timeline = buildTimeline(loan);

  return (
    <>
      <Stack.Screen options={{ title: `Empréstimo #${id}` }} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Card de informações */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall">{loan.item_name}</Text>

            {loan.borrower_name && (
              <Text style={styles.info}>Tomador: {loan.borrower_name}</Text>
            )}

            {loan.borrower_email && (
              <Text style={styles.info}>Email: {loan.borrower_email}</Text>
            )}

            {loan.lender_name && (
              <Text style={styles.info}>Dono: {loan.lender_name}</Text>
            )}

            <Text style={styles.info}>Prazo: {formatDate(loan.due_date)}</Text>

            <Text style={[styles.info, { color: getStatusColor(loan.status), fontWeight: "bold" }]}>
              Status: {formatStatus(loan.status)}
            </Text>
          </Card.Content>
        </Card>

        {/* Botão */}
        <Button
          mode="contained"
          loading={updating}
          disabled={updating || isReturned}
          onPress={markAsReturned}
          style={[styles.button, isReturned && { backgroundColor: "#4CAF50" }]}
        >
          {isReturned ? "Empréstimo já devolvido" : "Marcar como Devolvido"}
        </Button>

        <Divider style={styles.divider} />

        
        <Text variant="titleMedium" style={styles.timelineTitle}>
          Histórico
        </Text>

        {timeline.map((event, index) => (
          <View key={index} style={styles.timelineRow}>
           
            <View style={styles.timelineLeft}>
              <View style={[styles.dot, { backgroundColor: event.color }]} />
              {index !== timeline.length - 1 && (
                <View style={[styles.line, { backgroundColor: event.color }]} />
              )}
            </View>

            
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>
                {event.icon}  {event.label}
              </Text>
              {event.date ? (
                <Text style={styles.timelineDate}>{formatDate(event.date)}</Text>
              ) : (
                <Text style={[styles.timelineDate, { fontStyle: "italic" }]}>
                  Data não registrada
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { marginBottom: 16, borderRadius: 12, elevation: 3 },
  info: { marginTop: 8 },
  button: { marginBottom: 20 },
  divider: { marginBottom: 20 },
  timelineTitle: { fontWeight: "bold", marginBottom: 16 },
  timelineRow: { flexDirection: "row", marginBottom: 8 },
  timelineLeft: { alignItems: "center", marginRight: 16, width: 14 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, marginTop: 4, minHeight: 40 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 15, fontWeight: "bold" },
  timelineDate: { fontSize: 13, color: "gray", marginTop: 2 },
});