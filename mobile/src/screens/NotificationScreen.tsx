import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { notificationsAPI } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { useBadges } from '../context/BadgeContext'
import { Ionicons } from '@expo/vector-icons'

interface AppNotification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export default function NotificationScreen() {
  const { theme } = useTheme()
  const { refreshBadges } = useBadges()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const fadeAnim = useState(new Animated.Value(0))[0]

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
      refreshBadges()
    }, [])
  )

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list()
      setNotifications(res.data)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    } catch (e) {
      console.log('Error fetching notifications', e)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      fetchNotifications()
    } catch (e) {
      console.log(e)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.log(e)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleClearAll = () => {
    Alert.alert(
      "Clear All",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              await notificationsAPI.clearAll()
              setNotifications([])
              setSelectMode(false)
              setSelectedIds([])
            } catch (e) {
              Alert.alert("Error", "Could not clear notifications")
            }
          }
        }
      ]
    )
  }

  const handleClearSelected = async () => {
    if (selectedIds.length === 0) return

    try {
      await notificationsAPI.clearSelected(selectedIds)
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)))
      setSelectedIds([])
      setSelectMode(false)
    } catch (e) {
      Alert.alert("Error", "Could not clear selected notifications")
    }
  }

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectedIds([])
    }
    setSelectMode(!selectMode)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.flex1}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.heading, { color: theme.text }]}>Notifications</Text>
            <Text style={[styles.sub, { color: theme.textSecondary }]}>
              {selectMode ? `${selectedIds.length} selected` : 'Stay updated on your complaints'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!selectMode ? (
              <>
                <TouchableOpacity onPress={markAllRead} style={styles.headerBtn}>
                  <Text style={[styles.actionText, { color: theme.primary }]}>Read All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleSelectMode} style={styles.headerBtn}>
                  <Text style={[styles.actionText, { color: theme.primary }]}>Select</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={toggleSelectMode} style={styles.headerBtn}>
                <Text style={[styles.actionText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {notifications.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
               <Text style={[styles.empty, { color: theme.textSecondary }]}>No new notifications.</Text>
             </View>
          ) : (
            notifications.map((n) => (
              <TouchableOpacity 
                 key={n.id} 
                 style={[
                   styles.card, 
                   { 
                     backgroundColor: theme.surface, 
                     borderColor: selectMode && selectedIds.includes(n.id) ? theme.primary : theme.border,
                     opacity: !selectMode && n.is_read ? 0.6 : 1 
                   }
                 ]}
                 onPress={() => selectMode ? toggleSelect(n.id) : (!n.is_read && markAsRead(n.id))}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrapper}>
                    {selectMode && (
                      <Ionicons 
                        name={selectedIds.includes(n.id) ? "checkbox" : "square-outline"} 
                        size={20} 
                        color={selectedIds.includes(n.id) ? theme.primary : theme.textSecondary}
                        style={{ marginRight: 10 }}
                      />
                    )}
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                      {!n.is_read && !selectMode && '🔵 '} {n.title}
                    </Text>
                  </View>
                  <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.cardMessage, { color: theme.textSecondary, marginLeft: selectMode ? 30 : 0 }]}>
                  {n.message}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {selectMode && (
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.footerBtn, { backgroundColor: theme.background }]} 
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
            <Text style={[styles.footerBtnText, { color: "#ff4444" }]}>Clear All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerBtn, { backgroundColor: theme.primary, opacity: selectedIds.length === 0 ? 0.5 : 1 }]} 
            onPress={handleClearSelected}
            disabled={selectedIds.length === 0}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={[styles.footerBtnText, { color: "#fff" }]}>Clear Selected</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerActions: { flexDirection: 'row' },
  headerBtn: { marginLeft: 16 },
  heading: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  actionText: { fontSize: 14, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { textAlign: 'center', marginTop: 16, fontSize: 15, fontWeight: '500' },
  card: { padding: 16, borderRadius: 20, borderWidth: 1.5, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  cardDate: { fontSize: 11, fontWeight: '600' },
  cardMessage: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 16, 
    paddingBottom: 32,
    flexDirection: 'row', 
    justifyContent: 'space-between',
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  footerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 14,
    flex: 0.48
  },
  footerBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '700' }
})
