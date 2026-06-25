import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function OpenRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('services_offered')
  .eq('id', user?.id)
  .single();

const myServices = profile?.services_offered || ['hospital_attendant'];

const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'Pending')
  .is('attendant_id', null)
  .in('service_type', myServices)
  .order('created_at', { ascending: false });

if (error) throw error;
setRequests(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('bookings')
        .update({
          attendant_id: user.id,
          status: 'Confirmed',
        })
        .eq('id', id);

      if (error) throw error;
      Alert.alert('Success', 'You have accepted this job! It will appear in My Jobs.');
      fetchRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Open Requests</Text>
      <Text style={styles.subheading}>Browse and accept available jobs</Text>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : requests.length === 0 ? (
        <Text style={styles.empty}>No open requests at the moment.</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {requests.map((item) => (
            <View key={item.id} style={styles.card}>

              <View style={styles.cardTop}>
                <Text style={styles.cardType}>
                  {item.service_type === 'hospital_attendant' ? '🏥 Hospital Attendant' : '🏠 Home Nurse'}
                </Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>

              <Text style={styles.cardLocation}>📍 {item.location}</Text>
              <Text style={styles.cardPatient}>👤 {item.patient_name}</Text>

              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>🕐 {item.time}</Text>
                <Text style={styles.metaText}>⏱️ {item.duration}</Text>
                <Text style={styles.metaText}>👤 {item.gender_pref}</Text>
              </View>

              {item.patient_desc ? (
                <Text style={styles.cardDesc}>📋 {item.patient_desc}</Text>
              ) : null}

              {item.can_cook || item.lift_assist || item.medical_training ? (
                <View style={styles.skillsRow}>
                  {item.can_cook && <View style={styles.skillBadge}><Text style={styles.skillText}>Can Cook</Text></View>}
                  {item.lift_assist && <View style={styles.skillBadge}><Text style={styles.skillText}>Lift Assist</Text></View>}
                  {item.medical_training && <View style={styles.skillBadge}><Text style={styles.skillText}>Medical Training</Text></View>}
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => Alert.alert(
                  'Accept Job',
                  `Accept this ${item.service_type === 'hospital_attendant' ? 'hospital attendant' : 'home nurse'} job for ${item.patient_name}?`,
                  [
                    { text: 'Cancel' },
                    { text: 'Accept', onPress: () => acceptRequest(item.id) }
                  ]
                )}
              >
                <Text style={styles.acceptBtnText}>✓ Accept Job</Text>
              </TouchableOpacity>

            </View>
          ))}
        </ScrollView>
      )}
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
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  empty: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardDate: {
    fontSize: 13,
    color: '#2C7BE5',
    fontWeight: '600',
  },
  cardLocation: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  cardPatient: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#F4F6FA',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillBadge: {
    backgroundColor: '#e8f4ea',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  skillText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  acceptBtn: {
    backgroundColor: '#2C7BE5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});