import React from 'react'
import { StatusBar } from 'expo-status-bar'
import AppNavigator from './src/navigation/AppNavigator'
import { AuthProvider } from './src/context/AuthContext'
import { ThemeProvider } from './src/context/ThemeContext'
import { BadgeProvider } from './src/context/BadgeContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BadgeProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </BadgeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

