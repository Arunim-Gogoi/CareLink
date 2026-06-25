import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function DonorsScreen() {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlood, setSelectedBlood] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regArea, setRegArea] = useState('');
  const [regBlood, setRegBlood] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, [selectedBlood]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blood_donors')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (selectedBlood) {
        query = query.eq('blood_group', selectedBlood);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDonors(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regPhone || !regArea || !regBlood) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setRegLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('blood_donors').insert({
        user_id: user?.id,
        full_name: regName,
        phone: regPhone,
        area: regArea,
        blood_group: regBlood,
        available: true,
      });

      if (error) throw error;
      Alert.alert('Thank you!', `${regName}, you are now registered as a blood donor.`);
      setShowRegisterModal(false);
      setRegName(''); setRegPhone(''); setRegArea(''); setRegBlood('');
      fetchDonors();
    } catch (error: any) {
      if(error.message.includes('unique_user_donor')){
        Alert.alert('Already Registered', 'You are already registered as a blood donor.');
      } else{
        Alert.alert('Error', error.message);
      }
      
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Blood Donors</Text>

      {/* Toggle Buttons */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, styles.toggleBtnActive]}
          onPress={() => {}}
        >
          <Text style={[styles.toggleText, styles.toggleTextActive]}>
            🔍 Find a Donor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setShowRegisterModal(true)}
        >
          <Text style={styles.toggleText}>
            🩸 Register as Donor
          </Text>
        </TouchableOpacity>
      </View>

      {/* Blood Group Filter */}
      <Text style={styles.filterLabel}>Filter by Blood Group</Text>
      <View style={styles.filterRow}>
  <TouchableOpacity
    style={[styles.filterBtn, selectedBlood === '' && styles.filterBtnActive]}
    onPress={() => setSelectedBlood('')}
  >
    <Text style={[styles.filterText, selectedBlood === '' && styles.filterTextActive]}>All</Text>
  </TouchableOpacity>
  {BLOOD_GROUPS.map(bg => (
    <TouchableOpacity
      key={bg}
      style={[styles.filterBtn, selectedBlood === bg && styles.filterBtnActive]}
      onPress={() => setSelectedBlood(bg)}
    >
      <Text style={[styles.filterText, selectedBlood === bg && styles.filterTextActive]}>{bg}</Text>
    </TouchableOpacity>
  ))}
</View>
      {/* Donor List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.empty}>Loading donors...</Text>
        ) : donors.length === 0 ? (
          <Text style={styles.empty}>
            {selectedBlood ? `No donors found for ${selectedBlood}.` : 'No donors registered yet.'}
          </Text>
        ) : (
          donors.map(donor => (
            <View key={donor.id} style={styles.donorCard}>
              <View style={styles.donorTop}>
                <View>
                  <Text style={styles.donorName}>{donor.full_name}</Text>
                  <Text style={styles.donorArea}>📍 {donor.area}</Text>
                </View>
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodText}>{donor.blood_group}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Alert.alert('Contact Donor', `Call ${donor.full_name} at ${donor.phone}`)}
              >
                <Text style={styles.contactBtnText}>📞 Contact Donor</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Register Modal */}
      <Modal visible={showRegisterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalBox}>
            <Text style={styles.modalTitle}>Register as Blood Donor</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={regName}
              onChangeText={setRegName}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 98765 43210"
              value={regPhone}
              onChangeText={setRegPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Area / City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jorhat"
              value={regArea}
              onChangeText={setRegArea}
            />

            <Text style={styles.label}>Blood Group</Text>
            <View style={styles.bloodGroupGrid}>
              {BLOOD_GROUPS.map(bg => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.bgBtn, regBlood === bg && styles.bgBtnActive]}
                  onPress={() => setRegBlood(bg)}
                >
                  <Text style={[styles.bgText, regBlood === bg && styles.bgTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, regLoading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={regLoading}
            >
              <Text style={styles.submitText}>
                {regLoading ? 'Registering...' : 'Register'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowRegisterModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#2C7BE5',
    borderColor: '#2C7BE5',
  },
  toggleText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  filterRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 16,
},
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    backgroundColor: '#e05c2a',
    borderColor: '#e05c2a',
  },
  filterText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  empty: {
    color: '#aaa',
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
  },
  donorCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  donorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  donorArea: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  bloodBadge: {
    backgroundColor: '#ffe5e5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bloodText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e05c2a',
  },
  contactBtn: {
    backgroundColor: '#F4F6FA',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  contactBtnText: {
    fontSize: 13,
    color: '#2C7BE5',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F4F6FA',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  bgBtn: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
  },
  bgBtnActive: {
    backgroundColor: '#e05c2a',
    borderColor: '#e05c2a',
  },
  bgText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
  },
  bgTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#e05c2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#888',
  },
});