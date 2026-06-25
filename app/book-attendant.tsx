import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

const DURATION_OPTIONS = ['1 hour', '2 hours', '3 hours', '4 hours', '6 hours', '8 hours', '12 hours', 'Full Day'];

const TIER_OPTIONS = [
  { label: 'Any', low: 50, high: 120 },
  { label: 'Standard', low: 50, high: 75 },
  { label: 'Experienced', low: 75, high: 120 },
];

const getPriceEstimate = (durationStr: string, tierLabel: string) => {
  if (!durationStr) return null;
  const hours = durationStr === 'Full Day' ? 12 : parseInt(durationStr) || 0;
  const tier = TIER_OPTIONS.find(t => t.label === tierLabel) || TIER_OPTIONS[0];
  return {
    low: hours * tier.low,
    high: hours * tier.high,
  };
};

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

  // Optional fields
  const [patientDesc, setPatientDesc] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [relativePhone, setRelativePhone] = useState('');
  const [notes, setNotes] = useState('');

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [tierPref, setTierPref] = useState('Any');
  const priceEstimate = getPriceEstimate(duration, tierPref);

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
  service_type: 'hospital_attendant',
  patient_name: patientName,
  location: hospital,
  date: formatDate(date!),
  time: formatTime(time!),
  duration,
  gender_pref: genderPref,
  patient_desc: patientDesc,
  patient_phone: patientPhone,
  relative_phone: relativePhone,
  notes,
  status: 'Pending',
  tier_pref: tierPref,
  estimated_price_low: priceEstimate?.low,
  estimated_price_high: priceEstimate?.high,
});

    if (error) throw error;
    Alert.alert('Success', 'Request posted! Attendants will be notified.');
    router.back();
  } catch (error: any) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Book a Hospital Attendant</Text>
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
        placeholder="e.g. Elderly woman, post knee surgery, needs wheelchair assistance"
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

      <Text style={styles.label}>Hospital Name & Address *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. RIMS Hospital, Ward 4, Imphal"
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
      
      {duration && (
  <View style={styles.priceBox}>
    <Text style={styles.priceTitle}>💰 Attendant Tier Preference</Text>
    <View style={styles.optionRow}>
      {TIER_OPTIONS.map((t) => (
        <TouchableOpacity
          key={t.label}
          style={[styles.optionBtn, tierPref === t.label && styles.optionBtnActive]}
          onPress={() => setTierPref(t.label)}
        >
          <Text style={[styles.optionText, tierPref === t.label && styles.optionTextActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    {priceEstimate && (
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Estimated Cost</Text>
        <Text style={styles.priceValue}>₹{priceEstimate.low} - ₹{priceEstimate.high}</Text>
      </View>
    )}
    <Text style={styles.priceNote}>
      Final price confirmed when an attendant accepts your request.
    </Text>
  </View>
)}

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
  priceBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  priceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C7BE5',
  },
  priceNote: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 8,
    fontStyle: 'italic',
  },
});