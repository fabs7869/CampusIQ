import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  Animated, 
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const { login } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 10, friction: 5, useNativeDriver: true })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password.');
      return;
    }
    setLoading(true);
    try {
      const resp = await authAPI.login(email.trim().toLowerCase(), password);
      if (resp.data.user.role !== 'student') {
         Alert.alert('Access Denied', 'Faculty and Admin users should login via the Web Portal.');
         return;
      }
      await login(resp.data.access_token, resp.data.user);
    } catch (e: any) {
      let errorMsg = 'Invalid credentials';
      if (e.response?.data?.detail) {
        errorMsg = Array.isArray(e.response.data.detail) 
          ? e.response.data.detail.map((err: any) => err.msg).join('\n') 
          : e.response.data.detail;
      } else if (e.message) {
        errorMsg = e.message;
      }
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0a0a1a' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.content, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Logo Section */}
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>CampusIQ</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>STUDENT PORTAL</Text>
            </View>
          </Animated.View>

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Campus Email</Text>
              <TextInput
                style={[
                  styles.input, 
                  { borderColor: focusedInput === 'email' ? '#6366f1' : 'rgba(255,255,255,0.08)' }
                ]}
                placeholder="yours@campusiq.edu"
                placeholderTextColor="rgba(148, 163, 184, 0.5)"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input, styles.passwordInput,
                    { borderColor: focusedInput === 'password' ? '#6366f1' : 'rgba(255,255,255,0.08)' }
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(148, 163, 184, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.buttonContainer, loading && styles.buttonDisabled]} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Icon name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.6}
            >
               <Text style={styles.linkText}>
                 New to CampusIQ? <Text style={styles.linkBold}>Create Account</Text>
               </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  title: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: { color: '#818cf8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  form: { width: '100%', gap: 20 },
  inputWrapper: { gap: 8 },
  inputLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    color: '#fff',
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  buttonIcon: { marginLeft: 8 },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#64748b', fontSize: 15 },
  linkBold: { color: '#818cf8', fontWeight: '800' }
});

