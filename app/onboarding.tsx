import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { setupMicrotasks } from 'react-native-worklets/lib/typescript/threads';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CareLink</Text>
        <Text style={styles.subtitle}>
          Connecting those who need care{'\n'}with those who provide it.
        </Text>
      </View>

      <Text style={styles.question}>I am here as a...</Text>

      <View style={styles.cardContainer}>

        <TouchableOpacity
          style={styles.card}
          // Patient card
          onPress={async () => {
              await AsyncStorage.setItem('userRole', 'patient');
              router.push({ pathname: '/(tabs)', params: { role: 'patient' } });
          }}
        >
          <Text style={styles.cardIcon}>👨‍👩‍👧</Text>
          <Text style={styles.cardTitle}>Patient / Family</Text>
          <Text style={styles.cardDesc}>
            I need to book an attendant or nurse for my family member
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardAlt]}
          onPress={async () => {
            await AsyncStorage.setItem('userRole', 'attendant');
            router.push('/select-services');
          }}
        >
          <Text style={styles.cardIcon}>👩‍⚕️</Text>
          <Text style={styles.cardTitle}>Attendant / Nurse</Text>
          <Text style={styles.cardDesc}>
            I want to offer my services and accept care requests
          </Text>
        </TouchableOpacity>

      </View>

      <Text style={styles.note}>
        You can change this later in your Profile settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2C7BE5',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#2C7BE5',
  },
  cardAlt: {
    borderColor: '#28a745',
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  note: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
});