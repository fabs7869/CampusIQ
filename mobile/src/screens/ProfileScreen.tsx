import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Icon from 'react-native-vector-icons/Feather'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { analyticsAPI } from '../services/api'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const navigation = useNavigation<any>()
  const [impact, setImpact] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const slideAnim = useRef(new Animated.Value(50)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useFocusEffect(
    React.useCallback(() => {
      fetchImpact()
    }, [])
  )

  const fetchImpact = async () => {
    try {
      const res = await analyticsAPI.getUserImpact()
      setImpact(res.data)
    } catch (e) {
      console.log('Error fetching impact', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
    ]).start()
  }, [])

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* Profile Card */}
        <LinearGradient
          colors={[theme.primary, theme.primary + '80']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase() || 'S'}</Text>
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {/* My Impact Section */}
        {impact && (
          <View style={styles.impactContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Global Impact</Text>
            <View style={[styles.impactCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.impactHeader}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreVal}>{impact.impact_score}</Text>
                  <Text style={styles.scoreLabel}>Impact</Text>
                </View>
                <View style={styles.impactTitleBox}>
                   <Text style={[styles.impactBadge, { color: theme.primary }]}>{impact.impact_label}</Text>
                   <Text style={[styles.impactTagline, { color: theme.textSecondary }]}>
                      Your reports have impacted <Text style={{ color: theme.text, fontWeight: '700' }}>{impact.total_upvotes * 10}</Text> students.
                   </Text>
                </View>
              </View>
              
              <View style={styles.impactDivider} />
              
              <View style={styles.impactGrid}>
                <View style={styles.impactGridItem}>
                  <Icon name="file-text" size={18} color="#6366f1" />
                  <Text style={[styles.gridVal, { color: theme.text }]}>{impact.total_reported}</Text>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>Reported Cases</Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.impactGridItem}>
                  <Icon name="thumbs-up" size={18} color="#f59e0b" />
                  <Text style={[styles.gridVal, { color: theme.text }]}>{impact.total_upvotes}</Text>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>Peer Upvotes</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action List */}
        <View style={styles.actionList}>
          <TouchableOpacity 
             style={[styles.actionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
             onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Icon name="user" size={22} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.text }]}>Edit Profile</Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
             style={[styles.actionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
             onPress={() => navigation.navigate('Settings')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Icon name="settings" size={22} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.text }]}>App Settings</Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
             style={[styles.actionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
             onPress={logout}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Icon name="log-out" size={22} color={theme.error} />
              <Text style={[styles.actionText, { color: theme.error }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  profileCard: {
    alignItems: 'center',
    padding: 35,
    borderRadius: 28,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarBox: { 
    width: 90, height: 90, borderRadius: 45, 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)'
  },
  avatarText: { fontSize: 40, color: '#fff', fontWeight: '900' },
  name: { fontSize: 26, fontWeight: '800', marginBottom: 4, color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  roleBadge: { 
    paddingHorizontal: 14, paddingVertical: 6, 
    borderRadius: 16, marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  roleText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  actionList: { gap: 16 },
  actionItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 20, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionText: { fontSize: 17, fontWeight: '700' },
  impactContainer: { marginBottom: 30 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  impactCard: { borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  impactHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  scoreCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  scoreVal: { color: '#fff', fontSize: 24, fontWeight: '900' },
  scoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  impactTitleBox: { flex: 1, marginLeft: 20 },
  impactBadge: { fontSize: 14, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  impactTagline: { fontSize: 12, lineHeight: 18 },
  impactDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 20 },
  impactGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  impactGridItem: { alignItems: 'center', flex: 1 },
  dividerVertical: { width: 1, height: 40, backgroundColor: 'rgba(0,0,0,0.05)' },
  gridVal: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 2 },
  gridLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
})
