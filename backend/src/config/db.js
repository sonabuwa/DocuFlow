import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGODB CONNECTED SUCCESSFULLY!");
  } catch (error) {
    console.error("The MongoDB is failed to connect", error);
    process.exit(1); // exit with failare
  }
};

export default connectDB;
