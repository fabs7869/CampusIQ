import React, { useEffect, useState, useCallback } from 'react'
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, 
  Dimensions, Animated, Image, Modal, SafeAreaView 
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Feather'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { feedAPI, complaintsAPI, BASE_URL } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { useBadges } from '../context/BadgeContext'

interface FeedItem {
  id: string
  title: string
  description: string
  location: string
  category: string
  department_name: string
  before_image_url: string
  after_image_url: string
  resolution_message: string
  resolved_at: string
  student_name: string
  upvote_count: number
  has_upvoted: boolean
}

const { width } = Dimensions.get('window')

const CATEGORY_EMOJI: Record<string, string> = {
  infrastructure: '🏗️', electrical: '⚡', plumbing: '🚿',
  cleanliness: '🧹', security: '🔒', it_services: '💻',
  academic: '📚', canteen: '🍽️', other: '📌',
}

const ALL_CATEGORIES = ['All', 'infrastructure', 'electrical', 'plumbing', 'cleanliness', 'security', 'it_services', 'academic', 'canteen', 'other']

const SkeletonCard = ({ theme }: any) => {
  const anim = React.useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start()
  }, [])

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Animated.View style={{ opacity: anim }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
           <View style={{ width: 80, height: 24, borderRadius: 12, backgroundColor: theme.border }} />
           <View style={{ width: 100, height: 16, borderRadius: 8, backgroundColor: theme.border, marginTop: 4 }} />
        </View>
        <View style={{ width: '80%', height: 20, borderRadius: 6, backgroundColor: theme.border, marginBottom: 8 }} />
        <View style={{ width: '100%', height: 14, borderRadius: 6, backgroundColor: theme.border, marginBottom: 4 }} />
        <View style={{ width: '60%', height: 14, borderRadius: 6, backgroundColor: theme.border, marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
           <View style={{ flex: 1, height: 90, borderRadius: 12, backgroundColor: theme.border }} />
           <View style={{ flex: 1, height: 90, borderRadius: 12, backgroundColor: theme.border }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
           <View style={{ width: 120, height: 14, borderRadius: 6, backgroundColor: theme.border }} />
           <View style={{ width: 60, height: 30, borderRadius: 12, backgroundColor: theme.border }} />
        </View>
      </Animated.View>
    </View>
  )
}

const AnimatedLikeButton = ({ hasUpvoted, count, onPress, theme }: any) => {
  const scale = React.useRef(new Animated.Value(1)).current

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start()
  }

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.likeBtn, 
        { 
          backgroundColor: hasUpvoted ? 'rgba(59, 130, 246, 0.1)' : theme.border + '15',
          borderColor: hasUpvoted ? 'rgba(59, 130, 246, 0.2)' : theme.border
        }
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon name="thumbs-up" size={16} color={hasUpvoted ? '#3b82f6' : theme.textSecondary} />
      </Animated.View>
      <Text style={[
          styles.upvoteCount, 
          { color: hasUpvoted ? '#3b82f6' : theme.textSecondary }
        ]}
      >
        {count}
      </Text>
    </TouchableOpacity>
  )
}

export default function FeedScreen() {
  const { theme, isDark } = useTheme()
  const { clearBadge } = useBadges()
  const [items, setItems] = useState<FeedItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [viewerImage, setViewerImage] = useState<string | null>(null)
  const fadeAnim = useState(new Animated.Value(0))[0]

  const fetchFeed = async () => {
    try {
      const res = await feedAPI.getResolutionFeed()
      if (res?.data) {
        setItems(res.data)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start()
    }
  }

  useFocusEffect(
    useCallback(() => {
      clearBadge('feed')
      fetchFeed()
      return () => { fadeAnim.setValue(0); setLoading(true); }
    }, [])
  )

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true)
    await fetchFeed()
    setRefreshing(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleUpvote = async (id: string) => {
    try {
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const newHasUpvoted = !item.has_upvoted
          return {
            ...item,
            has_upvoted: newHasUpvoted,
            upvote_count: newHasUpvoted ? item.upvote_count + 1 : item.upvote_count - 1
          }
        }
        return item
      }))
      await complaintsAPI.upvote(id)
    } catch (e) {
      console.log('Upvote error', e)
      fetchFeed()
    }
  }

  const filteredItems = filter === 'All' ? items : items.filter(i => i.category === filter)

  const openImage = (url: string) => {
    if (!url) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setViewerImage(url.startsWith('http') ? url : `${BASE_URL}${url}`)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Filter Bar */}
      <View style={{ paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {ALL_CATEGORIES.map(c => {
            const isActive = filter === c
            return (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  Haptics.selectionAsync()
                  setFilter(c)
                }}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? theme.primary : isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: theme.border },
                  isActive && { borderColor: theme.primary }
                ]}
              >
                <Text style={[styles.filterChipText, { color: isActive ? '#fff' : theme.textSecondary }]}>
                  {c === 'All' ? 'All' : c.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={styles.header}>
          <Text style={[styles.heading, { color: theme.text }]}>Resolution Feed</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Live feed of resolved campus issues</Text>
        </View>

        {loading ? (
           <>
             <SkeletonCard theme={theme} />
             <SkeletonCard theme={theme} />
             <SkeletonCard theme={theme} />
           </>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {filteredItems.length === 0 ? (
               <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.6 }}>
                  <Icon name="layout" size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                  <Text style={{ textAlign: 'center', color: theme.textSecondary, fontSize: 16, fontWeight: '600' }}>No resolutions found</Text>
                  <Text style={{ textAlign: 'center', color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>Try a different category filter</Text>
               </View>
            ) : (
              filteredItems.map((item) => (
                <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '15' }]}>
                      <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[item.category] || '📌'}</Text>
                      <Text style={[styles.categoryText, { color: theme.primary }]}>{item.category.replace('_', ' ')}</Text>
                    </View>
                    <Text style={{ color: '#06b6d4', fontSize: 11, fontWeight: '600' }}>{item.department_name}</Text>
                  </View>

                  <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>

                  {/* Before / After Images */}
                  <View style={styles.imageRow}>
                    <TouchableOpacity style={styles.imageBox} onPress={() => openImage(item.before_image_url)} activeOpacity={0.8}>
                      {item.before_image_url ? (
                        <Image 
                          source={{ uri: item.before_image_url.startsWith('http') ? item.before_image_url : `${BASE_URL}${item.before_image_url}` }} 
                          style={styles.resolvedImage} 
                          resizeMode="cover" 
                        />
                      ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                          <Text style={{ fontSize: 28 }}>📸</Text>
                          <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600', marginTop: 2 }}>Before</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.arrowBox}>
                      <Icon name="arrow-right" size={16} color={theme.textSecondary} />
                    </View>
                    <TouchableOpacity style={styles.imageBox} onPress={() => openImage(item.after_image_url)} activeOpacity={0.8}>
                      {item.after_image_url ? (
                        <Image 
                          source={{ uri: item.after_image_url.startsWith('http') ? item.after_image_url : `${BASE_URL}${item.after_image_url}` }} 
                          style={styles.resolvedImage} 
                          resizeMode="cover" 
                        />
                      ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                          <Text style={{ fontSize: 28 }}>✅</Text>
                          <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '600', marginTop: 2 }}>After</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Resolution message */}
                  {item.resolution_message && (
                    <View style={[styles.resolutionBox, { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                      <Text style={{ color: '#10b981', fontSize: 12, lineHeight: 17 }}>💬 {item.resolution_message}</Text>
                    </View>
                  )}

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <Text style={[styles.footerText, { color: theme.textSecondary }]}>📍 {item.location}</Text>
                      <Text style={[styles.footerText, { color: theme.textSecondary, marginLeft: 12 }]}>👤 {item.student_name}</Text>
                    </View>

                    <AnimatedLikeButton 
                       hasUpvoted={item.has_upvoted} 
                       count={item.upvote_count} 
                       onPress={() => handleUpvote(item.id)} 
                       theme={theme}
                    />
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={!!viewerImage} transparent animationType="fade">
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setViewerImage(null)}
            >
              <Icon name="x" size={24} color="#fff" />
            </TouchableOpacity>
            {viewerImage && (
              <Image 
                source={{ uri: viewerImage }} 
                style={styles.fullImage} 
                resizeMode="contain" 
              />
            )}
          </SafeAreaView>
        </BlurView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  heading: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  categoryEmoji: { fontSize: 12 },
  categoryText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  imageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  imageBox: { flex: 1 },
  imagePlaceholder: { width: '100%', height: 90, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  resolvedImage: { width: '100%', height: 90, borderRadius: 12, backgroundColor: '#eee' },
  arrowBox: { width: 32, alignItems: 'center' },
  resolutionBox: { borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { flexDirection: 'row' },
  footerText: { fontSize: 11 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  upvoteCount: { fontSize: 13, fontWeight: '700' },
  closeModalBtn: { position: 'absolute', top: 60, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  fullImage: { width: '100%', height: '100%', marginTop: 40 }
})

