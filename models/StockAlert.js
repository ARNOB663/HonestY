import mongoose from "mongoose";

const StockAlertSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true, index: true },
    variantId: { type: String, default: null },
    email: { type: String, required: true, lowercase: true },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One pending alert per email+product+variant.
StockAlertSchema.index({ productSlug: 1, variantId: 1, email: 1 }, { unique: true });

export default mongoose.models.StockAlert || mongoose.model("StockAlert", StockAlertSchema);
