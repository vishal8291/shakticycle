import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppScreen, SectionCard } from '../../../src/components/MobileUI'
import { colors, typography } from '../../../src/theme/colors'

const sections = [
  {
    title: '1. Service Description',
    body: `HealthMap AI is an AI-powered health record management application developed by Vishal Tiwari. The Service enables users to store, organize, and manage personal health records, track vitals and medications, receive AI-generated health insights, and maintain a comprehensive digital health profile.

Key features include:
- Digital storage and organization of medical reports and health records
- Tracking of vitals (blood pressure, glucose, weight, pulse, etc.)
- Medication management and adherence tracking
- AI-powered analysis of health data and personalized insights
- Integration with India's Ayushman Bharat Digital Mission (ABDM) for national health records
- Appointment and consultation management
- Emergency health card generation
- Export and sharing of health data with healthcare providers`,
  },
  {
    title: '2. Account Registration and Eligibility',
    body: `By creating an account on HealthMap AI, you represent and warrant that:

a) You are at least 18 years of age. Persons under the age of 18 are not permitted to create accounts or use the Service.

b) All information you provide during registration and throughout your use of the Service is accurate, current, and complete. You agree to promptly update your information if it changes.

c) You are solely responsible for maintaining the confidentiality of your account credentials, including your password and any authentication tokens. You agree to notify us immediately of any unauthorized access to or use of your account.

d) You accept full responsibility for all activities that occur under your account, whether or not authorized by you.

e) You will not create multiple accounts, share your account with others, or transfer your account to any other person without our prior written consent.`,
  },
  {
    title: '3. Health Disclaimer',
    body: `IMPORTANT: HealthMap AI is NOT a substitute for professional medical advice, diagnosis, or treatment.

a) The AI-generated insights, health scores, analyses, and recommendations provided through the Service are for informational and educational purposes only. They do not constitute medical advice and should not be relied upon as such.

b) Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition, medication, treatment, or health concern. Never disregard professional medical advice or delay in seeking it because of information provided by the Service.

c) If you think you may have a medical emergency, call your doctor, go to the nearest emergency department, or call emergency services immediately. HealthMap AI does not provide emergency medical services.

d) The accuracy of AI-generated insights depends on the quality and completeness of the data you provide. The Service may produce inaccurate or incomplete analyses. You should always verify AI-generated information with a qualified healthcare professional.

e) HealthMap AI does not endorse any specific tests, physicians, products, procedures, opinions, or other information that may be mentioned within the Service.`,
  },
  {
    title: '4. Subscription and Payments',
    body: `a) Free Tier: HealthMap AI offers a free tier with limited features, including a cap on the number of health records, AI chat messages, and report analyses. The specific limits of the free tier are described within the application and may change from time to time.

b) Paid Plans: Premium and Family subscription plans are available with enhanced features and higher usage limits. Paid plans are billed on a monthly recurring basis.

c) Auto-Renewal: Paid subscriptions automatically renew at the end of each billing cycle unless cancelled before the renewal date. You will be charged the applicable subscription fee at the beginning of each renewal period.

d) Cancellation: You may cancel your subscription at any time through the application. Cancellation takes effect at the end of the current billing period. You will retain access to paid features until the end of the period for which you have already paid.

e) Refund Policy: You may request a full refund within 7 days of your first payment if you are not satisfied with the Service. Refund requests after this period will be evaluated on a case-by-case basis. Subsequent renewal charges are non-refundable.

f) Payment Processing: All payments are processed through Razorpay, a third-party payment processor. By making a payment, you agree to Razorpay's terms of service and privacy policy. HealthMap AI does not store your complete payment card details.

g) Price Changes: We reserve the right to change subscription prices with at least 30 days' prior notice. Price changes will apply to the next billing cycle following the notice period.`,
  },
  {
    title: '5. Data and Privacy',
    body: `a) Data Collection: In order to provide the Service, we collect and process personal information including your name, email address, phone number, health records, vitals, medications, appointment details, device information, and push notification tokens. For full details, please refer to our Privacy Policy.

b) Data Storage: Your data is stored securely in MongoDB Atlas with encryption in transit using TLS (Transport Layer Security). Access to data is protected through secure token-based authentication.

c) Data Sharing: We do not sell, rent, or share your personal health data with third parties without your explicit consent, except as required by law or as necessary to provide the Service (e.g., payment processing through Razorpay).

d) ABDM Integration: Integration with the Ayushman Bharat Digital Mission (ABDM) is performed only with your explicit consent. Health records imported through ABDM are handled in accordance with ABDM protocols and guidelines.

e) Data Control: You have the right to access, export, and delete your data at any time through the application. Account deletion results in the removal of all associated personal data from our systems.`,
  },
  {
    title: '6. User Responsibilities',
    body: `By using the Service, you agree to:

a) Use the Service only for lawful purposes and in accordance with these Terms.

b) Not upload, transmit, or distribute any content that is malicious, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable.

c) Not attempt to gain unauthorized access to any part of the Service, other users' accounts, or any systems or networks connected to the Service.

d) Not use the Service to distribute malware, viruses, or other harmful software.

e) Not interfere with or disrupt the integrity or performance of the Service.

f) Keep your password secure and not share your account credentials with any third party.

g) Provide accurate health information and not intentionally upload falsified medical records.

h) Not use the Service for any commercial purpose without our prior written consent.`,
  },
  {
    title: '7. Intellectual Property',
    body: `a) All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, software, and the compilation thereof, are the exclusive property of HealthMap AI and its developer, Vishal Tiwari, and are protected by Indian and international copyright, trademark, and other intellectual property laws.

b) You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial use, subject to these Terms.

c) You may not copy, modify, distribute, sell, lease, or create derivative works based on the Service or any content therein without our prior written permission.

d) Your health data remains your property. By using the Service, you grant us a limited license to process your data solely for the purpose of providing and improving the Service.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `a) THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

b) TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HEALTHMAP AI, ITS DEVELOPER, AFFILIATES, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.

c) HealthMap AI shall not be liable for any health decisions or outcomes based on AI-generated insights, recommendations, or analyses provided through the Service.

d) In no event shall our total liability to you for all claims arising out of or relating to the Service exceed the amount you have paid to us in the twelve (12) months preceding the claim.

e) The limitations of liability set forth in this section shall apply even if a remedy set forth herein is found to have failed its essential purpose.`,
  },
  {
    title: '9. Termination',
    body: `a) You may terminate your account at any time by deleting your account through the application or by contacting us directly.

b) We reserve the right to suspend or terminate your account, without prior notice or liability, if we reasonably believe that you have violated these Terms, including but not limited to:
   - Providing false or misleading information
   - Engaging in unauthorized or fraudulent activity
   - Uploading malicious content or attempting to compromise the Service
   - Violating any applicable laws or regulations

c) Upon termination, your right to use the Service will immediately cease. We may, at our discretion, retain or delete your data in accordance with our Privacy Policy and applicable law.

d) Provisions of these Terms that by their nature should survive termination shall survive, including but not limited to ownership provisions, warranty disclaimers, and limitations of liability.`,
  },
  {
    title: '10. Changes to Terms',
    body: `a) We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 15 days' notice prior to any new terms taking effect, through in-app notifications or email.

b) By continuing to access or use the Service after revisions become effective, you agree to be bound by the revised Terms. If you do not agree to the new Terms, you must stop using the Service.

c) We will indicate the date of the last revision at the top of these Terms.`,
  },
  {
    title: '11. Governing Law and Dispute Resolution',
    body: `a) These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.

b) Any dispute arising out of or in connection with these Terms, including any question regarding its existence, validity, or termination, shall be subject to the exclusive jurisdiction of the courts in India.

c) Before initiating any formal legal proceedings, the parties agree to attempt to resolve disputes through good-faith negotiation for a period of at least 30 days.`,
  },
  {
    title: '12. Contact Information',
    body: `If you have any questions, concerns, or feedback regarding these Terms and Conditions, please contact us:

Developer: Vishal Tiwari
Phone: +91 8291569470
GitHub: github.com/vishal8291

We will make every effort to respond to your inquiries within a reasonable timeframe.`,
  },
]

export default function TermsScreen() {
  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionCard title="Terms and Conditions">
          <Text style={styles.effective}>Effective Date: April 2026</Text>
          <Text style={styles.intro}>
            Welcome to HealthMap AI. These Terms and Conditions ("Terms") govern your access to and use of the HealthMap AI mobile application and related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
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
            By using HealthMap AI, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
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
