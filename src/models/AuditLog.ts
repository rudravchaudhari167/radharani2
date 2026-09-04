import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAuditLog extends Document {
  adminId?: mongoose.Types.ObjectId | string;
  adminEmail: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
  ipAddress: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminEmail: {
      type: String,
      required: [true, "Admin email is required"],
      trim: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
      index: true,
    },
    target: {
      type: String,
      required: [true, "Target is required"],
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ adminEmail: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
