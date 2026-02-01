import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { aadhaarApi } from '../lib/aadhaarApi';
import logger from '../lib/logger';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);

  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      aadhaarApi.clearTransaction();
    };
  }, []);

  const formatAadhaarNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 12);
    const parts = [];
    for (let i = 0; i < limited.length; i += 4) {
      parts.push(limited.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleAadhaarChange = (text: string) => {
    setAadhaarNumber(formatAadhaarNumber(text));
    setErrorMessage(null);
  };

  const getCleanAadhaar = () => {
    return aadhaarNumber.replace(/\s/g, '');
  };

  const validateAadhaar = () => {
    const clean = getCleanAadhaar();
    if (clean.length !== 12) {
      setErrorMessage('Please enter a valid 12-digit Aadhaar number');
      return false;
    }
    if (clean[0] === '0' || clean[0] === '1') {
      setErrorMessage('Please enter a valid Aadhaar number');
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateAadhaar()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await aadhaarApi.requestOtp(getCleanAadhaar());

      if (response.success) {
        setMaskedMobile(response.maskedMobile || 'XXXXXX****');
        setStep('verify_otp');
        startResendTimer();
        logger.log('Aadhaar OTP sent successfully');
      } else {
        setErrorMessage(response.message || 'Failed to send OTP. Please try again.');
        logger.error('Aadhaar OTP request failed');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to send OTP. Please check your connection.');
      logger.error('Aadhaar OTP request error');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
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
    setErrorMessage(null);

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
      setErrorMessage('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await aadhaarApi.verifyOtp(otpString);

      if (response.success && response.verified) {
        setVerificationData(response.data);
        setStep('success');
        logger.log('Aadhaar verification successful');

        if (onVerificationComplete) {
          setTimeout(() => {
            onVerificationComplete();
          }, 2000);
        }
      } else {
        setErrorMessage(response.message || 'Invalid OTP. Please try again.');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        logger.error('Aadhaar verification failed');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Verification failed. Please try again.');
      logger.error('Aadhaar verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await aadhaarApi.resendOtp(getCleanAadhaar());

      if (response.success) {
        startResendTimer();
        setOtp(['', '', '', '', '', '']);
        Alert.alert('OTP Sent', 'A new OTP has been sent to your registered mobile number');
      } else {
        setErrorMessage(response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAadhaarApp = async () => {
    const mAadhaarScheme = Platform.OS === 'ios'
      ? 'maadhaar://'
      : 'com.uidai.maadhaar://';

    const uidaiWebsite = 'https://myaadhaar.uidai.gov.in/';
    const playStoreLink = 'https://play.google.com/store/apps/details?id=in.gov.uidai.mAadhaarPlus';
    const appStoreLink = 'https://apps.apple.com/in/app/maadhaar/id1435469474';

    try {
      const canOpen = await Linking.canOpenURL(mAadhaarScheme);
      if (canOpen) {
        await Linking.openURL(mAadhaarScheme);
      } else {
        Alert.alert(
          'mAadhaar App',
          'You can verify your Aadhaar using the official mAadhaar app or the UIDAI website.',
          [
            {
              text: 'Open Website',
              onPress: () => Linking.openURL(uidaiWebsite),
            },
            {
              text: 'Download App',
              onPress: () => Linking.openURL(Platform.OS === 'ios' ? appStoreLink : playStoreLink),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      Linking.openURL(uidaiWebsite);
    }
  };

  const renderEnterAadhaar = () => (
    <>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
      </TouchableOpacity>

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
        <View style={[styles.aadhaarInputWrapper, errorMessage && styles.inputError]}>
          <TextInput
            style={styles.aadhaarInput}
            placeholder="XXXX XXXX XXXX"
            placeholderTextColor={colors.gray[400]}
            value={aadhaarNumber}
            onChangeText={handleAadhaarChange}
            keyboardType="number-pad"
            maxLength={14}
          />
          {getCleanAadhaar().length === 12 && (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          )}
        </View>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : (
          <Text style={styles.helperText}>
            Your Aadhaar details are encrypted and securely stored
          </Text>
        )}
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
          (getCleanAadhaar().length !== 12 || loading) && styles.primaryBtnDisabled
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
      <TouchableOpacity style={styles.backBtn} onPress={() => {
        setStep('enter_aadhaar');
        setOtp(['', '', '', '', '', '']);
        setErrorMessage(null);
        aadhaarApi.clearTransaction();
      }}>
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
            ref={(ref) => { otpInputRefs.current[index] = ref; }}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled,
              errorMessage && styles.otpInputError
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

      {errorMessage && (
        <Text style={styles.otpErrorText}>{errorMessage}</Text>
      )}

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
          (otp.join('').length !== 6 || loading) && styles.primaryBtnDisabled
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
        <TouchableOpacity onPress={handleOpenAadhaarApp}>
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
              <Text style={styles.verifiedValue}>Verification Complete</Text>
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
  inputError: {
    borderColor: '#EF4444',
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
  errorText: {
    fontSize: 12,
    color: '#EF4444',
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
    marginBottom: 16,
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
  otpInputError: {
    borderColor: '#EF4444',
  },
  otpErrorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
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
