// متحكم الأنشطة

const fs = require('fs');
const path = require('path');
const Activity = require('../models/Activity');
const Budget = require('../models/Budget');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

// 1. جلب جميع الأنشطة مع الفلترة والترتيب والصفحات
const getAllActivities = async (req, res, next) => {
  try {
    const { q, category, city, minPrice, maxPrice, rating, sort, page = 1, limit = 9 } = req.query;

    const query = {};

    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { city: regex }
      ];
    }

    if (category) query.category = category;
    if (city) query.city = city;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) query.rating = { $gte: Number(rating) };

    let sortOption = {};
    if (sort === 'recent') sortOption.createdAt = -1;
    else if (sort === 'price_asc') sortOption.price = 1;
    else if (sort === 'price_desc') sortOption.price = -1;
    else if (sort === 'rating') sortOption.rating = -1;
    else sortOption.createdAt = -1;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const activities = await Activity.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('founder', 'name avatar companyName');

    const totalCount = await Activity.countDocuments(query);

    res.json({
      success: true,
      message: 'Activities retrieved successfully',
      data: {
        activities,
        totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. البحث في الأنشطة
const searchActivities = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, message: 'No query provided', data: [] });
    }

    const regex = new RegExp(q, 'i');
    const activities = await Activity.find({
      $or: [
        { title: regex },
        { description: regex },
        { city: regex }
      ]
    }).limit(10);

    res.json({
      success: true,
      message: 'Search completed',
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// 3. جلب الأنشطة الموصى بها حسب الميزانية
const getRecommended = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ userId: req.user._id, isActive: true });
    
    let activities;
    if (budget) {
      const remaining = budget.amount - budget.spent;
      activities = await Activity.find({ price: { $lte: remaining } })
        .sort({ rating: -1 })
        .limit(3);
    } else {
      // No budget — return top-rated activities
      activities = await Activity.find({})
        .sort({ rating: -1 })
        .limit(3);
    }

    res.json({
      success: true,
      message: 'Recommended activities retrieved',
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// 4. جلب نشاط واحد بالمعرف
const getActivityById = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      res.status(404);
      throw new Error('Activity not found');
    }

    // Increment views
    activity.views = (activity.views || 0) + 1;
    await activity.save();

    res.json({
      success: true,
      message: 'Activity retrieved',
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// 4.1 إضافة تقييم
const createReview = async (req, res, next) => {
  try {
    const activityId = req.params.id;
    const { rating, comment } = req.body;
    
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const review = await Review.create({
      userId: req.user._id,
      activityId,
      rating: Number(rating),
      comment
    });

    // Update Activity Average Rating
    const reviews = await Review.find({ activityId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    
    activity.rating = parseFloat(avgRating.toFixed(1));
    activity.reviewsCount = reviews.length;
    await activity.save();

    // Notify the Founder
    if (activity.founder) {
      await Notification.create({
        userId: activity.founder,
        title: 'New Review on Your Activity!',
        message: `${req.user.name} just gave a ${rating}-star review on "${activity.title}".`,
        type: 'REVIEW_RECEIVED'
      });
    }

    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// 4.2 جلب التقييمات
const getActivityReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ activityId: req.params.id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

// 5. إدخال أنشطة تجريبية (للاختبار فقط)
const seedActivities = async (req, res, next) => {
  try {
    const activitiesData = [
      {
        title: 'زيارة أهرامات الجيزة',
        description: 'جولة سياحية ممتعة حول أهرامات الجيزة وأبو الهول.',
        category: 'tourism',
        price: 200,
        city: 'Giza',
        rating: 4.8,
        reviewsCount: 1500
      },
      {
        title: 'عشاء في برج القاهرة',
        description: 'عشاء رومانسي مع إطلالة بانورامية على مدينة القاهرة.',
        category: 'food',
        price: 800,
        city: 'Cairo',
        rating: 4.6,
        reviewsCount: 850
      },
      {
        title: 'جولة في خان الخليلي',
        description: 'تسوق في أقدم أسواق القاهرة وشراء الهدايا التذكارية.',
        category: 'retail',
        price: 500,
        city: 'Cairo',
        rating: 4.5,
        reviewsCount: 1200
      },
      {
        title: 'سكي مصر - مول مصر',
        description: 'تجربة التزلج على الجليد في أول منتجع تزلج داخلي في إفريقيا.',
        category: 'entertainment',
        price: 600,
        city: 'Mall of Egypt',
        rating: 4.7,
        reviewsCount: 900
      },
      {
        title: 'رحلة نيلية بالمركب',
        description: 'استمتع بجولة هادئة في النيل وقت الغروب.',
        category: 'tourism',
        price: 150,
        city: 'Cairo',
        rating: 4.4,
        reviewsCount: 300
      },
      {
        title: 'المتحف المصري الكبير',
        description: 'زيارة أكبر متحف أثري في العالم.',
        category: 'tourism',
        price: 350,
        city: 'Giza',
        rating: 4.9,
        reviewsCount: 2000
      },
      {
        title: 'دريم بارك',
        description: 'أكبر مدينة ملاهي في مصر، ألعاب متنوعة لكل الأعمار.',
        category: 'entertainment',
        price: 400,
        city: 'Giza',
        rating: 4.3,
        reviewsCount: 2500
      },
      {
        title: 'مول العرب',
        description: 'يوم كامل من التسوق وتناول الطعام في مدينة السادس من أكتوبر.',
        category: 'retail',
        price: 1000,
        city: 'Giza',
        rating: 4.2,
        reviewsCount: 800
      },
      {
        title: 'قلعة قايتباي',
        description: 'جولة تاريخية في قلعة قايتباي بالإسكندرية.',
        category: 'tourism',
        price: 100,
        city: 'Alexandria',
        rating: 4.6,
        reviewsCount: 1100
      },
      {
        title: 'مكتبة الإسكندرية',
        description: 'زيارة صرح ثقافي وعلمي كبير يضم ملايين الكتب.',
        category: 'education',
        price: 50,
        city: 'Alexandria',
        rating: 4.8,
        reviewsCount: 3000
      },
      {
        title: 'مطعم أسماك بالأنفوشي',
        description: 'تذوق أشهى المأكولات البحرية الطازجة.',
        category: 'food',
        price: 450,
        city: 'Alexandria',
        rating: 4.5,
        reviewsCount: 600
      },
      {
        title: 'سفاري في وادي دجلة',
        description: 'تجربة الشواء والتخييم في محمية وادي دجلة.',
        category: 'tourism',
        price: 120,
        city: 'Cairo',
        rating: 4.1,
        reviewsCount: 250
      },
      {
        title: 'حضور عرض مسرحي في الأوبرا',
        description: 'ليلة فنية راقية في دار الأوبرا المصرية.',
        category: 'entertainment',
        price: 250,
        city: 'Cairo',
        rating: 4.7,
        reviewsCount: 500
      },
      {
        title: 'القرية الفرعونية',
        description: 'التعرف على حياة الفراعنة القدماء من خلال جولة حية.',
        category: 'tourism',
        price: 280,
        city: 'Giza',
        rating: 4.2,
        reviewsCount: 400
      },
      {
        title: 'تناول الكشري المصري',
        description: 'وجبة كشري لذيذة في أحد المطاعم الشعبية الشهيرة.',
        category: 'food',
        price: 40,
        city: 'Cairo',
        rating: 4.4,
        reviewsCount: 1000
      }
    ];

    const inserted = await Activity.insertMany(activitiesData);

    res.status(201).json({
      success: true,
      message: 'Seed completed successfully',
      data: {
        count: inserted.length,
        activities: inserted
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. إنشاء نشاط جديد (مخصص للفاوندر)
const createActivity = async (req, res, next) => {
  try {
    if (req.user.role !== 'founder') {
      res.status(403);
      throw new Error('Only founders can create activities');
    }

    const {
      title,
      description,
      category,
      customCategory,
      price,
      pricePerPerson,
      location,
      city,
      highlights,
      availability,
      duration
    } = req.body;

    let parsedHighlights = [];
    if (highlights) {
      try {
        parsedHighlights = JSON.parse(highlights);
      } catch (e) {
        parsedHighlights = typeof highlights === 'string' ? highlights.split(',') : highlights;
      }
    }

    // Handle files
    let image = '';
    let imagesArray = [];
    
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        image = `/uploads/activities/${req.files.image[0].filename}`;
      }
      if (req.files.images && req.files.images.length > 0) {
        imagesArray = req.files.images.map(f => `/uploads/activities/${f.filename}`);
      }
    }

    const finalCategory = category || req.body.industry || 'other';
    const finalCustomCategory = finalCategory === 'other' ? (customCategory || req.body.customIndustry || req.user.customIndustry || null) : null;

    const activity = await Activity.create({
      title,
      description,
      category: finalCategory,
      customCategory: finalCustomCategory,
      price: Number(price),
      pricePerPerson: pricePerPerson === 'true' || pricePerPerson === true,
      location,
      city,
      highlights: parsedHighlights,
      availability,
      duration,
      image,
      images: imagesArray,
      founder: req.user._id,
      rating: parseFloat((Math.random() * (5.0 - 3.8) + 3.8).toFixed(1)),
      reviewsCount: Math.floor(Math.random() * 500) + 10
    });

    // Create a global notification for all users
    await Notification.create({
      userId: null, // Global
      title: 'New Explore Activity!',
      message: `${req.user.companyName || req.user.name} just added a new activity: "${title}". Check it out in Explore!`,
      type: 'EXPLORE_UPDATE'
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// 7. جلب أنشطة الفاوندر
const getMyActivities = async (req, res, next) => {
  try {
    if (req.user.role !== 'founder') {
      res.status(403);
      throw new Error('Only founders can view their activities');
    }

    const activities = await Activity.find({ founder: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'My activities retrieved successfully',
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// 8. حذف نشاط
const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      res.status(404);
      throw new Error('Activity not found');
    }

    if (activity.founder.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this activity');
    }

    // Delete image files from storage
    const deleteFile = (filePath) => {
      if (!filePath || filePath.startsWith('http')) return;
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    };

    if (activity.image) deleteFile(activity.image);
    if (activity.images && activity.images.length > 0) {
      activity.images.forEach(deleteFile);
    }

    await activity.deleteOne();
    res.json({ success: true, message: 'Activity deleted successfully', data: {} });
  } catch (error) {
    next(error);
  }
};

// 9. تحديث نشاط
const updateActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      res.status(404);
      throw new Error('Activity not found');
    }

    if (activity.founder.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this activity');
    }

    const { title, description, price, location, duration, availability, category, industry, city, pricePerPerson, highlights } = req.body;
    
    if (title) activity.title = title;
    if (description) activity.description = description;
    if (price) activity.price = Number(price);
    if (location) activity.location = location;
    if (duration) activity.duration = duration;
    if (availability) activity.availability = availability;
    if (category || industry) activity.category = category || industry;
    if (city) activity.city = city;
    if (pricePerPerson !== undefined) {
      activity.pricePerPerson = pricePerPerson === 'true' || pricePerPerson === true;
    }

    if (highlights) {
      try {
        activity.highlights = JSON.parse(highlights);
      } catch (e) {
        activity.highlights = typeof highlights === 'string' ? highlights.split(',') : highlights;
      }
    }

    // Helper to delete old file
    const deleteFile = (filePath) => {
      if (!filePath || filePath.startsWith('http')) return;
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    };

    // Handle file updates if any
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        if (activity.image) deleteFile(activity.image);
        activity.image = `/uploads/activities/${req.files.image[0].filename}`;
      }
      if (req.files.images && req.files.images.length > 0) {
        if (activity.images && activity.images.length > 0) {
          activity.images.forEach(deleteFile);
        }
        const newImages = req.files.images.map(f => `/uploads/activities/${f.filename}`);
        activity.images = newImages;
      }
    }

    await activity.save();

    res.json({ success: true, message: 'Activity updated successfully', data: activity });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllActivities,
  searchActivities,
  getRecommended,
  getActivityById,
  seedActivities,
  createActivity,
  getMyActivities,
  deleteActivity,
  updateActivity,
  createReview,
  getActivityReviews
};
