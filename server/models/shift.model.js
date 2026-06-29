import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
    shiftType: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: [true, "Shift type is required"],
    },
    date: {
        type: Date,
        required: [true, "Date is required"],
    },
    startTime: {
        type: String,
        required: [true, "Start time is required"],
    },
    endTime: {
        type: String,
        required: [true, "End time is required"],
    },
    assignedStaff: [
        {
            userId: {
                type: mongoose.Schema.ObjectId,
                ref: 'user',
                required: true,
            },
            role: {
                type: String,
                enum: ['MANAGER', 'WAITER', 'CHEF', 'CASHIER'],
            },
            confirmed: {
                type: Boolean,
                default: false,
            },
        }
    ],
    maxStaff: {
        type: Number,
        default: 10,
    },
    notes: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled',
    },
}, {
    timestamps: true
});

// Index for efficient queries
shiftSchema.index({ date: 1, shiftType: 1 });
shiftSchema.index({ 'assignedStaff.userId': 1 });

// Validation: Prevent duplicate staff assignment in same shift
shiftSchema.pre('save', function (next) {
    const userIds = this.assignedStaff.map(staff => staff.userId.toString());
    const uniqueUserIds = new Set(userIds);

    if (userIds.length !== uniqueUserIds.size) {
        next(new Error('Không thể phân công cùng một nhân viên vào ca làm nhiều lần'));
    }

    if (this.assignedStaff.length > this.maxStaff) {
        next(new Error(`Số lượng nhân viên vượt quá giới hạn (${this.maxStaff})`));
    }

    next();
});

const ShiftModel = mongoose.model("shift", shiftSchema);

export default ShiftModel;
