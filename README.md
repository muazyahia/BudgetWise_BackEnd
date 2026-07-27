# BudgetWise Backend - نظام إدارة الميزانية الذكي 💰

الباك إند (Backend) لتطبيق **BudgetWise**، وهو منصة ذكية مصممة لمساعدتك في التخطيط المالي وتتبع نفقاتك بسهولة، بالإضافة إلى توفير مساعد ذكي مدمج لتقديم نصائح مالية بناءً على ميزانيتك.

هذا المشروع مبني باستخدام **Node.js, Express, و MongoDB**، وهو مُهيأ بالكامل للعمل إما على خوادم تقليدية (مثل VPS) أو في بيئات بلا خوادم (Serverless) مثل **Vercel**.

## 🚀 التقنيات المستخدمة
- **Node.js & Express:** بناء الـ API.
- **MongoDB & Mongoose:** قاعدة البيانات وإدارتها (مع دعم الـ Connection Caching لبيئات Serverless).
- **Socket.io:** للإشعارات الحية والدردشة (يعمل محلياً، ويُعطل تلقائياً في Vercel).
- **JWT & Passport:** المصادقة وحماية المسارات.
- **Multer:** لرفع وتخزين الملفات (الصور الشخصية).

## 🚀 كيفية تشغيل المشروع

### التطوير المحلي (Local Development)
1. **تثبيت الحزم:**
   ```bash
   npm install
   ```

2. **تشغيل الخادم:**
   ```bash
   npm run dev
   ```
   سيعمل الخادم افتراضياً على المنفذ `5000`.

### الاستضافة على Vercel (Production)
المشروع جاهز تماماً للرفع على **Vercel**. يحتوي على ملف `vercel.json` لتوجيه الطلبات لـ `server.js`.
عند الرفع، يرجى إضافة جميع متغيرات البيئة `.env` المطلوبة في لوحة تحكم Vercel في قسم **Environment Variables**.

> **ملاحظات Vercel الهامة:**
> - تقنية الـ WebSockets (مثل `Socket.io`) لا تعمل على Vercel Serverless Functions المستمرة، تم تعديل الكود ليعمل بنظام Request/Response العادي على Vercel وتجنب أي أخطاء.
> - ميزة رفع الملفات محلياً (`uploads/`) قد لا تعمل بشكل دائم على Vercel لأن الملفات فيه للقراءة فقط.

## 🔑 متغيرات البيئة المطلوبة (.env)

يجب إنشاء ملف `.env` في المسار الجذري وإضافة المتغيرات التالية:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/budgetwise # أو رابط MongoDB Atlas
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000 # ضع رابط الواجهة الأمامية (Vercel Frontend) للسماح لـ CORS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

## 📂 هيكل مجلدات المشروع

- `config/`: إعدادات الاتصال بقاعدة البيانات وإعدادات تسجيل الدخول.
- `controllers/`: المتحكمات التي تحتوي على منطق الأعمال لكل مسار.
- `middleware/`: وسطاء Express (مثل المصادقة `protect` ومعالجة الأخطاء `errorHandler`).
- `models/`: نماذج قاعدة البيانات (MongoDB/Mongoose).
- `routes/`: مسارات واجهة برمجة التطبيقات (API Routes).
- `services/`: الخدمات الخارجية (مثل خدمة البريد الإلكتروني وخدمة الذكاء الاصطناعي).
- `utils/`: أدوات مساعدة (مثل حسابات الميزانية وتوليد الرموز).
- `uploads/`: المجلد الذي يتم فيه تخزين الصور المرفوعة (مثل الصور الشخصية).
- `server.js`: نقطة الدخول الرئيسية للخادم ومُصدِّر التطبيق (Export) لـ Vercel.
- `vercel.json`: إعدادات بيئة Vercel.

## 🌐 مسارات واجهة برمجة التطبيقات (API Endpoints)

### المصادقة (`/api/auth`)
- `POST /register` | `POST /login` | `POST /verify-otp` | `POST /reset-password` | `GET /me`

### الميزانية (`/api/budget`)
- `POST /` | `GET /me` | `PUT /:id` | `GET /stats` | `GET /tips`

### الأنشطة (`/api/activities`)
- `GET /` | `GET /search` | `GET /recommended` | `GET /:id`

### الخطط (`/api/plan`)
- `GET /me` | `POST /add` | `DELETE /remove/:itemId` | `GET /summary`

### المحادثة الذكية (`/api/chat`)
- `GET /sessions` | `POST /sessions` | `GET /sessions/:id` | `POST /sessions/:id/message` | `DELETE /sessions/:id`

### الملف الشخصي (`/api/profile`)
- `GET /` | `PUT /` | `PUT /preferences` | `PUT /password` | `POST /avatar` | `DELETE /`

---
**تطوير:** فريق BudgetWise
