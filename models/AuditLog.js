import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actorEmail: { type: String, index: true },
    method: String,
    path: { type: String, index: true },
    status: Number,
    ip: String,
    userAgent: String,
    body: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
