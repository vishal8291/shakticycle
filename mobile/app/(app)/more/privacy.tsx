import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppScreen, SectionCard } from '../../../src/components/MobileUI'
import { colors, typography } from '../../../src/theme/colors'

const sections = [
  {
    title: '1. Information We Collect',
    body: `We collect the following categories of information to provide and improve the Service:

a) Personal Information:
   - Full name
   - Email address
   - Phone/mobile number
   - Date of birth and gender (if provided)

b) Health Information:
   - Medical reports and health records (uploaded or manually entered)
   - Vitals data (blood pressure, blood glucose, weight, pulse, SpO2, temperature)
   - Medication details, dosages, and adherence records
   - Appointment and consultation records
   - Emergency contacts, insurance details, and allergy information
   - Daily tracking data (water intake, sleep, exercise, mood)
   - AI chat conversations related to health queries

c) Technical Information:
   - Device type, operating system, and version
   - Expo push notification tokens
   - App version and usage analytics
   - Authentication tokens and session data

d) ABDM Data:
   - ABHA (Ayushman Bharat Health Account) address and linked health records, collected only with your explicit consent`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect for the following purposes:

a) Service Delivery: To provide core functionality including health record storage, vitals tracking, medication management, appointment scheduling, and emergency card generation.

b) AI Analysis: To power AI-generated health insights, health scores, report summaries, and personalized recommendations. AI analysis is performed on the data you provide to deliver relevant and useful health information.

c) Notifications: To send push notifications for medication reminders, appointment alerts, health tips, and important account updates.

d) Service Improvement: To analyze usage patterns, identify bugs, improve features, and enhance the overall user experience. We may use aggregated and anonymized data for this purpose.

e) Communication: To respond to your inquiries, provide customer support, and send important service-related announcements.

f) Security: To protect against unauthorized access, maintain data integrity, and ensure the security of the Service.`,
  },
  {
    title: '3. Data Storage and Security',
    body: `a) Cloud Storage: Your data is stored on MongoDB Atlas, a cloud database service with enterprise-grade security features, hosted on secure infrastructure.

b) Encryption in Transit: All data transmitted between the application and our servers is encrypted using TLS (Transport Layer Security) protocols, ensuring that your information is protected during transmission.

c) Authentication: Access to your data is protected through secure token-based authentication (JSON Web Tokens). Passwords are hashed using industry-standard bcrypt hashing before storage and are never stored in plain text.

d) Access Controls: We implement strict access controls to limit who can access your data. Only authorized systems and processes can access your personal and health information for the purpose of providing the Service.

e) While we employ commercially reasonable security measures, no method of electronic transmission or storage is 100% secure. We cannot guarantee the absolute security of your data.`,
  },
  {
    title: '4. Third-Party Services',
    body: `We use the following third-party services in connection with the Service:

a) Razorpay: We use Razorpay for processing subscription payments. When you make a payment, your payment information is handled directly by Razorpay in accordance with their privacy policy (https://razorpay.com/privacy/). We do not store your complete credit/debit card details on our servers.

b) Expo: We use Expo's push notification service to deliver notifications to your device. Your Expo push token is stored to facilitate this service.

c) Google Sign-In: If you choose to sign in with Google, we receive your basic profile information (name, email, profile picture) from Google. This is governed by Google's privacy policy.

d) We do NOT sell your personal or health data to any third party. We do not share your data with advertisers or data brokers.

e) We may disclose your information if required by law, regulation, legal process, or governmental request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.`,
  },
  {
    title: '5. ABDM Integration',
    body: `a) HealthMap AI supports integration with India's Ayushman Bharat Digital Mission (ABDM) to enable you to link and access your national health records.

b) ABDM integration is entirely optional and is activated only with your explicit consent. You must initiate the linking process and authorize data sharing.

c) Health records imported through ABDM are handled in strict accordance with ABDM protocols, guidelines, and applicable regulations.

d) You may unlink your ABDM account and remove imported records at any time through the application.

e) We do not share your ABDM-linked data with any third party without your explicit consent, except as required by ABDM protocols or applicable law.`,
  },
  {
    title: '6. Data Retention',
    body: `a) We retain your personal and health data for as long as your account remains active and as needed to provide you with the Service.

b) Upon account deletion or account reset, all associated personal data, health records, and related information are permanently deleted from our systems.

c) You may request deletion of specific records or your entire account at any time through the application.

d) We may retain anonymized, aggregated data that cannot be used to identify you for analytical and service improvement purposes, even after account deletion.

e) Certain information may be retained as required by applicable law or for legitimate business purposes such as fraud prevention.`,
  },
  {
    title: '7. Your Rights',
    body: `You have the following rights regarding your personal data:

a) Right to Access: You may access all personal and health data stored in your account through the application at any time.

b) Right to Export: You may export your health records and data in standard formats (PDF, JSON) through the Export & Share feature in the application.

c) Right to Deletion: You may delete individual records or your entire account at any time. Account deletion results in permanent removal of all associated data.

d) Right to Correction: You may update or correct your personal information and health records at any time through the application.

e) Right to Withdraw Consent: You may withdraw consent for optional data processing (such as ABDM integration or push notifications) at any time without affecting the core functionality of the Service.

f) To exercise any of these rights, you may use the relevant features within the application or contact us directly.`,
  },
  {
    title: '8. Cookies and Local Storage',
    body: `a) HealthMap AI uses minimal local storage on your device, primarily for authentication tokens and user session management.

b) We do not use third-party tracking cookies or advertising cookies.

c) Local data stored on your device is used solely to maintain your authenticated session and improve app performance (such as caching preferences).`,
  },
  {
    title: '9. Children\'s Privacy',
    body: `a) HealthMap AI is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18.

b) If we become aware that we have collected personal information from a child under 18 without parental consent, we will take steps to delete that information as promptly as possible.

c) If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately so we can take appropriate action.`,
  },
  {
    title: '10. Changes to This Privacy Policy',
    body: `a) We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.

b) We will notify you of material changes through in-app notifications or email before the changes take effect.

c) Your continued use of the Service after the effective date of the revised Privacy Policy constitutes your acceptance of the changes.

d) We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your data.`,
  },
  {
    title: '11. Contact Information',
    body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Developer: Vishal Tiwari
Phone: +91 8291569470
GitHub: github.com/vishal8291

We are committed to resolving any concerns you may have about your privacy and will respond to your inquiries within a reasonable timeframe.`,
  },
]

export default function PrivacyScreen() {
  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionCard title="Privacy Policy">
          <Text style={styles.effective}>Effective Date: April 2026</Text>
          <Text style={styles.intro}>
            This Privacy Policy describes how HealthMap AI ("we", "us", or "our"), developed by Vishal Tiwari, collects, uses, stores, and protects your personal information when you use the HealthMap AI mobile application and related services (the "Service"). By using the Service, you consent to the data practices described in this policy.
          </Text>
        </SectionCard>

        {sections.map((section) => (
          <SectionCard key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </SectionCard>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy matters to us. By using HealthMap AI, you acknowledge that you have read and understood this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  effective: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
})
