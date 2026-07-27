const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '..');

const translations = {
  "جميع الحقول مطلوبة: الاسم، البريد الإلكتروني، كلمة المرور، وتأكيد كلمة المرور": "All fields are required: name, email, password, and password confirmation",
  "كلمة المرور وتأكيدها غير متطابقتين": "Password and confirmation do not match",
  "كلمة المرور يجب أن تكون 6 أحرف على الأقل": "Password must be at least 6 characters long",
  "البريد الإلكتروني مسجل بالفعل": "Email is already registered",
  "خطأ في إرسال بريد التحقق:": "Error sending verification email:",
  "تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني للحصول على رمز التحقق.": "Registration successful. Please check your email for the verification code.",
  "خطأ في الخادم أثناء التسجيل": "Server error during registration",
  "البريد الإلكتروني ورمز التحقق مطلوبان": "Email and verification code are required",
  "المستخدم غير موجود": "User not found",
  "رمز التحقق غير صحيح": "Invalid verification code",
  "رمز التحقق منتهي الصلاحية. يرجى طلب رمز جديد.": "Verification code has expired. Please request a new code.",
  "خطأ في إرسال رسالة الترحيب:": "Error sending welcome message:",
  "تم التحقق من البريد الإلكتروني بنجاح": "Email verified successfully",
  "خطأ في الخادم أثناء التحقق": "Server error during verification",
  "البريد الإلكتروني مطلوب": "Email is required",
  "تم التحقق من هذا الحساب بالفعل": "This account is already verified",
  "تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني": "A new verification code has been sent to your email",
  "خطأ في الخادم أثناء إعادة إرسال الرمز": "Server error while resending code",
  "البريد الإلكتروني وكلمة المرور مطلوبان": "Email and password are required",
  "البريد الإلكتروني أو كلمة المرور غير صحيحة": "Invalid email or password",
  "هذا الحساب مسجل عبر ${user.authProvider}. يرجى تسجيل الدخول من خلاله.": "This account is registered via ${user.authProvider}. Please login through it.",
  "يرجى التحقق من بريدك الإلكتروني أولاً": "Please verify your email first",
  "تم تسجيل الدخول بنجاح": "Login successful",
  "خطأ في الخادم أثناء تسجيل الدخول": "Server error during login",
  "لا يوجد حساب مرتبط بهذا البريد الإلكتروني": "No account linked to this email",
  "هذا الحساب مسجل عبر ${user.authProvider}. لا يمكن إعادة تعيين كلمة المرور.": "This account is registered via ${user.authProvider}. Password cannot be reset.",
  "خطأ في إرسال بريد إعادة التعيين:": "Error sending password reset email:",
  "تم إرسال رمز التحقق إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور": "A verification code has been sent to your email to reset your password",
  "خطأ في الخادم": "Internal server error",
  "البريد الإلكتروني ورمز التحقق وكلمة المرور الجديدة مطلوبة": "Email, verification code, and new password are required",
  "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل": "New password must be at least 6 characters long",
  "تم إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.": "Password reset successfully. You can now login.",
  "خطأ في الخادم أثناء إعادة تعيين كلمة المرور": "Server error during password reset",
  "تم جلب بيانات المستخدم بنجاح": "User data retrieved successfully",
  "الميزانية غير موجودة": "Budget not found",
  "تم حذف الميزانية بنجاح": "Budget deleted successfully",
  "محادثة جديدة": "New chat",
  "الجلسة غير موجودة": "Session not found",
  "تم حذف الجلسة بنجاح": "Session deleted successfully",
  "الخطة غير موجودة": "Plan not found",
  "تم حذف الخطة وجميع عناصرها بنجاح": "Plan and all its items deleted successfully",
  "العنصر غير موجود": "Item not found",
  "تم حذف العنصر بنجاح": "Item deleted successfully",
  "يرجى رفع صورة": "Please upload an image",
  "تم تحديث الصورة بنجاح": "Image updated successfully",
  "كلمة المرور الحالية غير صحيحة": "Current password is incorrect",
  "تم تغيير كلمة المرور بنجاح": "Password changed successfully",
  "خطأ: ${err.message}": "Error: ${err.message}",
  "يُسمح فقط بملفات الصور (jpeg, jpg, png, gif, webp)": "Only image files are allowed (jpeg, jpg, png, gif, webp)",
  "عنوان النشاط مطلوب": "Activity title is required",
  "السعر مطلوب": "Price is required",
  "التقييم لا يمكن أن يكون أقل من 0": "Rating cannot be less than 0",
  "التقييم لا يمكن أن يكون أكثر من 5": "Rating cannot be more than 5",
  "معرف المستخدم مطلوب": "User ID is required",
  "مبلغ الميزانية مطلوب": "Budget amount is required",
  "المبلغ لا يمكن أن يكون سالباً": "Amount cannot be negative",
  "فترة الميزانية مطلوبة": "Budget period is required",
  "معرف الجلسة مطلوب": "Session ID is required",
  "دور المرسل مطلوب": "Sender role is required",
  "محتوى الرسالة مطلوب": "Message content is required",
  "معرف الخطة مطلوب": "Plan ID is required",
  "معرف النشاط مطلوب": "Activity ID is required",
  "الاسم مطلوب": "Name is required",
  "خدمة الذكاء الاصطناعي غير مفعلة حالياً. يرجى إعداد مفتاح API.": "AI service is currently disabled. Please setup an API key.",
  "خطأ في خدمة الذكاء الاصطناعي:": "Error in AI service:",
  "حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي": "Error connecting to AI service",
  "سيتم تفعيل خدمة النصائح المالية قريباً.": "Financial advice service will be activated soon.",
  "خطأ في تحليل البيانات المالية:": "Error analyzing financial data:",
  "حدث خطأ في تحليل البيانات المالية": "Error occurred while analyzing financial data",
  "🔐 رمز التحقق الخاص بك - BudgetWise": "🔐 Your Verification Code - BudgetWise",
  "🎉 مرحباً بك في BudgetWise!": "🎉 Welcome to BudgetWise!",
  "=== اختبار نظام المصادقة ===\\n": "=== Authentication System Test ===\\n",
  "=== ملخص الاختبارات ===": "=== Tests Summary ===",
  "إدارة ميزانيتك بذكاء": "Manage your budget smartly",
  "مرحباً": "Hello",
  "مرحباً ${userName || ''}! 👋": "Hello ${userName || ''}! 👋",
  "لقد تلقينا طلباً للتحقق من حسابك. استخدم رمز التحقق التالي لإتمام العملية:": "We have received a request to verify your account. Use the following verification code to complete the process:",
  "⏱ هذا الرمز صالح لمدة 10 دقائق فقط": "⏱ This code is valid for 10 minutes only",
  "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.": "If you did not request this code, you can safely ignore this message.",
  "جميع الحقوق محفوظة.": "All rights reserved.",
  "هذه رسالة آلية، يرجى عدم الرد عليها.": "This is an automated message, please do not reply.",
  "مرحباً ${userName}!": "Hello ${userName}!",
  "تم التحقق من حسابك بنجاح. يسعدنا انضمامك إلى BudgetWise!": "Your account has been verified successfully. We are glad you joined BudgetWise!",
  "يمكنك الآن الاستمتاع بجميع مميزات التطبيق:": "You can now enjoy all the application features:",
  "📊": "📊",
  "إدارة ميزانيتك بسهولة": "Easily manage your budget",
  "🎯": "🎯",
  "تخطيط أنشطتك اليومية": "Plan your daily activities",
  "🤖": "🤖",
  "مساعد ذكي لنصائح مالية": "Smart assistant for financial advice",
  "📈": "📈",
  "تتبع مصاريفك لحظة بلحظة": "Track your expenses moment by moment",
  "ابدأ الآن": "Start Now"
};

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'scratch' || file === '.git') continue;
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (file.endsWith('.js')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const jsFiles = walkSync(directoryPath);

for (const file of jsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  // To avoid translating inside comments, we can do a naive string replacement 
  // since the translations list matches the exact string literals in the code.
  // We should only replace the strings with quotes around them.
  for (const [arabic, english] of Object.entries(translations)) {
    // Escape characters for regex
    const escapedArabic = arabic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Regex for replacing Arabic strings if they are surrounded by quotes or backticks, or if they appear inside >...< (like in HTML template literals)
    
    // First, let's just do standard exact replacements for the raw strings as long as they are not preceded by `//` on the same line.
    // Wait, let's just replace `arabic` with `english` everywhere EXCEPT inside lines that start with `//` or `*`.
    
    // Split into lines to be safer
    const lines = newContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Skip lines that are purely comments (we don't want to replace inside `//` or `* ` comments)
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
        continue;
      }
      
      // If there's an inline comment, it's safe to replace because `arabic` would be inside quotes or HTML
      if (line.includes(arabic)) {
        lines[i] = line.replace(new RegExp(escapedArabic, 'g'), english);
      }
    }
    newContent = lines.join('\n');
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
}
