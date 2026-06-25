import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

const DURATION_OPTIONS = ['1 hour', '2 hours', '3 hours', '4 hours', '6 hours', '8 hours', '12 hours', 'Full Day'];

export default function BookAttendantScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Required fields
  const [patientName, setPatientName] = useState('');
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState('');
  const [genderPref, setGenderPref] = useState('Any');
  const [relativePhone, setRelativePhone] = useState('');

  // Optional fields
  const [patientDesc, setPatientDesc] = useState('');
  const [patientPhone, setPatientPhone] = useState('');  
  const [notes, setNotes] = useState('');
  const [canCook, setCanCook] = useState(false);
  const [liftAssist, setLiftAssist] = useState(false);
  const [medicalTraining, setMedicalTraining] = useState(false);

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (t: Date) => t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleSubmit = async () => {
  if (!patientName || !hospital || !date || !time || !duration || !genderPref || !relativePhone) {
    Alert.alert('Error', 'Please fill in all required fields marked with *');
    return;
  }

  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('bookings').insert({
      patient_id: user?.id,
      service_type: 'home_nurse',
      patient_name: patientName,
      location: hospital,
      date: formatDate(date!),
      time: formatTime(time!),
      duration,
      gender_pref: genderPref,
      patient_desc: patientDesc,
      patient_phone: patientPhone,
      relative_phone: relativePhone,
      can_cook: canCook,
      lift_assist: liftAssist,
      medical_training: medicalTraining,
      notes,
      status: 'Pending',
    });

    if (error) throw error;
    Alert.alert('Success', 'Request posted! Nurses will be notified.');
    router.back();
  } catch (error: any) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Book a Home Nurse</Text>
      <Text style={styles.subheading}>Fields marked with * are required</Text>

      {/* Patient Info */}
      <Text style={styles.sectionTitle}>Patient Information</Text>

      <Text style={styles.label}>Patient Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name of the patient"
        value={patientName}
        onChangeText={setPatientName}
      />

      <Text style={styles.label}>Brief Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="e.g. Elderly man, post knee surgery, confined to bed-rest"
        value={patientDesc}
        onChangeText={setPatientDesc}
        multiline
        numberOfLines={3}
      />

      {/* Contact Info */}
      <Text style={styles.sectionTitle}>Contact Information</Text>

      <Text style={styles.label}>Patient Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 98765 43210"
        value={patientPhone}
        onChangeText={setPatientPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Family / Relative Phone Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 98765 43210"
        value={relativePhone}
        onChangeText={setRelativePhone}
        keyboardType="phone-pad"
      />

      {/* Location & Time */}
      <Text style={styles.sectionTitle}>Location & Time</Text>

      <Text style={styles.label}>Home Address *</Text>
      <TextInput
        style={styles.input}
        placeholder="House No.11, Jyoti Nagar, Tarajan, Jorhat"
        value={hospital}
        onChangeText={setHospital}
      />

      <Text style={styles.label}>Date *</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
        <Text style={date ? styles.pickerBtnTextFilled : styles.pickerBtnTextEmpty}>
          {date ? formatDate(date) : 'Tap to select date'}
        </Text>
        <Text style={styles.pickerIcon}>📅</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="calendar"
          minimumDate={new Date()}
          onChange={(event, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <Text style={styles.label}>Time *</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
        <Text style={time ? styles.pickerBtnTextFilled : styles.pickerBtnTextEmpty}>
          {time ? formatTime(time) : 'Tap to select time'}
        </Text>
        <Text style={styles.pickerIcon}>🕐</Text>
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          value={time || new Date()}
          mode="time"
          display="clock"
          onChange={(event, selected) => {
            setShowTimePicker(false);
            if (selected) setTime(selected);
          }}
        />
      )}

      <Text style={styles.label}>Duration *</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDurationPicker(true)}>
        <Text style={duration ? styles.pickerBtnTextFilled : styles.pickerBtnTextEmpty}>
          {duration || 'Select duration'}
        </Text>
        <Text style={styles.pickerIcon}>⏱️</Text>
      </TouchableOpacity>

      {/* Duration Modal */}
      <Modal visible={showDurationPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Duration</Text>
            {DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, duration === option && styles.modalOptionActive]}
                onPress={() => {
                  setDuration(option);
                  setShowDurationPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, duration === option && styles.modalOptionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDurationPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Requirements */}
      <Text style={styles.sectionTitle}>Requirements</Text>

      <Text style={styles.label}>Gender Preference *</Text>
      <View style={styles.optionRow}>
        {['Any', 'Male', 'Female'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionBtn, genderPref === option && styles.optionBtnActive]}
            onPress={() => setGenderPref(option)}
          >
            <Text style={[styles.optionText, genderPref === option && styles.optionTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Special Skills Needed</Text>
      <View style={styles.checkRow}>
      <TouchableOpacity
        style={[styles.checkBtn, canCook && styles.checkBtnActive]}
        onPress={() => setCanCook(!canCook)}
      >
      <Text style={[styles.checkText, canCook && styles.checkTextActive]}>
          {canCook ? '✓ ' : ''}Can Cook
      </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkBtn, liftAssist && styles.checkBtnActive]}
        onPress={() => setLiftAssist(!liftAssist)}
      >
      <Text style={[styles.checkText, liftAssist && styles.checkTextActive]}>
          {liftAssist ? '✓ ' : ''}Lift Assistance
      </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkBtn, medicalTraining && styles.checkBtnActive]}
        onPress={() => setMedicalTraining(!medicalTraining)}
      >
      <Text style={[styles.checkText, medicalTraining && styles.checkTextActive]}>
          {medicalTraining ? '✓ ' : ''}Medical Training
      </Text>
      </TouchableOpacity>
    </View>

      <Text style={styles.label}>Additional Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Anything else the attendant should know..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
  style={[styles.submitBtn, loading && { opacity: 0.6 }]}
  onPress={handleSubmit}
  disabled={loading}
>
  <Text style={styles.submitText}>
    {loading ? 'Posting...' : 'Post Request'}
  </Text>
</TouchableOpacity>

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
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#e05c2a',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C7BE5',
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dde3f0',
    paddingBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dde3f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerBtnTextEmpty: {
    fontSize: 14,
    color: '#aaa',
  },
  pickerBtnTextFilled: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  pickerIcon: {
    fontSize: 18,
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
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F4F6FA',
  },
  modalOptionActive: {
    backgroundColor: '#2C7BE5',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  modalOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalCancel: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#e05c2a',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    backgroundColor: '#fff',
  },
  optionBtnActive: {
    backgroundColor: '#2C7BE5',
    borderColor: '#2C7BE5',
  },
  optionText: {
    fontSize: 14,
    color: '#555',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#2C7BE5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
},
checkBtn: {
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: '#dde3f0',
  backgroundColor: '#fff',
},
checkBtnActive: {
  backgroundColor: '#e8f4ea',
  borderColor: '#28a745',
},
checkText: {
  fontSize: 13,
  color: '#555',
},
checkTextActive: {
  color: '#28a745',
  fontWeight: '600',
},
});