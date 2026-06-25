import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Modal, TextInput } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f0a500',
  Confirmed: '#2C7BE5',
  Completed: '#28a745',
  Cancelled: '#e05c2a',
};

export default function BookingsScreen() {
  const [isAttendant, setIsAttendant] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userRole').then(role => {
      setIsAttendant(role === 'attendant');
    });
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [isAttendant]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const role = await AsyncStorage.getItem('userRole');
      const attendant = role === 'attendant';

      let query = supabase
        .from('bookings')
        .select('*, attendant:users!bookings_attendant_id_fkey(full_name, phone)')
        .neq('status', 'Cancelled')
        .order('created_at', { ascending: false });

      query = attendant ? query.eq('attendant_id', user.id) : query.eq('patient_id', user.id);

      const { data, error } = await query;
      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', id);
      if (error) throw error;
      await fetchBookings();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const completeJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Completed' })
        .eq('id', id);
      if (error) throw error;
      await fetchBookings();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const submitRating = async () => {
    if (ratingScore === 0) {
      Alert.alert('Error', 'Please select a star rating');
      return;
    }
    setSubmittingRating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !ratingBooking) return;

      const { error } = await supabase.from('ratings').insert({
        booking_id: ratingBooking.id,
        rater_id: user.id,
        rated_id: ratingBooking.attendant_id,
        score: ratingScore,
        comment: ratingComment,
      });
      if (error) throw error;

      // Recalculate attendant's average rating + job count
      const { data: allRatings } = await supabase
        .from('ratings')
        .select('score')
        .eq('rated_id', ratingBooking.attendant_id);

      const avg = allRatings && allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length
        : ratingScore;

      await supabase
        .from('users')
        .update({
          avg_rating: avg,
          jobs_completed: allRatings?.length || 1,
        })
      .eq('id', ratingBooking.attendant_id);

      Alert.alert('Thank you!', 'Your rating has been submitted.');
      setRatingModalVisible(false);
      setRatingScore(0);
      setRatingComment('');
      fetchBookings();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Build calendar dots from bookings
  const markedDates: any = {};
  bookings.forEach((b) => {
    const [day, month, year] = b.date.split('/');
    const iso = `${year}-${month}-${day}`;
    const dotColor = b.service_type === 'hospital_attendant' ? '#2C7BE5' : '#28a745';
    markedDates[iso] = { marked: true, dotColor };
  });
  if (selectedDate) {
    markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: '#2C7BE5' };
  }

  // Filter list by selected date if one is picked
  const displayedBookings = selectedDate
    ? bookings.filter((b) => {
        const [day, month, year] = b.date.split('/');
        return `${year}-${month}-${day}` === selectedDate;
      })
    : bookings;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{isAttendant ? 'My Jobs' : 'My Bookings'}</Text>

      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString === selectedDate ? '' : day.dateString)}
        theme={{
          todayTextColor: '#2C7BE5',
          selectedDayBackgroundColor: '#2C7BE5',
          arrowColor: '#2C7BE5',
        }}
      />

      <View style={styles.legend}>
        <Text style={styles.legendText}>🔵 Hospital Visit</Text>
        <Text style={styles.legendText}>🟢 Home Nursing</Text>
        {selectedDate ? (
          <TouchableOpacity onPress={() => setSelectedDate('')}>
            <Text style={styles.clearText}>Clear filter ✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.listTitle}>
        {selectedDate ? `Bookings on this day` : isAttendant ? 'All My Jobs' : 'All My Bookings'}
      </Text>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : displayedBookings.length === 0 ? (
        <Text style={styles.empty}>
          {selectedDate ? 'No bookings on this day.' : isAttendant ? 'No jobs yet.' : 'No bookings yet.'}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {displayedBookings.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardType}>
                  {item.service_type === 'hospital_attendant' ? 'Hospital Attendant' : 'Home Nurse'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

                            
              <Text style={styles.cardLocation}>📍 {item.location}</Text>
              <Text style={styles.cardPatient}>👤 Patient: {item.patient_name}</Text>

              {!isAttendant && item.attendant && (
                <Text style={styles.cardPatient}>
                  👩‍⚕️ Attendant: {item.attendant.full_name || 'Name not set'} — 📞 {item.attendant.phone || 'Not available'}
              </Text>
              )}

              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>📅 {item.date}</Text>
                <Text style={styles.metaText}>🕐 {item.time}</Text>
                <Text style={styles.metaText}>⏱️ {item.duration}</Text>
              </View>

              {!isAttendant && item.status === 'Completed' && (
                <TouchableOpacity
                  style={styles.rateBtn}
                  onPress={() => {
                    setRatingBooking(item);
                    setRatingModalVisible(true);
                  }}
                >
                  <Text style={styles.rateBtnText}>⭐ Leave a Rating</Text>
                </TouchableOpacity>
              )}

              {item.status === 'Pending' && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => Alert.alert(
                    'Cancel Booking',
                    'Are you sure?',
                    [
                      { text: 'No' },
                      { text: 'Yes', onPress: () => cancelBooking(item.id) }
                    ]
                  )}
                >
                  <Text style={styles.cancelBtnText}>Cancel Request</Text>
                </TouchableOpacity>
              )}

              {isAttendant && item.status === 'Confirmed' && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => Alert.alert(
                    'Mark as Completed',
                    'Confirm that this job has been completed?',
                  [
                    { text: 'Cancel' },
                    { text: 'Yes, Completed', onPress: () => completeJob(item.id) }
                  ]
                )}
              >
                <Text style={styles.completeBtnText}>✓ Mark Job Completed</Text>
              </TouchableOpacity>
            )}

            </View>
          ))}
        </ScrollView>
      )}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Rate Your Experience</Text>
      <Text style={styles.modalSubtitle}>
        How was your experience with {ratingBooking?.attendant?.full_name || 'your attendant'}?
      </Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRatingScore(star)}>
            <Text style={styles.star}>
              {star <= ratingScore ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.commentInput}
        placeholder="Leave a comment (optional)"
        value={ratingComment}
        onChangeText={setRatingComment}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitRatingBtn, submittingRating && { opacity: 0.6 }]}
        onPress={submitRating}
        disabled={submittingRating}
      >
        <Text style={styles.submitRatingText}>
          {submittingRating ? 'Submitting...' : 'Submit Rating'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
        <Text style={styles.modalCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
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
    marginBottom: 12,
  },
  legend: {
    marginTop: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#555',
  },
  clearText: {
    fontSize: 12,
    color: '#e05c2a',
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
  },
  empty: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardLocation: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  cardPatient: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  rateBtn: {
    marginTop: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0a500',
  },
  rateBtnText: {
    fontSize: 13,
    color: '#f0a500',
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#e05c2a',
    fontWeight: '600',
  },
  completeBtn: {
  marginTop: 12,
  backgroundColor: '#e8f4ea',
  borderRadius: 8,
  paddingVertical: 8,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#28a745',
},
completeBtnText: {
  fontSize: 13,
  color: '#28a745',
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
  fontSize: 18,
  fontWeight: '700',
  color: '#1a1a1a',
  textAlign: 'center',
  marginBottom: 6,
},
modalSubtitle: {
  fontSize: 13,
  color: '#888',
  textAlign: 'center',
  marginBottom: 20,
},
starsRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 20,
},
star: {
  fontSize: 36,
},
commentInput: {
  backgroundColor: '#F4F6FA',
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  borderWidth: 1,
  borderColor: '#dde3f0',
  height: 80,
  textAlignVertical: 'top',
  marginBottom: 16,
},
submitRatingBtn: {
  backgroundColor: '#2C7BE5',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
  marginBottom: 12,
},
submitRatingText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '700',
},
modalCancelText: {
  textAlign: 'center',
  color: '#888',
  fontSize: 14,
},
});