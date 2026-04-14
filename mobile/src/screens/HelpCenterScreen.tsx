import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Feather'
import * as Haptics from 'expo-haptics'

const FAQS = [
  {
    q: 'How do I track my complaint status?',
    a: 'You can track the live status of your complaint on the Home Screen under "My Recent Complaints". The status will automatically update when a staff member responds.'
  },
  {
    q: 'What is the Resolution Feed used for?',
    a: 'The Resolution Feed is a public timeline showing issues that have been successfully fixed on campus. It exists to maintain transparency and show the active work being done by campus staff.'
  },
  {
    q: 'How does the upvote system work?',
    a: 'You can upvote resolved complaints in the Feed to acknowledge a job well done. Complaints with more upvotes highlight highly-appreciated campus improvements.'
  },
  {
    q: 'Can I edit a complaint after submitting?',
    a: 'Currently, submitted complaints cannot be edited to ensure transparency. However, you can withdraw a complaint by contacting the administrative office.'
  },
  {
    q: 'Are before/after photos mandatory?',
    a: 'We highly recommend "Before" photos when submitting an issue. Campus staff are required to upload an "After" photo once the issue is marked as Resolved as visual proof of the fix.'
  }
]

export default function HelpCenterScreen() {
  const { theme, isDark } = useTheme()
  const navigation = useNavigation()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setExpandedIndex(expandedIndex === index ? null : index)
  }

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
        <Text style={[styles.title, { color: theme.text }]}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center', marginBottom: 20, paddingTop: 10 }}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#d1fae5' }]}>
            <Icon name="help-circle" size={40} color="#10b981" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 16 }}>Frequently Asked Questions</Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
            Find quick answers to your questions about using the CampusIQ platform.
          </Text>
        </View>

        {FAQS.map((faq, index) => (
          <View key={index} style={[styles.faqCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={styles.faqHeader} 
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.question, { color: theme.text }]} numberOfLines={expandedIndex === index ? undefined : 1}>
                {faq.q}
              </Text>
              <Icon 
                name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
            {expandedIndex === index && (
              <View style={[styles.answerBox, { borderTopColor: theme.border }]}>
                <Text style={[styles.answer, { color: theme.textSecondary }]}>{faq.a}</Text>
              </View>
            )}
          </View>
        ))}

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
  content: { padding: 16, paddingBottom: 60 },
  iconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  question: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  answerBox: {
    padding: 16,
    paddingTop: 0,
  },
  answer: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  }
})
