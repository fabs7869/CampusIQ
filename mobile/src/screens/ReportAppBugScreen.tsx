import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Feather'
import * as Haptics from 'expo-haptics'
import { supportAPI } from '../services/api'

export default function ReportAppBugScreen() {
  const { theme, isDark } = useTheme()
  const navigation = useNavigation()
  const [bugDesc, setBugDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!bugDesc.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Missing Detail', 'Please enter a description of the issue you are facing.')
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSubmitting(true)
    
    supportAPI.reportBug({
      description: bugDesc,
      device_info: `${Platform.OS} ${Platform.Version}`,
      app_version: 'v1.0.0'
    })
    .then(() => {
      setSubmitting(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Bug Reported!', 'Thank you for helping us improve CampusIQ.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    })
    .catch((err) => {
      setSubmitting(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Submission Failed', err.response?.data?.detail || 'An unexpected error occurred while sending the report.')
    })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.goBack()
            }} 
            style={styles.backBtn}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
               <Icon name="arrow-left" size={18} color={theme.text} />
               <Text style={[styles.backText, { color: theme.text }]}>Back</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Report App Bug</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Icon name="alert-octagon" size={40} color="#ef4444" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 16 }}>Technical Issue</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
              Use this form solely to report crashes, UI bugs, or feature improvements for the CampusIQ mobile application.
            </Text>
          </View>

          <View style={[styles.systemInfoBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface, borderColor: theme.border }]}>
             <Icon name="smartphone" size={18} color={theme.textSecondary} />
             <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 8 }}>OS: {Platform.OS} | App Version: v1.0.0</Text>
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Describe the problem</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.inputArea, { color: theme.text }]}
              placeholder="E.g. The app crashed when I tried to open the camera..."
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlignVertical="top"
              value={bugDesc}
              onChangeText={setBugDesc}
            />
          </View>

          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: '#ef4444', opacity: submitting ? 0.7 : 1 }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.btnText}>{submitting ? 'Submitting...' : 'Submit Bug Report'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60,
    borderBottomWidth: 1,
  },
  backBtn: { position: 'absolute', left: 20, top: 60, zIndex: 10 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 60 },
  iconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  systemInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    opacity: 0.8
  },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputArea: {
    height: 120,
    fontSize: 15,
  },
  btn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
})
