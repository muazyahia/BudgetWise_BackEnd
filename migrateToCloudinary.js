require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cloudinary = require('./config/cloudinary');

const User = require('./models/User');
const Activity = require('./models/Activity');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected for Migration'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

const uploadToCloudinary = async (localPath, folder, public_id) => {
  try {
    const fullPath = path.join(__dirname, localPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found on disk, skipping: ${fullPath}`);
      return null;
    }
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: folder,
      public_id: public_id,
      overwrite: true,
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading ${localPath} to Cloudinary:`, error);
    return null;
  }
};

const migrateAvatars = async () => {
  console.log('--- Starting Avatar Migration ---');
  // Find users with local avatars
  const users = await User.find({ avatar: { $regex: 'uploads/avatars', $options: 'i' } });
  console.log(`Found ${users.length} users with local avatars.`);

  for (const user of users) {
    console.log(`Migrating avatar for user ${user._id}...`);
    // Local path is likely something like /uploads/avatars/filename.jpg or uploads/avatars/filename.jpg
    let localPath = user.avatar;
    if (localPath.startsWith('/')) {
      localPath = localPath.substring(1);
    }
    
    // Upload
    const secureUrl = await uploadToCloudinary(localPath, 'budgetwise/avatars', `${user._id}_migrated`);
    if (secureUrl) {
      user.avatar = secureUrl;
      await user.save();
      console.log(`Successfully migrated avatar for user ${user._id}: ${secureUrl}`);
    }
  }
};

const migrateActivities = async () => {
  console.log('--- Starting Activities Migration ---');
  // Find activities with local images
  const activities = await Activity.find({
    $or: [
      { image: { $regex: 'uploads/activities', $options: 'i' } },
      { images: { $regex: 'uploads/activities', $options: 'i' } }
    ]
  });
  console.log(`Found ${activities.length} activities with local images.`);

  for (const activity of activities) {
    console.log(`Migrating images for activity ${activity._id}...`);
    let updated = false;

    // Migrate main image
    if (activity.image && activity.image.includes('uploads/activities')) {
      let localPath = activity.image.startsWith('/') ? activity.image.substring(1) : activity.image;
      const secureUrl = await uploadToCloudinary(localPath, 'budgetwise/activities', `activity_${activity._id}_main_migrated`);
      if (secureUrl) {
        activity.image = secureUrl;
        updated = true;
      }
    }

    // Migrate images array
    if (activity.images && activity.images.length > 0) {
      const newImagesArray = [];
      let index = 0;
      for (const imgPath of activity.images) {
        if (imgPath.includes('uploads/activities')) {
          let localPath = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
          const secureUrl = await uploadToCloudinary(localPath, 'budgetwise/activities', `activity_${activity._id}_img_${index}_migrated`);
          if (secureUrl) {
            newImagesArray.push(secureUrl);
            updated = true;
          } else {
            // Keep original if failed to upload
            newImagesArray.push(imgPath);
          }
        } else {
          newImagesArray.push(imgPath);
        }
        index++;
      }
      activity.images = newImagesArray;
    }

    if (updated) {
      await activity.save();
      console.log(`Successfully migrated images for activity ${activity._id}`);
    }
  }
};

const runMigration = async () => {
  try {
    await migrateAvatars();
    await migrateActivities();
    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

runMigration();
