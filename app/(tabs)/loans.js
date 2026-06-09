import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";

import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import {
  Card,
  Text,
  ActivityIndicator,
  Chip,
  FAB,
  Portal,
  Modal,
  Button,
  TextInput,
  Divider,
} from "react-native-paper";

import { Picker } from "@react-native-picker/picker";
import api from "../../src/services/api";

export default function LoansScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loansData, setLoansData] = useState({
    coisasQueMeDevem: [],
    coisasQueEuDevo: [],
  });

  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [modalVisible, setModalVisible] = useState(false);

  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);

  const [borrowerId, setBorrowerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [creatingLoan, setCreatingLoan] = useState(false);

  async function fetchLoans() {
    try {
      setLoading(true);
      const response = await api.get("/loans");
      setLoansData({
        coisasQueMeDevem: response.data?.coisasQueMeDevem || [],
        coisasQueEuDevo: response.data?.coisasQueEuDevo || [],
      });
    } catch (error) {
      Alert.alert("Erro", "Erro ao carregar empréstimos");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchLoans();
    }, [])
  );

  async function loadUsers() {
    const res = await api.get("/users");
    setUsers(res.data || []);
  }

  async function loadItems() {
    const res = await api.get("/items");
    setItems(res.data || []);
  }

  async function openModal() {
    await Promise.all([loadUsers(), loadItems()]);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setBorrowerId("");
    setItemId("");
    setDueDate("");
  }

  function isValidDate(date) {
    return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
  }

  function toISO(date) {
    const [d, m, y] = date.split("/");
    return `${y}-${m}-${d}`;
  }

  // Máscara automática de data: digita 09062026 → 09/06/2026
  function handleDateChange(text) {
    const cleaned = text.replace(/\D/g, "").slice(0, 8);
    let masked = cleaned;
    if (cleaned.length > 2) masked = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    if (cleaned.length > 4) masked = masked.slice(0, 5) + "/" + masked.slice(5);
    setDueDate(masked);
  }

  async function createLoan() {
    try {
      if (!borrowerId || !itemId || !dueDate) {
        Alert.alert("Atenção", "Preencha todos os campos");
        return;
      }
      if (!isValidDate(dueDate)) {
        Alert.alert("Data inválida", "Use DD/MM/AAAA");
        return;
      }

      setCreatingLoan(true);

      await api.post("/loans", {
        borrowerId: Number(borrowerId),
        itemId: Number(itemId),
        dueDate: toISO(dueDate),
      });

      closeModal();
      await fetchLoans();
      Alert.alert("Sucesso", "Empréstimo criado!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar empréstimo");
    } finally {
      setCreatingLoan(false);
    }
  }

  function formatStatus(status) {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "ativo") return "ATIVO";
    if (s === "devolvido" || s === "returned") return "DEVOLVIDO";
    return (status || "").toUpperCase();
  }

  function getStatusColor(status) {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "ativo") return "#FF9800";
    if (s === "devolvido" || s === "returned") return "#4CAF50";
    return "#6200ee";
  }

  function filterLoans(loans) {
    if (selectedFilter === "ALL") return loans;
    return loans.filter((loan) => {
      const s = (loan.status || "").toLowerCase();
      if (selectedFilter === "ativo") return s === "active" || s === "ativo";
      if (selectedFilter === "devolvido") return s === "devolvido" || s === "returned";
      return true;
    });
  }

  function navigateToDetails(loan) {
    router.push(`/loan/${loan.id}`);
  }

  const meDevem = filterLoans(loansData.coisasQueMeDevem);
  const euDevo = filterLoans(loansData.coisasQueEuDevo);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Empréstimos
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip selected={selectedFilter === "ALL"} onPress={() => setSelectedFilter("ALL")} style={styles.chip}>
            Todos
          </Chip>
          <Chip selected={selectedFilter === "ativo"} onPress={() => setSelectedFilter("ativo")} style={styles.chip}>
            Ativos
          </Chip>
          <Chip selected={selectedFilter === "devolvido"} onPress={() => setSelectedFilter("devolvido")} style={styles.chip}>
            Devolvidos
          </Chip>
        </ScrollView>

        <Text style={styles.sectionTitle}>Coisas que me devem</Text>

        {meDevem.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum empréstimo nesta categoria.</Text>
        ) : (
          meDevem.map((loan) => (
            <Card key={loan.id} onPress={() => navigateToDetails(loan)} style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{loan.item_name}</Text>
                <Text style={{ color: getStatusColor(loan.status), fontWeight: "bold", marginTop: 4 }}>
                  {formatStatus(loan.status)}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>Coisas que eu devo</Text>

        {euDevo.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum empréstimo nesta categoria.</Text>
        ) : (
          euDevo.map((loan) => (
            <Card key={loan.id} onPress={() => navigateToDetails(loan)} style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{loan.item_name}</Text>
                <Text style={{ color: getStatusColor(loan.status), fontWeight: "bold", marginTop: 4 }}>
                  {formatStatus(loan.status)}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal novo empréstimo */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={40}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Cabeçalho */}
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  Novo Empréstimo
                </Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Divider style={styles.modalDivider} />

              {/* Usuário */}
              <Text style={styles.fieldLabel}>Para quem?</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={borrowerId}
                  onValueChange={setBorrowerId}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione o usuário..." value="" />
                  {users.map((u) => (
                    <Picker.Item key={u.id} label={u.name} value={String(u.id)} />
                  ))}
                </Picker>
              </View>

              {/* Item */}
              <Text style={styles.fieldLabel}>Qual item?</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={itemId}
                  onValueChange={setItemId}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione o item..." value="" />
                  {items.map((i) => (
                    <Picker.Item key={i.id} label={i.name} value={String(i.id)} />
                  ))}
                </Picker>
              </View>

              {/* Data */}
              <Text style={styles.fieldLabel}>Prazo de devolução</Text>
              <TextInput
                value={dueDate}
                onChangeText={handleDateChange}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                mode="outlined"
                style={styles.dateInput}
                outlineColor="#ddd"
                activeOutlineColor="#6200ee"
                maxLength={10}
              />

              {/* Botão */}
              <Button
                mode="contained"
                loading={creatingLoan}
                disabled={creatingLoan}
                onPress={createLoan}
                style={styles.createButton}
                contentStyle={styles.createButtonContent}
                labelStyle={styles.createButtonLabel}
              >
                Criar Empréstimo
              </Button>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={openModal} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontWeight: "bold", marginBottom: 12 },
  sectionTitle: { marginTop: 20, marginBottom: 8, fontWeight: "bold" },
  card: { marginBottom: 10, borderRadius: 12 },
  chip: { marginRight: 8 },
  emptyText: { color: "gray", fontStyle: "italic", marginBottom: 8 },
  fab: { position: "absolute", right: 16, bottom: 16 },

  // Modal
  modalContainer: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 20,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "bold",
  },
  modalDivider: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  picker: {
    height: 52,
  },
  dateInput: {
    marginBottom: 24,
    backgroundColor: "white",
    fontSize: 16,
  },
  createButton: {
    borderRadius: 12,
    backgroundColor: "#6200ee",
    marginBottom: 8,
  },
  createButtonContent: {
    paddingVertical: 6,
  },
  createButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});