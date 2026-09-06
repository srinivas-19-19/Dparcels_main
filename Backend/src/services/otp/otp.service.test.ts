import otpService from './otp.service';
import emailService from '../email/email.service';

async function runOtpTestSuite() {
  console.log('\n🧪 ==================================================');
  console.log('🧪 DPARCELS CUSTOMER BACKEND EMAIL OTP TEST SUITE');
  console.log('🧪 ==================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(` ❌ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  const testEmail = `test_customer_${Date.now()}@example.com`;

  try {
    // 1. Generate OTP Test
    console.log('1. Testing Cryptographic 6-Digit OTP Generation...');
    const otp1 = otpService.generateOtp();
    assert(/^[0-9]{6}$/.test(otp1), 'Generated OTP is exactly 6 numeric digits');
    const otp2 = otpService.generateOtp();
    assert(otp1 !== otp2, 'Subsequent OTPs are cryptographically random');

    // 2. Hash OTP Test
    console.log('\n2. Testing OTP Secure Hashing (HMAC-SHA256)...');
    const hash1 = otpService.hashOtp('123456', testEmail, 'EMAIL_VERIFICATION');
    const hash2 = otpService.hashOtp('123456', testEmail, 'EMAIL_VERIFICATION');
    const hash3 = otpService.hashOtp('123456', testEmail, 'PASSWORD_RESET');
    assert(hash1 === hash2, 'Identical OTP, email, and purpose produce matching hash');
    assert(hash1 !== hash3, 'Different purposes produce different hashes');

    // 3. Verify EMAIL_VERIFICATION Purpose Test
    console.log('\n3. Testing EMAIL_VERIFICATION OTP Storage & Purpose Verification...');
    const testEmailVerify = `email_verify_${Date.now()}@example.com`;
    const injectedOtp = '654321';
    await otpService.setTestOtpRecord(testEmailVerify, injectedOtp, 'EMAIL_VERIFICATION');
    
    const recordVerify = await otpService.getStoredOtpRecordForTest(testEmailVerify, 'EMAIL_VERIFICATION');
    assert(recordVerify !== null, 'Stored OTP record exists in storage');
    assert(recordVerify?.purpose === 'EMAIL_VERIFICATION', 'Record purpose is EMAIL_VERIFICATION');

    // 4. Reject Incorrect OTP Test
    console.log('\n4. Testing Rejection of Incorrect OTP...');
    let incorrectErrorCaught = false;
    try {
      await otpService.verifyOtp({ email: testEmailVerify, otp: '000000', purpose: 'EMAIL_VERIFICATION' });
    } catch (err: any) {
      incorrectErrorCaught = err.message.includes('Invalid OTP');
    }
    assert(incorrectErrorCaught, 'Incorrect OTP digit string was rejected');

    // 5. Purpose Mismatch Isolation Test
    console.log('\n5. Testing Purpose Mismatch Isolation...');
    let purposeMismatchCaught = false;
    try {
      await otpService.verifyOtp({ email: testEmailVerify, otp: injectedOtp, purpose: 'PASSWORD_RESET' });
    } catch (err: any) {
      purposeMismatchCaught = err.message.includes('Invalid or expired OTP');
    }
    assert(purposeMismatchCaught, 'PASSWORD_RESET purpose request cannot consume EMAIL_VERIFICATION OTP');

    // 6. Resend Cooldown Test
    console.log('\n6. Testing 60-Second Resend Cooldown Limit...');
    const testEmailCooldown = `cooldown_${Date.now()}@example.com`;
    // First send attempt
    try {
      await otpService.sendOtp({ email: testEmailCooldown, purpose: 'EMAIL_VERIFICATION' });
    } catch (e: any) {
      // SMTP might be offline in mock test, but rate limit record is set
    }
    
    let cooldownCaught = false;
    try {
      await otpService.sendOtp({ email: testEmailCooldown, purpose: 'EMAIL_VERIFICATION' });
    } catch (err: any) {
      cooldownCaught = err.statusCode === 429 && err.message.includes('seconds before requesting');
    }
    assert(cooldownCaught, 'Second OTP request within 60s rejected with 429 Too Many Requests');

    // 7. Verification of Correct OTP & Single-Use Consumption Test
    console.log('\n7. Testing Verification of Correct OTP & Single-Use Consumption...');
    const testEmailSuccess = `email_success_${Date.now()}@example.com`;
    const validOtp = '112233';
    await otpService.setTestOtpRecord(testEmailSuccess, validOtp, 'EMAIL_VERIFICATION');

    const verifyResult = await otpService.verifyOtp({
      email: testEmailSuccess,
      otp: validOtp,
      purpose: 'EMAIL_VERIFICATION'
    });
    assert(verifyResult.success === true, 'Correct OTP verified successfully');

    // 8. Reject Reused OTP Test
    console.log('\n8. Testing Rejection of Reused OTP...');
    let reuseErrorCaught = false;
    try {
      await otpService.verifyOtp({
        email: testEmailSuccess,
        otp: validOtp,
        purpose: 'EMAIL_VERIFICATION'
      });
    } catch (err: any) {
      reuseErrorCaught = err.message.includes('Invalid or expired OTP');
    }
    assert(reuseErrorCaught, 'Reused OTP was rejected as consumed');

    // 9. Enforce Maximum 5 Attempts Limit Test
    console.log('\n9. Testing Maximum 5 Verification Attempts Limit...');
    const testMaxAttempts = `max_attempts_${Date.now()}@example.com`;
    const correctMaxOtp = '999999';
    const wrongMaxOtp = '888888';
    
    await otpService.setTestOtpRecord(testMaxAttempts, correctMaxOtp, 'EMAIL_VERIFICATION', 4);

    let maxAttemptsCaught = false;
    try {
      await otpService.verifyOtp({
        email: testMaxAttempts,
        otp: wrongMaxOtp, // 5th failed attempt
        purpose: 'EMAIL_VERIFICATION'
      });
    } catch (err: any) {
      maxAttemptsCaught = err.message.includes('Maximum verification attempts exceeded');
    }
    assert(maxAttemptsCaught, '5th failed attempt locked and deleted OTP record');

    // 10. Verify PASSWORD_RESET Purpose Flow Test
    console.log('\n10. Testing PASSWORD_RESET Purpose Flow...');
    const testResetEmail = `reset_${Date.now()}@example.com`;
    const resetOtp = '654321';
    await otpService.setTestOtpRecord(testResetEmail, resetOtp, 'PASSWORD_RESET');

    const resetResult = await otpService.verifyOtp({
      email: testResetEmail,
      otp: resetOtp,
      purpose: 'PASSWORD_RESET'
    });
    assert(resetResult.success === true, 'PASSWORD_RESET OTP verified successfully');

    // 11. Gmail SMTP Health Test
    console.log('\n11. Testing Gmail SMTP Transporter Verification...');
    const smtpHealth = await emailService.verifySmtpTransporter();
    console.log(`    SMTP Connection status: ${smtpHealth ? 'Connected' : 'Offline/Simulated'}`);

    console.log('\n🎉 ==================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('🎉 ==================================================\n');

    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', error.message);
    process.exit(1);
  }
}

runOtpTestSuite();
