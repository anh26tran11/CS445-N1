import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: [true, "User ID is required"],
    },
    shiftId: {
        type: mongoose.Schema.ObjectId,
        ref: 'shift',
        required: [true, "Shift ID is required"],
    },
    checkInTime: {
        type: Date,
        required: [true, "Check-in time is required"],
    },
    checkOutTime: {
        type: Date,
    },
    workingHours: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['on_time', 'late', 'early_leave', 'absent'],
        default: 'on_time',
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ userId: 1, shiftId: 1 }, { unique: true });
attendanceSchema.index({ checkInTime: 1 });

// Calculate working hours when check-out
attendanceSchema.pre('save', function (next) {
    if (this.checkOutTime && this.checkInTime) {
        const diffMs = this.checkOutTime - this.checkInTime;
        this.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    }
    next();
});

const AttendanceModel = mongoose.model("attendance", attendanceSchema);

export default AttendanceModel;
