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
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const { login } = useAuth();
  const { theme } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true })
    ]).start();
  }, []);

  const handleSignup = async () => {
    if (!name || !email || !password || !studentId) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const resp = await authAPI.register({
        email: email.trim().toLowerCase(),
        password,
        full_name: name,
        role: 'student',
        student_id: studentId,
      });
      await login(resp.data.access_token, resp.data.user);
    } catch (e: any) {
      let errorMsg = 'An error occurred during registration.';
      if (e.response?.data?.detail) {
        errorMsg = Array.isArray(e.response.data.detail) 
          ? e.response.data.detail.map((err: any) => err.msg).join('\n') 
          : e.response.data.detail;
      } else if (e.message) {
        errorMsg = e.message;
      }
      Alert.alert('Signup Failed', errorMsg);
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.content, 
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join CampusIQ to help improve your campus experience.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { borderColor: focusedInput === 'name' ? '#6366f1' : 'rgba(255,255,255,0.08)' }
                  ]}
                  placeholder="John Doe"
                  placeholderTextColor="rgba(148, 163, 184, 0.5)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Student ID</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { borderColor: focusedInput === 'studentId' ? '#6366f1' : 'rgba(255,255,255,0.08)' }
                  ]}
                  placeholder="e.g. 2024CS012"
                  placeholderTextColor="rgba(148, 163, 184, 0.5)"
                  value={studentId}
                  onChangeText={setStudentId}
                  onFocus={() => setFocusedInput('studentId')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Campus Email</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { borderColor: focusedInput === 'email' ? '#6366f1' : 'rgba(255,255,255,0.08)' }
                  ]}
                  placeholder="name@campusiq.edu"
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
                onPress={handleSignup} 
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
                      <Text style={styles.buttonText}>Join CampusIQ</Text>
                      <Icon name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => navigation.goBack()}
                activeOpacity={0.6}
              >
                 <Text style={styles.linkText}>
                   Already have an account? <Text style={styles.linkBold}>Sign In</Text>
                 </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8', lineHeight: 24 },
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
