const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Activity = require('./models/Activity');
const connectDB = require('./config/db');

const updateRatings = async () => {
  try {
    await connectDB();
    const activities = await Activity.find({});
    
    for (const activity of activities) {
      if (!activity.rating || activity.rating === 0) {
        // Random rating between 3.5 and 5.0
        const randomRating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);
        const randomReviews = Math.floor(Math.random() * 500) + 10;
        
        activity.rating = parseFloat(randomRating);
        activity.reviewsCount = randomReviews;
        await activity.save();
      }
    }
    
    console.log('Successfully updated all activities with random ratings!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating ratings:', error);
    process.exit(1);
  }
};

updateRatings();
