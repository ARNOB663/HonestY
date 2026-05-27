import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    line1: String,
    area: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: "Bangladesh" },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: String,
    passwordHash: { type: String },
    image: String,
    provider: { type: String, default: "credentials" },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    tokenVersion: { type: Number, default: 0 },
    phone: String,
    backupPhone: String,
    defaultAddress: AddressSchema,
    resetTokenHash: String,
    resetTokenExpiresAt: Date,
    wishlist: { type: [String], default: undefined },
    cart: {
      type: [
        {
          _id: false,
          slug: String,
          variantId: String,
          variantName: String,
          title: String,
          price: Number,
          image: String,
          qty: Number,
        },
      ],
      default: undefined,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
