import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function HomeScreen() {
  const { role } = useLocalSearchParams();
  const isAttendant = role === 'attendant';
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CareLink</Text>
      <Text style={styles.subtitle}>
        {isAttendant ? 'Welcome, Care Provider 👩‍⚕️' : 'How can we help today? 👋'}
      </Text>

      <View style={styles.cardContainer}>
        {isAttendant ? (
          <>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/open-requests')}
            >
              <Text style={styles.cardIcon}>📋</Text>
              <Text style={styles.cardTitle}>Open Requests</Text>
              <Text style={styles.cardDesc}>
                Browse service requests near you and accept jobs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <Text style={styles.cardIcon}>📅</Text>
              <Text style={styles.cardTitle}>My Jobs</Text>
              <Text style={styles.cardDesc}>
                View your upcoming and completed assignments
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/book-attendant')}
            >
              <Text style={styles.cardIcon}>🏥</Text>
              <Text style={styles.cardTitle}>Hospital Attendant</Text>
              <Text style={styles.cardDesc}>
                Book someone to accompany your family member to hospital
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/book-nurse')}
            >
              <Text style={styles.cardIcon}>🏠</Text>
              <Text style={styles.cardTitle}>Home Nurse</Text>
              <Text style={styles.cardDesc}>
                Find a nurse to care for your loved one at home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/(tabs)/donors')}
            >
              <Text style={styles.cardIcon}>🩸</Text>
              <Text style={styles.cardTitle}>Blood Donors</Text>
              <Text style={styles.cardDesc}>
                Find blood donors in your area by blood group
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA', 
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C7BE5',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginTop: 4,
    marginBottom: 30,
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
});
