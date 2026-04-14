import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, Platform, Animated, KeyboardAvoidingView, ActivityIndicator
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { complaintsAPI } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import Icon from 'react-native-vector-icons/Feather'
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'
import { analyticsAPI } from '../services/api'

const CATEGORIES = ['infrastructure', 'electrical', 'plumbing', 'cleanliness', 'security', 'it_services', 'academic', 'canteen', 'other']

export default function SubmitComplaintScreen() {
  const { theme, isDark } = useTheme()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [image, setImage] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [eta, setEta] = useState<any>(null)
  const [loadingEta, setLoadingEta] = useState(false)
  const navigation = useNavigation<any>()
  const fadeAnim = useState(new Animated.Value(0))[0]
  const etaAnim = useState(new Animated.Value(0))[0]

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }).start()
      return () => fadeAnim.setValue(0)
    }, [])
  )

  const handleCategorySelect = async (c: string) => {
    Haptics.selectionAsync()
    setCategory(c)
    
    // Fetch ETA for this category
    setLoadingEta(true)
    try {
      const res = await analyticsAPI.getCategoryPrediction(c)
      setEta(res.data)
      Animated.spring(etaAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start()
    } catch (e) {
      console.log('Error fetching ETA', e)
    } finally {
      setLoadingEta(false)
    }
  }

  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
 
  // 🧠 Real-time AI Intelligence (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Analyze if we have sufficient context (Title or Description)
      if (title.length > 5 || description.length > 10) {
        setIsSuggesting(true)
        try {
          const res = await analyticsAPI.suggestCategory(title, description)
          setSuggestion(res.data?.suggested_category || null)
        } catch (e) {
          console.log('Suggestion error', e)
          setSuggestion(null)
        } finally {
          setIsSuggesting(false)
        }
      } else {
        setSuggestion(null)
      }
    }, 800) // 800ms debounce for 'real-time' feel

    return () => clearTimeout(delayDebounceFn)
  }, [title, description])

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need camera roll permissions.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0])
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need camera permissions.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0])
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const handleSubmit = async () => {
    if (!title || !description || !category || !location || !image) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Missing Fields', 'Please fill all fields and attach an image proof.')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('location', location)
      
      const localUri = Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;
      formData.append('image', {
        uri: localUri,
        type: 'image/jpeg',
        name: localUri.split('/').pop() || 'complaint.jpg',
      } as any)

      await complaintsAPI.submit(formData)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('✅ Complaint Submitted', 'Your complaint has been submitted successfully with image proof.', [
         { text: 'OK', onPress: () => navigation.navigate('Home') }
      ])
      setTitle(''); setDescription(''); setCategory(''); setLocation(''); setImage(null)
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : (e.message || 'Failed to submit complaint');
      Alert.alert('Error Details', errorMsg);
      console.log('SUBMIT ERROR', e.message, e.response?.data);
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>Submit a Complaint</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>Attach photo evidence to ensure your complaint is taken seriously</Text>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}>
          {/* Image Upload */}
          <View style={styles.imageSection}>
            {image ? (
              <View>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                  <Icon name="refresh-cw" size={12} color={theme.primary} />
                  <Text style={[styles.changeBtnText, { color: theme.primary }]}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <LinearGradient
                colors={[theme.primary + '15', theme.primary + '05']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.imagePlaceholder, { borderColor: theme.primary + '40' }]}
              >
                <Icon name="camera" size={48} color={theme.primary} style={{ opacity: 0.8, marginBottom: 16 }} />
                <Text style={[styles.imageHint, { color: theme.textSecondary }]}>Image proof is required</Text>
                <View style={styles.imageButtons}>
                  <TouchableOpacity style={[styles.imgBtn, { backgroundColor: theme.primary }]} onPress={takePhoto}>
                    <Icon name="aperture" size={14} color="#fff" />
                    <Text style={styles.imgBtnText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.imgBtn, styles.imgBtnOutline, { borderColor: theme.primary + '60' }]} onPress={pickImage}>
                    <Icon name="image" size={14} color={theme.primary} />
                    <Text style={[styles.imgBtnTextOutline, { color: theme.primary }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Issue Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Brief title of the issue"
              placeholderTextColor={theme.textSecondary + '80'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={theme.textSecondary + '80'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {suggestion && category !== suggestion && (
              <TouchableOpacity 
                style={[styles.suggestionChip, { backgroundColor: theme.primary + '15' }]} 
                onPress={() => handleCategorySelect(suggestion)}
              >
                <MIcon name="robot" size={16} color={theme.primary} />
                <Text style={[styles.suggestionText, { color: theme.primary }]}>
                   AI SUGGESTION: <Text style={{ fontWeight: '800' }}>{suggestion.replace('_', ' ').toUpperCase()}</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.categoryChip, 
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface, borderColor: theme.border },
                    category === c && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => handleCategorySelect(c)}
                >
                  <Text style={[
                    styles.categoryChipText, 
                    { color: theme.textSecondary },
                    category === c && { color: '#fff', fontWeight: '800' }
                  ]}>
                    {c.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Predictive ETA Feedback */}
            {category ? (
              <Animated.View style={[
                styles.etaCard, 
                { 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border,
                  opacity: etaAnim,
                  transform: [{ translateY: etaAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }]
                }
              ]}>
                {loadingEta ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <View style={styles.etaIconBox}>
                      <Icon name="clock" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.etaTitle, { color: theme.text }]}>Efficiency Insight</Text>
                      <Text style={[styles.etaText, { color: theme.textSecondary }]}>
                        Typically resolved in <Text style={{ color: theme.primary, fontWeight: '700' }}>{eta?.avg_hours || '4'} hours</Text>
                      </Text>
                    </View>
                    <View style={styles.etaBadge}>
                      <Text style={styles.etaBadgeText}>{eta?.total_resolved || '0'} Solved</Text>
                    </View>
                  </>
                )}
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Block A, Room 203"
              placeholderTextColor={theme.textSecondary + '80'}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <TouchableOpacity
            style={[loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={[theme.primary, theme.primary + '90']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
               {loading ? (
                 <ActivityIndicator color="#fff" />
               ) : (
                 <>
                   <Text style={styles.submitBtnText}>Submit Complaint</Text>
                   <Icon name="send" size={18} color="#fff" />
                 </>
               )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { fontSize: 13, marginBottom: 28 },
  imageSection: { marginBottom: 26 },
  imagePlaceholder: {
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageHint: { fontSize: 13, marginBottom: 18, fontWeight: '600' },
  imageButtons: { flexDirection: 'row', gap: 12 },
  imgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  imgBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  imgBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  imgBtnTextOutline: { fontSize: 13, fontWeight: '700' },
  previewImage: { width: '100%', height: 240, borderRadius: 20, resizeMode: 'cover' },
  changeBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  changeBtnText: { fontSize: 13, fontWeight: '700' },
  field: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
  },
  textarea: { minHeight: 120, paddingTop: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  etaCard: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  etaIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  etaTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  etaText: { fontSize: 11, fontWeight: '500' },
  etaBadge: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  etaBadgeText: { fontSize: 9, fontWeight: '800', color: '#10b981', textTransform: 'uppercase' },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  suggestionText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
})
