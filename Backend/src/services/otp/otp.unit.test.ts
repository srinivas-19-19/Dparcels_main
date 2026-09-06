import 'dotenv/config';
import otpService from './otp.service';
import emailService from '../email/email.service';

async function runOtpUnitTestSuite() {
  console.log('\n==================================================');
  console.log('🧪 DPARCELS OTP MODULE UNIT & INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS [${total}]: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL [${total}]: ${description}`);
      throw new Error(`Test assertion failed: ${description}`);
    }
  }

  try {
    const testEmail = `unittest_${Date.now()}@example.com`;

    // 1. Generate & Hash OTP
    console.log('1. Testing Cryptographic OTP Generation & Hashing...');
    const otp1 = otpService.generateOtp();
    assert(otp1.length === 6 && /^\d{6}$/.test(otp1), 'Generated 6-digit cryptographic numeric OTP');

    const hash1 = otpService.hashOtp(otp1, testEmail, 'EMAIL_VERIFICATION');
    const hash2 = otpService.hashOtp(otp1, testEmail, 'EMAIL_VERIFICATION');
    assert(hash1 === hash2, 'Deterministic HMAC-SHA256 OTP hashing works consistently');

    const hashDifferentPurpose = otpService.hashOtp(otp1, testEmail, 'PASSWORD_RESET');
    assert(hash1 !== hashDifferentPurpose, 'Hashing isolates different OTP purposes');

    // 2. Successful OTP Verification
    console.log('\n2. Testing Valid OTP Verification Flow...');
    const validOtp = '654321';
    await otpService.setTestOtpRecord(testEmail, validOtp, 'EMAIL_VERIFICATION');
    const verifySuccess = await otpService.verifyOtp({
      email: testEmail,
      otp: validOtp,
      purpose: 'EMAIL_VERIFICATION'
    });
    assert(verifySuccess.success === true, 'Valid OTP verified successfully');

    // 3. Reject Reused OTP
    console.log('\n3. Testing Reused OTP Rejection...');
    let errorCaught = false;
    try {
      await otpService.verifyOtp({
        email: testEmail,
        otp: validOtp,
        purpose: 'EMAIL_VERIFICATION'
      });
    } catch (err: any) {
      errorCaught = true;
      assert(err.message.includes('Invalid or expired OTP'), 'Consumed OTP cannot be reused');
    }
    assert(errorCaught, 'Reused OTP thrown expected validation error');

    // 4. Purpose Isolation Check
    console.log('\n4. Testing Purpose Isolation (EMAIL_VERIFICATION vs PASSWORD_RESET)...');
    const resetOtp = '112233';
    await otpService.setTestOtpRecord(testEmail, resetOtp, 'PASSWORD_RESET');
    let wrongPurposeError = false;
    try {
      await otpService.verifyOtp({
        email: testEmail,
        otp: resetOtp,
        purpose: 'EMAIL_VERIFICATION' // Wrong purpose provided
      });
    } catch (err: any) {
      wrongPurposeError = true;
      assert(err.message.includes('Invalid or expired OTP'), 'OTP with wrong purpose rejected');
    }
    assert(wrongPurposeError, 'Purpose isolation enforced');

    // 5. Max Attempts Enforcer
    console.log('\n5. Testing Max Attempts Limit (5 Failures)...');
    const limitEmail = `limit_${Date.now()}@example.com`;
    const secretCode = '999888';
    await otpService.setTestOtpRecord(limitEmail, secretCode, 'EMAIL_VERIFICATION');

    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await otpService.verifyOtp({ email: limitEmail, otp: '000000', purpose: 'EMAIL_VERIFICATION' });
      } catch (err: any) {
        assert(err.message.includes('attempt(s) remaining'), `Failed attempt ${attempt} decremented remaining count`);
      }
    }

    // 5th failed attempt should exceed max limits
    try {
      await otpService.verifyOtp({ email: limitEmail, otp: '000000', purpose: 'EMAIL_VERIFICATION' });
    } catch (err: any) {
      assert(err.message.includes('Maximum verification attempts exceeded'), 'Exceeding 5 attempts locked/deleted the OTP');
    }

    // 6. Rate Limiting Cooldown Check (60 seconds)
    console.log('\n6. Testing Resend Cooldown Rate Limiting (60s)...');
    const rateEmail = `ratelimit_${Date.now()}@example.com`;
    await otpService.sendOtp({ email: rateEmail, purpose: 'EMAIL_VERIFICATION' });
    
    let rateLimitCaught = false;
    try {
      await otpService.sendOtp({ email: rateEmail, purpose: 'EMAIL_VERIFICATION' });
    } catch (err: any) {
      rateLimitCaught = true;
      assert(err.statusCode === 429, 'Immediate second OTP request returned 429 Too Many Requests');
    }
    assert(rateLimitCaught, '60-second cooldown rate limit enforced');

    // 7. SMTP Verification Check
    console.log('\n7. Testing Gmail SMTP Transporter Verification...');
    const smtpStatus = await emailService.verifySmtpTransporter();
    assert(smtpStatus === true, 'Gmail SMTP transporter verified successfully');

    console.log('\n==================================================');
    console.log(`🎉 ALL ${passed}/${total} OTP TESTS PASSED SUCCESSFULLY!`);
    console.log('==================================================\n');
  } catch (error: any) {
    console.error('\n❌ UNIT TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

runOtpUnitTestSuite();
