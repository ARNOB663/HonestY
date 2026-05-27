import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true },
    minSubtotal: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    expiresAt: Date,
    description: { type: String, default: "" },
    // Scope: "all" applies to the whole cart; "collection" only to items in
    // the given collection.
    appliesTo: { type: String, enum: ["all", "collection"], default: "all" },
    collectionSlug: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Discount || mongoose.model("Discount", DiscountSchema);
