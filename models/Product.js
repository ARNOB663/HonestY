import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    image: String,
    images: [String],
    collection: { type: String, index: true },
    tags: [String],
    inventory: { type: Number, default: 100, min: 0 },
    featured: { type: Boolean, default: false, index: true },
    variants: [
      {
        _id: false,
        id: { type: String, required: true },
        name: { type: String, required: true },
        sku: String,
        price: { type: Number, min: 0 },
        inventory: { type: Number, default: 0, min: 0 },
      },
    ],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
