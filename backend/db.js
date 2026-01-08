const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://admin:greeshma@cluster0.n3bvco9.mongodb.net/hostelGrievance"
    );
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
  }
};

module.exports = connectDB;