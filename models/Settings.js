import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "store", unique: true, index: true },
    storeName: { type: String, default: "Honesty" },
    supportEmail: String,
    supportPhone: String,
    currency: { type: String, default: "BDT" },
    flatShippingRate: { type: Number, default: 80 },
    freeShippingThreshold: { type: Number, default: 2000 },
    taxRate: { type: Number, default: 0 },
    announcement: String,
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
