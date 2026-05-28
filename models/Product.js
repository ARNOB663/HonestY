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
        image: String,
        colorHex: String,
      },
    ],
    // Ordered key/value rows shown in the Specification tab on the product page.
    specs: [
      {
        _id: false,
        key: String,
        value: String,
      },
    ],
    // Warranty tab body (plain text, newlines preserved).
    warranty: String,
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

ProductSchema.index(
  { title: "text", description: "text", tags: "text", collection: "text" },
  { weights: { title: 10, tags: 5, collection: 3, description: 1 }, name: "product_search" }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
