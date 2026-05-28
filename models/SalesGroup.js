import mongoose from "mongoose";

const SalesGroupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    eyebrow: { type: String, default: "Limited Time" },
    slug: { type: String, required: true, unique: true, index: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    // Slugs of products in this group, in display order.
    productSlugs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.SalesGroup || mongoose.model("SalesGroup", SalesGroupSchema);
