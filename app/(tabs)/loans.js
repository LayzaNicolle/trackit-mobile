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

  // ---------------- FETCH LOANS ----------------
  async function fetchLoans() {
    try {
      setLoading(true);

      const response = await api.get("/loans");

      setLoansData({
        coisasQueMeDevem: response.data?.coisasQueMeDevem || [],
        coisasQueEuDevo: response.data?.coisasQueEuDevo || [],
      });
    } catch (error) {
      console.log(error);
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
    try {
      const response = await api.get("/users");
      setUsers(response.data || []);
    } catch (error) {
      Alert.alert("Erro", "Erro ao carregar usuários");
    }
  }

  async function loadItems() {
    try {
      const response = await api.get("/items");
      setItems(response.data || []);
    } catch (error) {
      Alert.alert("Erro", "Erro ao carregar itens");
    }
  }

  async function openModal() {
    await Promise.all([loadUsers(), loadItems()]);

    setModalVisible(true);

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function isValidDate(date) {
    return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
  }

  function toISO(date) {
    const [d, m, y] = date.split("/");
    return `${y}-${m}-${d}`;
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

      setModalVisible(false);
      setBorrowerId("");
      setItemId("");
      setDueDate("");

      await fetchLoans();

      Alert.alert("Sucesso", "Empréstimo criado");
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar empréstimo");
    } finally {
      setCreatingLoan(false);
    }
  }

  // 🔥 ALTERAÇÃO QUE VOCÊ PEDIU
  function formatStatus(status) {
    switch ((status || "").toLowerCase()) {
      case "active":
      case "ativo":
        return "ATIVO";
      case "devolvido":
      case "returned":
        return "DEVOLVIDO";
      default:
        return (status || "").toUpperCase();
    }
  }

  function getStatusColor(status) {
    switch ((status || "").toLowerCase()) {
      case "active":
      case "ativo":
        return "#FF9800";
      case "devolvido":
        return "#4CAF50";
      default:
        return "#6200ee";
    }
  }

  function filterLoans(loans) {
    if (selectedFilter === "ALL") return loans;

    return loans.filter((loan) => {
      const status = (loan.status || "").toLowerCase();

      if (selectedFilter === "ativo") {
        return status === "active" || status === "ativo";
      }

      if (selectedFilter === "devolvido") {
        return status === "devolvido";
      }

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          <Card
            key={loan.id}
            onPress={() => router.push(`/loan/${loan.id}`)}
            style={styles.card}
          >
            <Card.Content>
              <Text>{loan.item_name}</Text>

              <Text style={{ color: getStatusColor(loan.status), fontWeight: "bold" }}>
                {formatStatus(loan.status)}
              </Text>
            </Card.Content>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Coisas que eu devo</Text>

        {euDevo.map((loan) => (
          <Card
            key={loan.id}
            onPress={() => router.push(`/loan/${loan.id}`)}
            style={styles.card}
          >
            <Card.Content>
              <Text>{loan.item_name}</Text>

              <Text style={{ color: getStatusColor(loan.status), fontWeight: "bold" }}>
                {formatStatus(loan.status)}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* MODAL RESTAURADO COMPLETO */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={styles.modal}>
                <Text>Novo Empréstimo</Text>

                <Text style={styles.label}>Usuário</Text>
                <Picker selectedValue={borrowerId} onValueChange={setBorrowerId}>
                  <Picker.Item label="Selecione usuário" value="" />
                  {users.map((u) => (
                    <Picker.Item
                      key={u.id}
                      label={u.name}
                      value={String(u.id)}
                    />
                  ))}
                </Picker>

                <Text style={styles.label}>Item</Text>
                <Picker selectedValue={itemId} onValueChange={setItemId}>
                  <Picker.Item label="Selecione item" value="" />
                  {items.map((i) => (
                    <Picker.Item
                      key={i.id}
                      label={i.name}
                      value={String(i.id)}
                    />
                  ))}
                </Picker>

                <TextInput
                  label="Data (DD/MM/AAAA)"
                  value={dueDate}
                  onChangeText={setDueDate}
                  style={{ marginTop: 10 }}
                />

                <Button
                  mode="contained"
                  loading={creatingLoan}
                  onPress={createLoan}
                  style={{ marginTop: 20 }}
                >
                  Criar Empréstimo
                </Button>

                <Button onPress={() => setModalVisible(false)}>
                  Cancelar
                </Button>
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
  container: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontWeight: "bold", marginBottom: 10 },
  sectionTitle: { marginTop: 20, fontWeight: "bold" },
  card: { marginBottom: 10, borderRadius: 12 },
  modal: { backgroundColor: "white", padding: 20, borderRadius: 16 },
  label: { marginTop: 12, fontWeight: "600" },
  fab: { position: "absolute", right: 16, bottom: 16 },
});