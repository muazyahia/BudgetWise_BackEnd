const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Activity = require('./models/Activity');
const connectDB = require('./config/db');

const removeDummyData = async () => {
  try {
    await connectDB();
    
    // Delete activities where founder is null or doesn't exist
    const result = await Activity.deleteMany({
      $or: [
        { founder: null },
        { founder: { $exists: false } }
      ]
    });
    
    console.log(`Successfully deleted ${result.deletedCount} dummy activities!`);
    process.exit(0);
  } catch (error) {
    console.error('Error removing dummy data:', error);
    process.exit(1);
  }
};

removeDummyData();
