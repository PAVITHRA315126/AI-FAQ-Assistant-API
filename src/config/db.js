const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/ai_faq_assistant';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`[Database] Primary MongoDB connection failed (${error.message}).`);
      if (primaryUri.includes('127.0.0.1') || primaryUri.includes('localhost')) {
        process.exit(1);
      }
      console.log('[Database] Connecting to local MongoDB server on 127.0.0.1:27017...');
    }
  }

  try {
    const conn = await mongoose.connect(localUri);
    console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
  } catch (localError) {
    console.error(`Database connection error: ${localError.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
