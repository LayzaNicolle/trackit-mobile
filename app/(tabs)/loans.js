import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
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
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const response = await api.get("/users");
      setUsers(response.data || []);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadItems() {
    try {
      const response = await api.get("/items");
      setItems(response.data || []);
    } catch (error) {
      console.log(error);
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
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function isValidDate(date) {
    return !isNaN(Date.parse(date));
  }

  async function createLoan() {
    try {
      if (!borrowerId || !itemId || !dueDate) {
        Alert.alert("Atenção", "Preencha todos os campos");
        return;
      }

      if (!isValidDate(dueDate)) {
        Alert.alert("Data inválida", "Use o formato YYYY-MM-DD");
        return;
      }

      setCreatingLoan(true);

      await api.post("/loans", {
        borrowerId: Number(borrowerId),
        itemId: Number(itemId),
        dueDate,
      });

      Alert.alert("Sucesso", "Empréstimo criado com sucesso");

      setBorrowerId("");
      setItemId("");
      setDueDate("");

      setModalVisible(false);

      fetchLoans();
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível criar o empréstimo");
    } finally {
      setCreatingLoan(false);
    }
  }

  useEffect(() => {
    fetchLoans();
  }, []);

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

  function filterLoans(loans) {
    if (selectedFilter === "ALL") return loans;

    return loans.filter(
      (loan) =>
        loan.status?.toLowerCase() === selectedFilter.toLowerCase()
    );
  }

  const meDevem = filterLoans(loansData.coisasQueMeDevem);
  const euDevo = filterLoans(loansData.coisasQueEuDevo);

  function LoanCard({ loan, type }) {
    return (
      <Card
        style={styles.card}
        onPress={() => router.push(`/loan/${loan.id}`)}
      >
        <Card.Content>
          <Text variant="titleMedium">{loan.item_name}</Text>

          {type === "ME_DEVEM" && (
            <>
              <Text style={styles.info}>
                Tomador: {loan.borrower_name}
              </Text>
              <Text style={styles.info}>
                Email: {loan.borrower_email}
              </Text>
            </>
          )}

          {type === "EU_DEVO" && (
            <Text style={styles.info}>Credor: -</Text>
          )}

          <Text style={styles.info}>
            Prazo: {formatDate(loan.due_date)}
          </Text>

          <Text
            style={[
              styles.status,
              { color: getStatusColor(loan.status) },
            ]}
          >
            Status: {loan.status}
          </Text>
        </Card.Content>
      </Card>
    );
  }

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

          <Chip selected={selectedFilter === "active"} onPress={() => setSelectedFilter("active")}>
            Ativos
          </Chip>

          <Chip selected={selectedFilter === "devolvido"} onPress={() => setSelectedFilter("devolvido")}>
            Devolvidos
          </Chip>
        </ScrollView>

        <Text style={styles.sectionTitle}>📤 Coisas que me devem</Text>

        {meDevem.map((loan) => (
          <LoanCard key={loan.id} loan={loan} type="ME_DEVEM" />
        ))}

        <Text style={styles.sectionTitle}>📥 Coisas que eu devo</Text>

        {euDevo.map((loan) => (
          <LoanCard key={loan.id} loan={loan} type="EU_DEVO" />
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={{ backgroundColor: "transparent" }}
        >
          <Animated.View
            style={[
              styles.modal,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text variant="headlineSmall">Novo Empréstimo</Text>

            <Text style={styles.label}>Usuário</Text>
            <Picker
              selectedValue={borrowerId}
              onValueChange={(value) => setBorrowerId(value)}
            >
              <Picker.Item label="Selecione um usuário" value="" />
              {users.map((user) => (
                <Picker.Item
                  key={user.id}
                  label={user.name}
                  value={String(user.id)}
                />
              ))}
            </Picker>

            <Text style={styles.label}>Item</Text>
            <Picker
              selectedValue={itemId}
              onValueChange={(value) => setItemId(value)}
            >
              <Picker.Item label="Selecione um item" value="" />
              {items.map((item) => (
                <Picker.Item
                  key={item.id}
                  label={item.name}
                  value={String(item.id)}
                />
              ))}
            </Picker>

            <TextInput
              label="Data de devolução (YYYY-MM-DD)"
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
          </Animated.View>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={openModal} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  sectionTitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "bold",
  },

  card: {
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },

  info: {
    marginTop: 5,
  },

  status: {
    marginTop: 10,
    fontWeight: "bold",
  },

  modal: {
    backgroundColor: "white",
    padding: 22,
    margin: 20,
    borderRadius: 16,
  },

  label: {
    marginTop: 12,
    fontWeight: "600",
    color: "#444",
  },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});