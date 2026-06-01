import mongoose from "mongoose";

// Categories (a.k.a. collections) live in Mongo so admins can add/remove them
// from the product editor without a redeploy. Seeded on first read from
// data/products.js if the collection is empty (see lib/products.js).
const CategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true },
    blurb: { type: String, default: "" },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.index({ sortOrder: 1, title: 1 });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
