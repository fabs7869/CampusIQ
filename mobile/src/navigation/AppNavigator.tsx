import React, { useState } from 'react'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, TouchableOpacity } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Icon from 'react-native-vector-icons/Feather'
import { useBadges } from '../context/BadgeContext'
import HomeScreen from '../screens/HomeScreen'
import SubmitComplaintScreen from '../screens/SubmitComplaintScreen'
import FeedScreen from '../screens/FeedScreen'
import NotificationScreen from '../screens/NotificationScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SettingsScreen from '../screens/SettingsScreen'
import SecurityScreen from '../screens/SecurityScreen'
import HelpCenterScreen from '../screens/HelpCenterScreen'
import ReportAppBugScreen from '../screens/ReportAppBugScreen'
import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import SplashScreen from '../screens/SplashScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const TAB_ICONS: Record<string, string> = {
  Home: 'home',
  Submit: 'plus-square',
  Feed: 'activity',
  Notifications: 'bell',
}

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const { badges } = useBadges()
  const badgeCount = name === 'Home' ? badges.home : 
                    name === 'Feed' ? badges.feed : 
                    name === 'Notifications' ? badges.notifications : 0

  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Icon name={TAB_ICONS[name]} size={22} color={color} style={{ opacity: focused ? 1 : 0.7 }} />
      {badgeCount > 0 && (
        <View style={{
          position: 'absolute',
          right: -4,
          top: 2,
          backgroundColor: '#ff4444',
          borderRadius: 6,
          width: 10,
          height: 10,
          borderWidth: 1.5,
          borderColor: '#fff'
        }} />
      )}
    </View>
  )
}

function HeaderProfileIcon() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ paddingRight: 16 }}>
      <Icon name="user" size={24} color={theme.text} />
    </TouchableOpacity>
  );
}

function MainTabs() {
  const { theme, isDark } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} />,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: isDark ? '#0f0f23' : theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        headerStyle: { backgroundColor: theme.background, borderBottomColor: theme.border },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerRight: () => <HeaderProfileIcon />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Submit" component={SubmitComplaintScreen} options={{ title: 'Report Issue' }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Resolution Feed' }} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ 
                headerShown: true, 
                title: 'My Profile',
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text
              }} 
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
            <Stack.Screen name="ReportAppBug" component={ReportAppBugScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
