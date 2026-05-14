import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, index: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "hidden", "spam"],
      default: "pending",
      index: true,
    },
    reply: String,
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ productSlug: 1, status: 1 });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
