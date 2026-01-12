import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

type VerificationStep = 'enter_aadhaar' | 'verify_otp' | 'success' | 'already_verified';

interface AadhaarVerificationScreenProps {
  isVerified?: boolean;
  onVerificationComplete?: () => void;
}

export default function AadhaarVerificationScreen({
  isVerified = false,
  onVerificationComplete
}: AadhaarVerificationScreenProps) {
  const navigation = useNavigation();
  const [step, setStep] = useState<VerificationStep>(isVerified ? 'already_verified' : 'enter_aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [maskedMobile, setMaskedMobile] = useState('');

  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const formatAadhaarNumber = (text: string) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '');
    // Limit to 12 digits
    const limited = cleaned.slice(0, 12);
    // Format as XXXX XXXX XXXX
    const parts = [];
    for (let i = 0; i < limited.length; i += 4) {
      parts.push(limited.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleAadhaarChange = (text: string) => {
    setAadhaarNumber(formatAadhaarNumber(text));
  };

  const getCleanAadhaar = () => {
    return aadhaarNumber.replace(/\s/g, '');
  };

  const validateAadhaar = () => {
    const clean = getCleanAadhaar();
    if (clean.length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return false;
    }
    // Basic validation - first digit cannot be 0 or 1
    if (clean[0] === '0' || clean[0] === '1') {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid Aadhaar number');
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateAadhaar()) return;

    setLoading(true);
    try {
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock response - would come from backend
      setMaskedMobile('XXXXXX7890');
      setStep('verify_otp');
      startResendTimer();
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful verification
      setStep('success');

      // Call callback if provided
      if (onVerificationComplete) {
        setTimeout(() => {
          onVerificationComplete();
        }, 2000);
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      startResendTimer();
      Alert.alert('OTP Sent', 'A new OTP has been sent to your registered mobile number');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderEnterAadhaar = () => (
    <>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Verify Your Identity</Text>
      <Text style={styles.subtitle}>
        Enter your Aadhaar number to verify your identity. This helps us ensure trust and safety for all users.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Aadhaar Number</Text>
        <View style={styles.aadhaarInputWrapper}>
          <TextInput
            style={styles.aadhaarInput}
            placeholder="XXXX XXXX XXXX"
            placeholderTextColor={colors.gray[400]}
            value={aadhaarNumber}
            onChangeText={handleAadhaarChange}
            keyboardType="number-pad"
            maxLength={14} // 12 digits + 2 spaces
          />
          {getCleanAadhaar().length === 12 && (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          )}
        </View>
        <Text style={styles.helperText}>
          Your Aadhaar details are encrypted and securely stored
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          An OTP will be sent to your Aadhaar-linked mobile number for verification
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.primaryBtn,
          getCleanAadhaar().length !== 12 && styles.primaryBtnDisabled
        ]}
        onPress={handleSendOtp}
        disabled={loading || getCleanAadhaar().length !== 12}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>Send OTP</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Ionicons name="lock-closed" size={14} color={colors.gray[500]} />
        <Text style={styles.securityText}>
          Secured with 256-bit encryption
        </Text>
      </View>
    </>
  );

  const renderVerifyOtp = () => (
    <>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep('enter_aadhaar')}>
        <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: '#3B82F615' }]}>
          <Ionicons name="chatbubble-ellipses" size={48} color="#3B82F6" />
        </View>
      </View>

      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit OTP to your Aadhaar-linked mobile number ending in {maskedMobile}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (otpInputRefs.current[index] = ref)}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleOtpKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <View style={styles.resendContainer}>
        {resendTimer > 0 ? (
          <Text style={styles.resendTimer}>Resend OTP in {resendTimer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
            <Text style={styles.resendLink}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryBtn,
          otp.join('').length !== 6 && styles.primaryBtnDisabled
        ]}
        onPress={handleVerifyOtp}
        disabled={loading || otp.join('').length !== 6}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>Verify</Text>
            <Ionicons name="checkmark" size={20} color={colors.white} />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.troubleContainer}>
        <Text style={styles.troubleText}>Didn't receive OTP?</Text>
        <TouchableOpacity>
          <Text style={styles.troubleLink}>Verify using Aadhaar app</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSuccess = () => (
    <>
      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark" size={64} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Verification Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your identity has been verified successfully. You can now access all features.
        </Text>

        <View style={styles.verifiedCard}>
          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <View style={styles.verifiedInfo}>
              <Text style={styles.verifiedLabel}>Aadhaar Verified</Text>
              <Text style={styles.verifiedValue}>XXXX XXXX {getCleanAadhaar().slice(-4)}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderAlreadyVerified = () => (
    <>
      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Ionicons name="shield-checkmark" size={64} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Already Verified</Text>
        <Text style={styles.successSubtitle}>
          Your Aadhaar has already been verified. No further action is needed.
        </Text>

        <View style={styles.verifiedCard}>
          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <View style={styles.verifiedInfo}>
              <Text style={styles.verifiedLabel}>Aadhaar Verified</Text>
              <Text style={styles.verifiedValue}>Verified on Jan 10, 2024</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'enter_aadhaar' && renderEnterAadhaar()}
          {step === 'verify_otp' && renderVerifyOtp()}
          {step === 'success' && renderSuccess()}
          {step === 'already_verified' && renderAlreadyVerified()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  aadhaarInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
  },
  aadhaarInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[900],
    paddingVertical: 16,
    letterSpacing: 2,
  },
  helperText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.gray[300],
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  // OTP styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[200],
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.gray[900],
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendTimer: {
    fontSize: 14,
    color: colors.gray[500],
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  troubleContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  troubleText: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 4,
  },
  troubleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  // Success styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  verifiedCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  verifiedLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  verifiedValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#10B98115',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});
