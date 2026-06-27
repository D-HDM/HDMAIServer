// ====================================================================================================
// HDM AI Server — MongoDB Connection
// ====================================================================================================

const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUrl);
    console.log(`MongoDB: CONNECTED — ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB: FAILED — ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;