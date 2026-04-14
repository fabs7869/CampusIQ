import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Feather'
import * as Haptics from 'expo-haptics'

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme()
  const navigation = useNavigation<any>()

  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleTheme()
  }

  const togglePush = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setPushEnabled(!pushEnabled)
  }

  const toggleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setEmailEnabled(!emailEnabled)
  }

  const handleNotImplemented = (feature: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(feature, 'This feature will be available in the next app update.')
  }

  const SettingRow = ({ icon, title, subtitle, rightElement, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.settingRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface, borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
        <Icon name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingTextContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      <View style={styles.rightContent}>
        {rightElement ? rightElement : (onPress && <Icon name="chevron-right" size={20} color={theme.textSecondary} />)}
      </View>
    </TouchableOpacity>
  )

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: theme.primary }]}>{title}</Text>
  )

  return (
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
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <SectionHeader title="PREFERENCES" />
        <View style={[styles.cardGroup, { borderColor: theme.border }]}>
          <SettingRow 
            icon="moon" title="Dark Mode" subtitle="Switch app theme appearance" 
            rightElement={
              <Switch value={isDark} onValueChange={handleToggleTheme} trackColor={{ false: '#cbd5e1', true: theme.primary }} thumbColor={'#ffffff'} />
            }
          />
          <SettingRow 
            icon="bell" title="Push Notifications" subtitle="Receive alerts on device"
            rightElement={
              <Switch value={pushEnabled} onValueChange={togglePush} trackColor={{ false: '#cbd5e1', true: theme.primary }} thumbColor={'#ffffff'} />
            }
          />
          <SettingRow 
            icon="mail" title="Email Updates" subtitle="Receive weekly digest"
            rightElement={
              <Switch value={emailEnabled} onValueChange={toggleEmail} trackColor={{ false: '#cbd5e1', true: theme.primary }} thumbColor={'#ffffff'} />
            }
          />
        </View>

        <SectionHeader title="ACCOUNT" />
        <View style={[styles.cardGroup, { borderColor: theme.border }]}>
          <SettingRow 
            icon="user" title="Personal Information" subtitle="Update your profile details"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.navigate('EditProfile')
            }}
          />
          <SettingRow 
            icon="shield" title="Security & Password" subtitle="Change or reset password"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.navigate('Security')
            }}
          />
        </View>

        <SectionHeader title="SUPPORT & ABOUT" />
        <View style={[styles.cardGroup, { borderColor: theme.border }]}>
          <SettingRow 
            icon="help-circle" title="Help Center & FAQ"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.navigate('HelpCenter')
            }}
          />
          <SettingRow 
            icon="alert-octagon" title="Report a Problem"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.navigate('ReportAppBug')
            }}
          />
          <SettingRow 
            icon="info" title="App Version" 
            rightElement={<Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>v1.0.0</Text>}
          />
        </View>

        <Text style={{ textAlign: 'center', marginTop: 40, color: theme.textSecondary, fontSize: 12, opacity: 0.6 }}>
          CampusIQ Platform {'\n'}Designed for smart campuses.
        </Text>

      </ScrollView>
    </View>
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
  sectionHeader: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginLeft: 12, marginTop: 12 },
  cardGroup: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingRow: { 
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1,
  },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  settingTextContent: { flex: 1, justifyContent: 'center' },
  settingTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  settingDesc: { fontSize: 12 },
  rightContent: { marginLeft: 10, justifyContent: 'center' }
})
