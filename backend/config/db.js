const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Drop the deprecated email index to prevent duplicate key errors since we removed the field
    try {
      await mongoose.connection.collection('users').dropIndex('email_1');
      console.log('Dropped deprecated email_1 index');
    } catch (e) {
      // Index might not exist, safely ignore
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
