import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [isAttendant, setIsAttendant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<any>(null);

  // Edit form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userRole').then(role => {
      setIsAttendant(role === 'attendant');
    });
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setArea(data.area || '');
      setGender(data.gender || '');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone,
          area,
          gender,
          role: isAttendant ? 'attendant' : 'patient',
        })
        .eq('id', user.id);

      if (error) throw error;
      Alert.alert('Success', 'Profile updated!');
      setShowEditModal(false);
      fetchProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('userRole');
    router.replace('/auth');
  };

  const tierNames: Record<number, string> = {
    1: 'Newcomer',
    2: 'Trusted',
    3: 'Experienced',
    4: 'Expert',
  };

  const tierTargets: Record<number, number> = {
    1: 10,
    2: 30,
    3: 60,
    4: 60,
  };

  const currentTier = profile?.tier || 1;
  const jobsDone = profile?.jobs_completed || 0;
  const tierTarget = tierTargets[currentTier];
  const progress = Math.min(jobsDone / tierTarget, 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar & Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{isAttendant ? '👩‍⚕️' : '👤'}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Your Name'}</Text>
        <Text style={styles.role}>{isAttendant ? 'Attendant / Nurse' : 'Patient / Family'}</Text>
        {isAttendant && (
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>⭐ Tier {currentTier} — {tierNames[currentTier]}</Text>
          </View>
        )}
      </View>

      {/* Stats Row — Attendant Only */}
      {isAttendant && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{jobsDone}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {profile?.avg_rating ? profile.avg_rating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{Math.max(tierTarget - jobsDone, 0)}</Text>
            <Text style={styles.statLabel}>Jobs to Tier {currentTier + 1}</Text>
          </View>
        </View>
      )}

      {/* Tier Progress — Attendant Only */}
      {isAttendant && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tier Progress</Text>
          <Text style={styles.tierDesc}>
            Complete {tierTarget} jobs with a 4.0+ rating to unlock Tier {currentTier + 1} and accept more patients at a time.
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{jobsDone} / {tierTarget} jobs completed</Text>
        </View>
      )}

      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{profile?.phone || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Area / City</Text>
              <Text style={styles.infoValue}>{profile?.area || 'Not set'}</Text>
            </View>
            {isAttendant && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{profile?.gender || 'Not set'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID Verification</Text>
                  <Text style={[styles.infoValue, { color: profile?.id_verified ? '#28a745' : '#f0a500' }]}>
                    {profile?.id_verified ? 'Verified ✓' : 'Pending'}
                  </Text>
                </View>
              </>
            )}
          </>
        )}

        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
          <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0 (Beta)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Region</Text>
          <Text style={styles.infoValue}>India 🇮🇳</Text>
        </View>
      </View>

      {/* Switch Role */}
      <TouchableOpacity
        style={styles.switchBtn}
        onPress={() => router.replace('/onboarding')}
      >
        <Text style={styles.switchBtnText}>Switch Role</Text>
      </TouchableOpacity>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 98765 43210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Area / City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jorhat"
              value={area}
              onChangeText={setArea}
            />

            {isAttendant && (
              <>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.optionRow}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.optionBtn, gender === g && styles.optionBtnActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[styles.optionText, gender === g && styles.optionTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={saveProfile}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 44,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  role: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  tierBadge: {
    marginTop: 8,
    backgroundColor: '#fff9e6',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#f0a500',
  },
  tierText: {
    fontSize: 13,
    color: '#f0a500',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C7BE5',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C7BE5',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
    paddingBottom: 8,
  },
  tierDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f2f8',
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#2C7BE5',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginTop: 4,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  editBtn: {
    marginTop: 14,
    backgroundColor: '#F4F6FA',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  editBtnText: {
    fontSize: 14,
    color: '#2C7BE5',
    fontWeight: '600',
  },
  switchBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    marginBottom: 12,
  },
  switchBtnText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
  },
  signOutBtn: {
    backgroundColor: '#fff0f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffcccc',
  },
  signOutText: {
    fontSize: 15,
    color: '#e05c2a',
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
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: '#2C7BE5',
    borderColor: '#2C7BE5',
  },
  optionText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: '#2C7BE5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
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