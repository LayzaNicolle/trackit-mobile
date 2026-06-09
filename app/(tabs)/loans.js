import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
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
} from "react-native-paper";

import { Picker } from "@react-native-picker/picker";
import api from "../../src/services/api";

export default function LoansScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  // 🔥 SEMPRE BUSCA REAL
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
    if (["returned", "devolvido"].includes(s)) return "#4CAF50"; // VERDE CERTO
    if (["returning"].includes(s)) return "#2196F3";

    return "#6200ee";
  }

  function filterLoans(loans) {
    if (selectedFilter === "ALL") return loans;

    return loans.filter((loan) => {
      const s = (loan.status || "").toLowerCase();

      if (selectedFilter === "ativo") return s === "active" || s === "ativo";
      if (selectedFilter === "devolvido") return s === "returned" || s === "devolvido";

      return true;
    });
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

        <ScrollView horizontal>
          <Chip selected={selectedFilter === "ALL"} onPress={() => setSelectedFilter("ALL")}>
            Todos
          </Chip>

          <Chip selected={selectedFilter === "ativo"} onPress={() => setSelectedFilter("ativo")}>
            Ativos
          </Chip>

          <Chip selected={selectedFilter === "devolvido"} onPress={() => setSelectedFilter("devolvido")}>
            Devolvidos
          </Chip>
        </ScrollView>

        <Text style={styles.sectionTitle}>Coisas que me devem</Text>

        {meDevem.map((loan) => (
          <Card key={loan.id} onPress={() => router.push(`/loan/${loan.id}`)} style={styles.card}>
            <Card.Content>
              <Text>{loan.item_name}</Text>
              <Text style={{ color: getStatusColor(loan.status), fontWeight: "bold" }}>
                {normalizeStatus(loan.status)}
              </Text>
            </Card.Content>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Coisas que eu devo</Text>

        {euDevo.map((loan) => (
          <Card key={loan.id} onPress={() => router.push(`/loan/${loan.id}`)} style={styles.card}>
            <Card.Content>
              <Text>{loan.item_name}</Text>
              <Text style={{ color: getStatusColor(loan.status), fontWeight: "bold" }}>
                {normalizeStatus(loan.status)}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* MODAL (mantido) */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={styles.modal}>
                <Text>Novo Empréstimo</Text>

                <Text>Usuário</Text>
                <Picker selectedValue={borrowerId} onValueChange={setBorrowerId}>
                  {users.map((u) => (
                    <Picker.Item key={u.id} label={u.name} value={String(u.id)} />
                  ))}
                </Picker>

                <Text>Item</Text>
                <Picker selectedValue={itemId} onValueChange={setItemId}>
                  {items.map((i) => (
                    <Picker.Item key={i.id} label={i.name} value={String(i.id)} />
                  ))}
                </Picker>

                <TextInput value={dueDate} onChangeText={setDueDate} label="Data" />

                <Button onPress={() => setModalVisible(false)}>Fechar</Button>
              </ScrollView>
            </TouchableWithoutFeedback>
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
  title: { fontWeight: "bold" },
  sectionTitle: { marginTop: 20, fontWeight: "bold" },
  card: { marginBottom: 10 },
  modal: { backgroundColor: "white", padding: 20 },
  fab: { position: "absolute", right: 16, bottom: 16 },
});