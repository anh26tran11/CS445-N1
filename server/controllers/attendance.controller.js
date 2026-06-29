import AttendanceModel from "../models/attendance.model.js";
import ShiftModel from "../models/shift.model.js";
import UserModel from "../models/user.model.js";
import PerformanceModel from "../models/performance.model.js";

/**
 * Check-in for shift
 */
export const checkIn = async (req, res) => {
    try {
        const { shiftId, userId: targetUserId } = req.body;
        const currentUserId = req.userId;

        // If userId is provided in body, use it (for Admin/Manager checking in for others)
        // Otherwise, use the current user's ID (self check-in)
        const userId = targetUserId || currentUserId;

        if (!shiftId) {
            return res.status(400).json({
                message: "Thiếu thông tin ca làm việc",
                error: true,
                success: false
            });
        }

        // Check if shift exists and user is assigned
        const shift = await ShiftModel.findById(shiftId);
        if (!shift) {
            return res.status(404).json({
                message: "Không tìm thấy ca làm việc",
                error: true,
                success: false
            });
        }

        const isAssigned = shift.assignedStaff.some(
            staff => staff.userId.toString() === userId
        );

        if (!isAssigned) {
            return res.status(403).json({
                message: "Nhân viên không được phân công vào ca làm việc này",
                error: true,
                success: false
            });
        }

        // Check if already checked in
        const existingAttendance = await AttendanceModel.findOne({
            userId,
            shiftId
        });

        if (existingAttendance) {
            return res.status(400).json({
                message: "Nhân viên đã check-in cho ca làm việc này rồi",
                error: true,
                success: false
            });
        }

        // Calculate status (keep for salary calculation later)
        let status = 'on_time';
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);

        // Create shift start time object based on shift date
        const shiftStart = new Date(shift.date);
        shiftStart.setHours(startHour, startMinute, 0, 0);

        // Add 15 minutes grace period for late status
        const gracePeriod = 15 * 60 * 1000;
        const lateThreshold = new Date(shiftStart.getTime() + gracePeriod);

        if (new Date() > lateThreshold) {
            status = 'late';
        }

        // Create attendance record
        const attendance = new AttendanceModel({
            userId,
            shiftId,
            checkInTime: new Date(),
            status: status
        });

        await attendance.save();

        const populatedAttendance = await AttendanceModel.findById(attendance._id)
            .populate('userId', 'name email role employeeId')
            .populate('shiftId');

        return res.status(201).json({
            message: "Check-in thành công",
            data: populatedAttendance,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Lỗi server",
            error: true,
            success: false
        });
    }
};

/**
 * Check-out from shift
 */
export const checkOut = async (req, res) => {
    try {
        const { attendanceId, userId: targetUserId, shiftId } = req.body;
        const currentUserId = req.userId;

        // Support two modes:
        // 1. attendanceId provided (direct checkout)
        // 2. userId + shiftId provided (find attendance and checkout)
        let attendance;

        if (attendanceId) {
            attendance = await AttendanceModel.findById(attendanceId);
        } else if (targetUserId && shiftId) {
            // Find attendance by userId and shiftId
            attendance = await AttendanceModel.findOne({
                userId: targetUserId,
                shiftId: shiftId
            });
        } else {
            return res.status(400).json({
                message: "Thiếu thông tin chấm công (cần attendanceId hoặc userId + shiftId)",
                error: true,
                success: false
            });
        }

        if (!attendance) {
            return res.status(404).json({
                message: "Không tìm thấy bản ghi chấm công",
                error: true,
                success: false
            });
        }

        if (attendance.checkOutTime) {
            return res.status(400).json({
                message: "Nhân viên đã check-out rồi",
                error: true,
                success: false
            });
        }

        // Extract userId for later use
        const userId = attendance.userId.toString();

        // Update check-out time
        attendance.checkOutTime = new Date();
        const savedAttendance = await attendance.save(); // Pre-save hook will calculate working hours

        // Note: Performance tracking removed to avoid duplicate key errors
        // Performance metrics can be calculated from attendance records when needed

        const populatedAttendance = await AttendanceModel.findById(attendance._id)
            .populate('userId', 'name email role employeeId')
            .populate('shiftId');

        return res.status(200).json({
            message: "Check-out thành công",
            data: populatedAttendance,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Lỗi server",
            error: true,
            success: false
        });
    }
};

/**
 * Get attendance by employee
 */
export const getAttendanceByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        const query = { userId: employeeId };

        if (startDate && endDate) {
            query.checkInTime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendances = await AttendanceModel.find(query)
            .populate('shiftId')
            .sort({ checkInTime: -1 });

        // Calculate total hours
        const totalHours = attendances.reduce((sum, att) => sum + (att.workingHours || 0), 0);

        return res.status(200).json({
            message: "Lấy lịch sử chấm công thành công",
            data: {
                attendances,
                totalHours: Math.round(totalHours * 100) / 100
            },
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Lỗi server",
            error: true,
            success: false
        });
    }
};

/**
 * Get attendance by date
 */
export const getAttendanceByDate = async (req, res) => {
    try {
        const { date } = req.params;

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendances = await AttendanceModel.find({
            checkInTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
            .populate('userId', 'name email role employeeId')
            .populate('shiftId')
            .sort({ checkInTime: 1 });

        return res.status(200).json({
            message: "Lấy danh sách chấm công thành công",
            data: attendances,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Lỗi server",
            error: true,
            success: false
        });
    }
};

/**
 * Get current attendance status (for check-in/out button)
 */
export const getCurrentAttendance = async (req, res) => {
    try {
        const userId = req.userId;

        // Get today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await AttendanceModel.findOne({
            userId,
            checkInTime: { $gte: today },
            checkOutTime: null // Not checked out yet
        })
            .populate('shiftId')
            .sort({ checkInTime: -1 });

        return res.status(200).json({
            message: "Lấy trạng thái chấm công thành công",
            data: attendance,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Lỗi server",
            error: true,
            success: false
        });
    }
};

export default {
    checkIn,
    checkOut,
    getAttendanceByEmployee,
    getAttendanceByDate,
    getCurrentAttendance
};
