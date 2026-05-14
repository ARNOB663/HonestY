import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
    folder: String,
    alt: String,
    uploadedBy: String,
  },
  { timestamps: true }
);

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
