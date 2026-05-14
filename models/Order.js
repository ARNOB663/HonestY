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
      enum: ["pending", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"],
      default: "pending",
      index: true,
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
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
