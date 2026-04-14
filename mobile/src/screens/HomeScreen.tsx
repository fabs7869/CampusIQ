import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, RefreshControl } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { complaintsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Icon from 'react-native-vector-icons/Feather'
import * as Haptics from 'expo-haptics'
import { useBadges } from '../context/BadgeContext'
import { analyticsAPI } from '../services/api'

const STATUS_COLOR: Record<string, string> = {
  submitted: '#f59e0b',
  under_review: '#6366f1',
  in_progress: '#06b6d4',
  resolved: '#10b981',
  closed: '#64748b',
}

const HomeSkeletonCard = ({ theme, isDark }: any) => {
  const anim = React.useRef(new Animated.Value(0.3)).current

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start()
  }, [])

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
       <View style={[styles.complaintCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)', borderColor: theme.border }]}>
         <Animated.View style={{ opacity: anim }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: theme.border }} />
              <View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: theme.border }} />
           </View>
           <View style={{ width: 80, height: 12, borderRadius: 6, backgroundColor: theme.border, marginBottom: 8 }} />
           <View style={{ width: 100, height: 10, borderRadius: 5, backgroundColor: theme.border }} />
         </Animated.View>
       </View>
    </View>
  )
}

export default function HomeScreen() {
  const { user } = useAuth()
  const { theme, isDark } = useTheme()
  const navigation = useNavigation<any>()
  const { clearBadge } = useBadges()
  const [complaints, setComplaints] = useState<any[]>([])
  const [pulse, setPulse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, in_progress: 0 })
  const fadeAnim = useState(new Animated.Value(0))[0]

  const fetchComplaints = async () => {
    try {
      const [complaintsRes, pulseRes] = await Promise.all([
        complaintsAPI.list(),
        analyticsAPI.getCampusPulse(),
      ])
      
      const data = complaintsRes.data || []
      setComplaints(data.slice(0, 5))
      setPulse(pulseRes.data)
      
      const s = { total: data.length, pending: 0, resolved: 0, in_progress: 0 }
      data.forEach((c: any) => {
         if (c.status === 'resolved') s.resolved++
         else if (c.status === 'in_progress') s.in_progress++
         else s.pending++
      })
      setStats(s)

      Animated.timing(fadeAnim, {
         toValue: 1,
         duration: 600,
         useNativeDriver: true
      }).start()
    } catch (e) {
      console.log('Error fetching complaints', e)
    }
  }

  useFocusEffect(
    useCallback(() => {
      let isActive = true
      clearBadge('home')
      fetchComplaints().finally(() => {
        if (isActive) setLoading(false)
      })
      return () => { isActive = false; fadeAnim.setValue(0); setLoading(true); }
    }, [])
  )

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true)
    await fetchComplaints()
    setRefreshing(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const navigateWithHaptic = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    navigation.navigate(route)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Greeting */}
      <LinearGradient
        colors={[isDark ? '#1e1b4b' : '#e0e7ff', isDark ? theme.background : '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.greetingBox, { borderColor: isDark ? 'rgba(99,102,241,0.15)' : '#c7d2fe' }]}
      >
        <Text style={[styles.greeting, { color: isDark ? '#818cf8' : '#4f46e5' }]}>{getGreeting()} 👋</Text>
        <Text style={[styles.name, { color: theme.text }]}>{user?.full_name || 'Student'}</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>Track your campus complaints in real-time</Text>
      </LinearGradient>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: stats.total, color: theme.primary },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Active', value: stats.in_progress, color: '#06b6d4' },
            { label: 'Resolved', value: stats.resolved, color: '#10b981' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Campus Pulse Section */}
        {pulse && (
          <View style={styles.pulseSection}>
            <View style={styles.pulseHeader}>
               <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Campus Pulse</Text>
                 {pulse.system_reliability_score !== undefined && (
                    <View style={[
                      styles.sriBadge, 
                      pulse.system_reliability_score >= 8.5 ? { backgroundColor: 'rgba(16, 185, 129, 0.1)' } :
                      pulse.system_reliability_score >= 6.0 ? { backgroundColor: 'rgba(245, 158, 11, 0.1)' } :
                      { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                    ]}>
                       <Text style={[
                         styles.sriText,
                         pulse.system_reliability_score >= 8.5 ? { color: '#10b981' } :
                         pulse.system_reliability_score >= 6.0 ? { color: '#f59e0b' } :
                         { color: '#ef4444' }
                       ]}>
                          🛡️ SRI: {pulse.system_reliability_score}/10 — {pulse.system_reliability_label.toUpperCase()}
                       </Text>
                    </View>
                 )}
            </View>
            <View style={styles.pulseRow}>
               <LinearGradient 
                 colors={isDark ? ['#312e81', '#1e1b4b'] : ['#6366f1', '#4f46e5']} 
                 style={styles.pulseCard}
               >
                 <Icon name="zap" size={18} color="#fff" style={{ marginBottom: 6 }} />
                 <View>
                   <Text style={styles.pulseVal}>{pulse.avg_resolution_time_hours}h</Text>
                   <Text style={styles.pulseLabel}>Avg Resolution</Text>
                 </View>
               </LinearGradient>
               <LinearGradient 
                 colors={isDark ? ['#064e3b', '#06201a'] : ['#10b981', '#059669']} 
                 style={styles.pulseCard}
               >
                 <Icon name="award" size={18} color="#fff" style={{ marginBottom: 6 }} />
                 <View>
                   <Text style={styles.pulseVal}>{pulse.resolution_rate}%</Text>
                   <Text style={styles.pulseLabel}>Success Rate</Text>
                 </View>
               </LinearGradient>
            </View>
          </View>
        )}


        {/* Recent Complaints */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Recent Complaints</Text>
        {loading ? (
          <View style={{ marginTop: 10 }}>
            <HomeSkeletonCard theme={theme} isDark={isDark} />
            <HomeSkeletonCard theme={theme} isDark={isDark} />
            <HomeSkeletonCard theme={theme} isDark={isDark} />
          </View>
        ) : complaints.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={48} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Your complaint history is clean!</Text>
            <Text style={[styles.emptyStateSub, { color: theme.border }]}>Pull down to refresh</Text>
          </View>
        ) : (
          complaints.map((c) => (
            <View key={c.id} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.complaintCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)', borderColor: theme.border }]}>
                <View style={styles.complaintHeader}>
                  <Text style={[styles.complaintTitle, { color: theme.text }]}>{c.title}</Text>
                  <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[c.status] }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[c.status] }]}>
                      {c.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.locationRow}>
                   <Icon name="map-pin" size={12} color={theme.textSecondary} />
                   <Text style={[styles.complaintLocation, { color: theme.textSecondary }]}>{c.location}</Text>
                </View>
                <Text style={[styles.complaintDate, { color: theme.textSecondary }]}>{new Date(c.created_at).toLocaleDateString()}</Text>
              </BlurView>
            </View>
          ))
        )}
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  greetingBox: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  greeting: { fontSize: 14, marginBottom: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 13, opacity: 0.8 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 26 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  complaintCard: {
    padding: 16,
    borderWidth: 1,
  },
  complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  complaintTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  statusBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  complaintLocation: { fontSize: 12, fontWeight: '500' },
  complaintDate: { fontSize: 11, opacity: 0.6 },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyStateSub: { fontSize: 12, fontWeight: '600' },
  pulseSection: { marginBottom: 30 },
  pulseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '800', color: '#ef4444' },
  sriBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  sriText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  pulseRow: { flexDirection: 'row', gap: 12 },
  pulseCard: { flex: 1, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6, minHeight: 110, justifyContent: 'space-between' },
  pulseVal: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  pulseLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
})

