// متحكم الملف الشخصي

const User = require('../models/User');
const Budget = require('../models/Budget');
const Plan = require('../models/Plan');
const PlanItem = require('../models/PlanItem');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail } = require('../services/emailService');

// 1. جلب بيانات الملف الشخصي
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otpCode -otpExpiry');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({
      success: true,
      message: 'Profile retrieved',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// 2. تحديث بيانات الملف الشخصي الأساسية
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, birthday, companyName, industry, companyAddress } = req.body;
    
    if (name !== undefined && name.trim() === '') {
      res.status(400);
      throw new Error('Name cannot be empty');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (birthday !== undefined) updates.birthday = birthday;
    if (companyName !== undefined) updates.companyName = companyName;
    if (industry !== undefined) updates.industry = industry;
    if (companyAddress !== undefined) updates.companyAddress = companyAddress;
    if (req.body.customIndustry !== undefined) updates.customIndustry = req.body.customIndustry;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password -otpCode -otpExpiry');
    res.json({
      success: true,
      message: 'Profile updated',
      data: user
    });
  } catch (error) {
    next(error);
  }
};
// 2.5 تحديد الدور (Onboarding)
const setRole = async (req, res, next) => {
  try {
    const { role, companyName, industry, companyAddress } = req.body;
    
    if (!['user', 'founder'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role specified');
    }

    const updates = { role };
    
    if (role === 'founder') {
      if (!industry || !companyAddress) {
        res.status(400);
        throw new Error('Industry and address are required for founders');
      }
      updates.companyName = companyName || '';
      updates.industry = industry;
      updates.companyAddress = companyAddress;
      updates.customIndustry = req.body.customIndustry || null;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password -otpCode -otpExpiry');
    res.json({
      success: true,
      message: 'Role and profile details updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};
// 3. تحديث التفضيلات
const updatePreferences = async (req, res, next) => {
  try {
    const { location, currency } = req.body;
    
    const updates = {};
    if (location !== undefined) updates.location = location;
    if (currency !== undefined) updates.currency = currency;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password -otpCode -otpExpiry');
    res.json({
      success: true,
      message: 'Preferences updated',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// 4. تحديث البريد الإلكتروني (طلب)
const updateEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      res.status(400);
      throw new Error('New email and current password are required');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.authProvider === 'local') {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect current password');
      }
    }

    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      res.status(400);
      throw new Error('Email is already in use by another account');
    }

    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.pendingEmail = newEmail.toLowerCase();
    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(user.pendingEmail, otpCode, user.name);

    res.json({
      success: true,
      message: 'Verification code sent to your new email',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// 5. تأكيد تغيير البريد الإلكتروني
const verifyEmailChange = async (req, res, next) => {
  try {
    const { otpCode } = req.body;
    
    if (!otpCode) {
      res.status(400);
      throw new Error('Verification code is required');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.pendingEmail || user.otpCode !== otpCode) {
      res.status(400);
      throw new Error('Invalid verification code');
    }

    if (user.otpExpiry < Date.now()) {
      res.status(400);
      throw new Error('Verification code expired');
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email updated successfully',
      data: { email: user.email }
    });
  } catch (error) {
    next(error);
  }
};

// 6. تحديث كلمة المرور
const updatePassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      res.status(400);
      throw new Error('New password and confirmation are required');
    }

    if (newPassword !== confirmPassword) {
      res.status(400);
      throw new Error('New password and confirmation do not match');
    }

    if (newPassword.length < 8) {
      res.status(400);
      throw new Error('New password must be at least 8 characters long');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// 7. رفع الصورة الشخصية
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image file');
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findById(req.user._id);

    if (user && user.avatar && !user.avatar.startsWith('http')) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    user.avatar = avatarUrl;
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.otpCode;
    delete updatedUser.otpExpiry;

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatarUrl, user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

// 8. حذف الحساب وجميع البيانات المتعلقة
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.authProvider === 'local') {
      if (!password) {
        res.status(400);
        throw new Error('Password is required to confirm deletion');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect password');
      }
    }

    const userId = user._id;

    const deleteFile = (filePath) => {
      if (!filePath || filePath.startsWith('http')) return;
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    };

    // Clean up user avatar
    if (user.avatar) deleteFile(user.avatar);

    // Clean up founder activities and their related data across all users
    if (user.role === 'founder') {
      const founderActivities = await Activity.find({ founder: userId });
      const activityIds = founderActivities.map(a => a._id);

      // Delete images from file system
      founderActivities.forEach(act => {
        if (act.image) deleteFile(act.image);
        if (act.images && act.images.length > 0) act.images.forEach(deleteFile);
      });

      if (activityIds.length > 0) {
        // Remove PlanItems referencing founder's activities from ALL users' plans
        await PlanItem.deleteMany({ activityId: { $in: activityIds } });

        // Recalculate totalPlanned for all affected plans
        const allPlans = await Plan.find({});
        for (const plan of allPlans) {
          const remainingItems = await PlanItem.find({ planId: plan._id });
          plan.totalPlanned = remainingItems.reduce((sum, item) => sum + (item.price || 0), 0);
          await plan.save();
        }

        // Delete all reviews on founder's activities
        const Review = require('../models/Review');
        await Review.deleteMany({ activityId: { $in: activityIds } });
      }

      // Delete the activities themselves
      await Activity.deleteMany({ founder: userId });

      // Delete founder-specific data
      const BusinessPlan = require('../models/BusinessPlan');
      const CompanyBudget = require('../models/CompanyBudget');
      await BusinessPlan.deleteMany({ founder: userId });
      await CompanyBudget.deleteMany({ founder: userId });
    }

    await Budget.deleteMany({ userId });
    await Plan.deleteMany({ userId });
    await PlanItem.deleteMany({ userId });
    await ChatSession.deleteMany({ userId });
    await ChatMessage.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  updateEmail,
  verifyEmailChange,
  updatePassword,
  uploadAvatar,
  deleteAccount,
  setRole
};
