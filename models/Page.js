import mongoose from "mongoose";

const PageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    published: { type: Boolean, default: true },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export default mongoose.models.Page || mongoose.model("Page", PageSchema);
