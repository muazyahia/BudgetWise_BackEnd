// سكريبت اختبار نظام المصادقة
const http = require(process.env.MONGO_URI);

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function makeAuthRequest(method, path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== Authentication System Test ===\n');

  // 1. تسجيل مستخدم جديد
  console.log('1. POST /api/auth/register');
  const reg = await makeRequest('POST', '/api/auth/register', {
    name: 'Ahmed Test',
    email: 'ahmed@test.com',
    password: '123456',
    confirmPassword: '123456',
  });
  console.log(`   Status: ${reg.status}`);
  console.log(`   Success: ${reg.body.success}`);
  console.log(`   Message: ${reg.body.message}`);
  console.log(`   Data: ${JSON.stringify(reg.body.data)}\n`);

  // 2. محاولة تسجيل بنفس البريد (يجب أن يفشل)
  console.log('2. POST /api/auth/register (duplicate)');
  const regDup = await makeRequest('POST', '/api/auth/register', {
    name: 'Ahmed Test',
    email: 'ahmed@test.com',
    password: '123456',
    confirmPassword: '123456',
  });
  console.log(`   Status: ${regDup.status}`);
  console.log(`   Success: ${regDup.body.success}`);
  console.log(`   Message: ${regDup.body.message}\n`);

  // 3. محاولة تسجيل بدون حقول (يجب أن يفشل)
  console.log('3. POST /api/auth/register (missing fields)');
  const regMissing = await makeRequest('POST', '/api/auth/register', {
    name: 'Ahmed',
  });
  console.log(`   Status: ${regMissing.status}`);
  console.log(`   Success: ${regMissing.body.success}`);
  console.log(`   Message: ${regMissing.body.message}\n`);

  // 4. محاولة تسجيل دخول قبل التحقق (يجب أن يرفض)
  console.log('4. POST /api/auth/login (before verification)');
  const loginUnverified = await makeRequest('POST', '/api/auth/login', {
    email: 'ahmed@test.com',
    password: '123456',
  });
  console.log(`   Status: ${loginUnverified.status}`);
  console.log(`   Success: ${loginUnverified.body.success}`);
  console.log(`   Message: ${loginUnverified.body.message}\n`);

  // 5. التحقق من OTP باستخدام رمز خاطئ
  console.log('5. POST /api/auth/verify-otp (wrong OTP)');
  const verifyWrong = await makeRequest('POST', '/api/auth/verify-otp', {
    email: 'ahmed@test.com',
    otpCode: '000000',
  });
  console.log(`   Status: ${verifyWrong.status}`);
  console.log(`   Success: ${verifyWrong.body.success}`);
  console.log(`   Message: ${verifyWrong.body.message}\n`);

  // 6. الحصول على OTP الحقيقي من قاعدة البيانات مباشرة
  const mongoose = require('mongoose');
  require('dotenv').config();
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');
  const user = await User.findOne({ email: 'ahmed@test.com' });
  const realOTP = user.otpCode;
  console.log(`6. OTP from DB: ${realOTP}\n`);

  // 7. التحقق من OTP الصحيح
  console.log('7. POST /api/auth/verify-otp (correct OTP)');
  const verifyOk = await makeRequest('POST', '/api/auth/verify-otp', {
    email: 'ahmed@test.com',
    otpCode: realOTP,
  });
  console.log(`   Status: ${verifyOk.status}`);
  console.log(`   Success: ${verifyOk.body.success}`);
  console.log(`   Message: ${verifyOk.body.message}`);
  const verifyToken = verifyOk.body.data?.token;
  console.log(`   Token received: ${verifyToken ? 'YES' : 'NO'}`);
  console.log(`   User: ${JSON.stringify(verifyOk.body.data?.user)}\n`);

  // 8. تسجيل الدخول بعد التحقق
  console.log('8. POST /api/auth/login (after verification)');
  const loginOk = await makeRequest('POST', '/api/auth/login', {
    email: 'ahmed@test.com',
    password: '123456',
  });
  console.log(`   Status: ${loginOk.status}`);
  console.log(`   Success: ${loginOk.body.success}`);
  console.log(`   Message: ${loginOk.body.message}`);
  const loginToken = loginOk.body.data?.token;
  console.log(`   Token received: ${loginToken ? 'YES' : 'NO'}\n`);

  // 9. تسجيل دخول بكلمة مرور خاطئة
  console.log('9. POST /api/auth/login (wrong password)');
  const loginWrong = await makeRequest('POST', '/api/auth/login', {
    email: 'ahmed@test.com',
    password: 'wrongpassword',
  });
  console.log(`   Status: ${loginWrong.status}`);
  console.log(`   Success: ${loginWrong.body.success}`);
  console.log(`   Message: ${loginWrong.body.message}\n`);

  // 10. الوصول إلى GET /me بدون رمز مصادقة
  console.log('10. GET /api/auth/me (no token)');
  const meNoToken = await makeRequest('GET', '/api/auth/me');
  console.log(`   Status: ${meNoToken.status}`);
  console.log(`   Success: ${meNoToken.body.success}`);
  console.log(`   Message: ${meNoToken.body.message}\n`);

  // 11. الوصول إلى GET /me برمز مصادقة صحيح
  console.log('11. GET /api/auth/me (valid token)');
  const meOk = await makeAuthRequest('GET', '/api/auth/me', loginToken);
  console.log(`   Status: ${meOk.status}`);
  console.log(`   Success: ${meOk.body.success}`);
  console.log(`   Message: ${meOk.body.message}`);
  console.log(`   User name: ${meOk.body.data?.user?.name}`);
  console.log(`   User email: ${meOk.body.data?.user?.email}\n`);

  // 12. نسيان كلمة المرور
  console.log('12. POST /api/auth/forgot-password');
  const forgot = await makeRequest('POST', '/api/auth/forgot-password', {
    email: 'ahmed@test.com',
  });
  console.log(`   Status: ${forgot.status}`);
  console.log(`   Success: ${forgot.body.success}`);
  console.log(`   Message: ${forgot.body.message}\n`);

  // 13. الحصول على OTP الجديد وإعادة تعيين كلمة المرور
  const userUpdated = await User.findOne({ email: 'ahmed@test.com' });
  const resetOTP = userUpdated.otpCode;
  console.log(`13. Reset OTP from DB: ${resetOTP}`);
  
  console.log('    POST /api/auth/reset-password');
  const resetPw = await makeRequest('POST', '/api/auth/reset-password', {
    email: 'ahmed@test.com',
    otpCode: resetOTP,
    newPassword: 'newpass123',
  });
  console.log(`   Status: ${resetPw.status}`);
  console.log(`   Success: ${resetPw.body.success}`);
  console.log(`   Message: ${resetPw.body.message}\n`);

  // 14. تسجيل الدخول بكلمة المرور الجديدة
  console.log('14. POST /api/auth/login (new password)');
  const loginNew = await makeRequest('POST', '/api/auth/login', {
    email: 'ahmed@test.com',
    password: 'newpass123',
  });
  console.log(`   Status: ${loginNew.status}`);
  console.log(`   Success: ${loginNew.body.success}`);
  console.log(`   Message: ${loginNew.body.message}`);
  console.log(`   Token received: ${loginNew.body.data?.token ? 'YES' : 'NO'}\n`);

  // تنظيف: حذف المستخدم التجريبي
  await User.deleteOne({ email: 'ahmed@test.com' });
  console.log('Cleanup: Test user deleted.\n');

  // ملخص النتائج
  console.log('=== Tests Summary ===');
  const tests = [
    { name: 'Register', pass: reg.body.success === true },
    { name: 'Duplicate register blocked', pass: regDup.body.success === false },
    { name: 'Missing fields blocked', pass: regMissing.body.success === false },
    { name: 'Login before verify blocked', pass: loginUnverified.body.success === false },
    { name: 'Wrong OTP blocked', pass: verifyWrong.body.success === false },
    { name: 'Correct OTP verify', pass: verifyOk.body.success === true && !!verifyToken },
    { name: 'Login after verify', pass: loginOk.body.success === true && !!loginToken },
    { name: 'Wrong password blocked', pass: loginWrong.body.success === false },
    { name: 'GET /me without token blocked', pass: meNoToken.body.success === false },
    { name: 'GET /me with token', pass: meOk.body.success === true },
    { name: 'Forgot password', pass: forgot.body.success === true },
    { name: 'Reset password', pass: resetPw.body.success === true },
    { name: 'Login with new password', pass: loginNew.body.success === true },
  ];

  let passed = 0;
  for (const t of tests) {
    const icon = t.pass ? '✅' : '❌';
    console.log(`${icon} ${t.name}`);
    if (t.pass) passed++;
  }
  console.log(`\nResult: ${passed}/${tests.length} tests passed`);

  await mongoose.disconnect();
  process.exit(passed === tests.length ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
