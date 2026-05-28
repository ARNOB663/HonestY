import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    items: [
      {
        slug: String,
        variantId: String,
        variantName: String,
        title: String,
        price: Number,
        qty: Number,
        image: String,
      },
    ],
    subtotal: Number,
    shipping: Number,
    discountCode: String,
    discountAmount: { type: Number, default: 0 },
    total: Number,
    status: {
      type: String,
      // "confirmed" is the universal "admin accepted" status — used by COD
      // where money hasn't been collected yet. "paid" is for prepaid orders
      // (bKash/Nagad) where the payment is already in. Both signal the order
      // is ready to pack.
      enum: ["pending", "confirmed", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"],
      default: "pending",
      index: true,
    },
    payment: {
      method: { type: String, enum: ["bkash", "nagad", "cod"], default: "cod" },
      payerNumber: String,
      txnId: String,
      verified: { type: Boolean, default: false },
    },
    shippingAddress: {
      name: String,
      phone: String,
      line1: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    // Admin-only operational fields
    adminNotes: { type: String, default: "" },
    refundAmount: { type: Number, default: 0 },
    refundReason: String,
    statusHistory: [
      {
        _id: false,
        status: String,
        at: { type: Date, default: Date.now },
        by: String,
      },
    ],
  },
  { timestamps: true }
);

OrderSchema.index(
  { "payment.method": 1, "payment.txnId": 1 },
  { unique: true, partialFilterExpression: { "payment.txnId": { $type: "string" } } }
);

// Fast lookups for /api/account/orders and admin/order lists (both sort by createdAt desc).
OrderSchema.index({ userEmail: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
