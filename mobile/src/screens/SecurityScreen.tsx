import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Feather'
import * as Haptics from 'expo-haptics'
import { authAPI } from '../services/api'

export default function SecurityScreen() {
  const { theme, isDark } = useTheme()
  const navigation = useNavigation()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUpdate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.')
      return
    }

    setLoading(true)
    authAPI.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    })
    .then(() => {
      setLoading(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Success', 'Password has been updated securely.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    })
    .catch((err) => {
      setLoading(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Update Failed', err.response?.data?.detail || 'An unexpected error occurred while updating your password.')
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
          <Text style={[styles.title, { color: theme.text }]}>Security</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 10 }}>
            <View style={[styles.iconShield, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#e0e7ff' }]}>
              <Icon name="shield" size={40} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 16 }}>Update Password</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
              Ensure your account is using a long, random password to stay secure.
            </Text>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Current Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="New Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirm New Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, paddingLeft: 4 }} onPress={() => setShowPassword(!showPassword)}>
             <Icon name={showPassword ? "eye" : "eye-off"} size={16} color={theme.textSecondary} />
             <Text style={{ color: theme.textSecondary, marginLeft: 8, fontSize: 13 }}>Show Passwords</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]} 
            onPress={handleUpdate}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Updating...' : 'Update Password'}</Text>
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
  iconShield: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  input: {
    height: 50,
    fontSize: 15,
  },
  btn: {
    marginTop: 20,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
})
