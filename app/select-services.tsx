import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function SelectServicesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(['hospital_attendant']);
  const [loading, setLoading] = useState(false);

  const toggleService = (service: string) => {
    // hospital_attendant is always required, can't be removed
    if (service === 'hospital_attendant') return;
    setSelected((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ services_offered: selected, role: 'attendant' })
        .eq('id', user.id);

      if (error) throw error;
      router.push({ pathname: '/(tabs)', params: { role: 'attendant' } });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What services do you offer?</Text>
      <Text style={styles.subheading}>
        Hospital Attendant is included by default. Add Home Nurse if you're certified.
      </Text>

      <TouchableOpacity style={[styles.card, styles.cardLocked]}>
        <Text style={styles.cardIcon}>🏥</Text>
        <Text style={styles.cardTitle}>Hospital Attendant</Text>
        <Text style={styles.cardDesc}>Accompany patients to hospital visits</Text>
        <View style={styles.checkBadge}>
          <Text style={styles.checkBadgeText}>✓ Included</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, selected.includes('home_nurse') && styles.cardActive]}
        onPress={() => toggleService('home_nurse')}
      >
        <Text style={styles.cardIcon}>🏠</Text>
        <Text style={styles.cardTitle}>Home Nurse</Text>
        <Text style={styles.cardDesc}>
          Provide live-in or scheduled nursing care at home. Requires certification upload.
        </Text>
        <View style={[styles.checkBadge, selected.includes('home_nurse') ? styles.checkBadgeActive : styles.checkBadgeInactive]}>
          <Text style={[styles.checkBadgeText, selected.includes('home_nurse') ? {} : { color: '#888' }]}>
            {selected.includes('home_nurse') ? '✓ Selected' : 'Tap to add'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.continueBtn, loading && { opacity: 0.6 }]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.continueBtnText}>{loading ? 'Saving...' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#dde3f0',
  },
  cardLocked: {
    borderColor: '#2C7BE5',
    opacity: 0.9,
  },
  cardActive: {
    borderColor: '#28a745',
    backgroundColor: '#f4fbf6',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 12,
  },
  checkBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#e8f0fe',
  },
  checkBadgeActive: {
    backgroundColor: '#e8f4ea',
  },
  checkBadgeInactive: {
    backgroundColor: '#F4F6FA',
  },
  checkBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#28a745',
  },
  continueBtn: {
    backgroundColor: '#2C7BE5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});