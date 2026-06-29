import ShiftModel from "../models/shift.model.js";
import UserModel from "../models/user.model.js";

/**
 * Create new shift (Manager only)
 */
export const createShift = async (req, res) => {
    try {
        const { shiftType, date, startTime, endTime, assignedStaff, maxStaff, notes } = req.body;

        // Validation
        if (!shiftType || !date || !startTime || !endTime) {
            return res.status(400).json({
                message: "Vui lòng cung cấp đầy đủ thông tin ca làm việc",
                error: true,
                success: false
            });
        }

        // Check for existing shift on same date and type
        const existingShift = await ShiftModel.findOne({
            date: new Date(date),
            shiftType
        });

        if (existingShift) {
            return res.status(400).json({
                message: `Ca ${shiftType} ngày ${new Date(date).toLocaleDateString('vi-VN')} đã tồn tại`,
                error: true,
                success: false
            });
        }

        // Create shift
        const shift = new ShiftModel({
            shiftType,
            date: new Date(date),
            startTime,
            endTime,
            assignedStaff: assignedStaff || [],
            maxStaff: maxStaff || 10,
            notes,
            createdBy: req.userId
        });

        await shift.save();

        const populatedShift = await ShiftModel.findById(shift._id)
            .populate('assignedStaff.userId', 'name email role employeeId')
            .populate('createdBy', 'name email');

        return res.status(201).json({
            message: "Tạo ca làm việc thành công",
            data: populatedShift,
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
 * Get shifts by date range
 */
export const getShiftsByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            query.date = new Date(startDate);
        }

        const shifts = await ShiftModel.find(query)
            .populate('assignedStaff.userId', 'name email role employeeId')
            .populate('createdBy', 'name email')
            .sort({ date: 1, shiftType: 1 });

        return res.status(200).json({
            message: "Lấy danh sách ca làm việc thành công",
            data: shifts,
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
 * Get shifts by employee
 */
export const getShiftsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate } = req.query;

        const query = {
            'assignedStaff.userId': employeeId
        };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const shifts = await ShiftModel.find(query)
            .populate('assignedStaff.userId', 'name email role employeeId')
            .sort({ date: 1, shiftType: 1 });

        return res.status(200).json({
            message: "Lấy lịch làm việc thành công",
            data: shifts,
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
 * Update shift
 */
export const updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const shift = await ShiftModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('assignedStaff.userId', 'name email role employeeId')
            .populate('createdBy', 'name email');

        if (!shift) {
            return res.status(404).json({
                message: "Không tìm thấy ca làm việc",
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            message: "Cập nhật ca làm việc thành công",
            data: shift,
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
 * Delete shift
 */
export const deleteShift = async (req, res) => {
    try {
        const { id } = req.params;

        const shift = await ShiftModel.findByIdAndDelete(id);

        if (!shift) {
            return res.status(404).json({
                message: "Không tìm thấy ca làm việc",
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            message: "Xóa ca làm việc thành công",
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
 * Assign staff to shift
 */
export const assignStaffToShift = async (req, res) => {
    try {
        const { shiftId, userId, role } = req.body;

        if (!shiftId || !userId) {
            return res.status(400).json({
                message: "Thiếu thông tin ca làm việc hoặc nhân viên",
                error: true,
                success: false
            });
        }

        const shift = await ShiftModel.findById(shiftId);
        if (!shift) {
            return res.status(404).json({
                message: "Không tìm thấy ca làm việc",
                error: true,
                success: false
            });
        }

        // Check if staff already assigned
        const alreadyAssigned = shift.assignedStaff.some(
            staff => staff.userId.toString() === userId
        );

        if (alreadyAssigned) {
            return res.status(400).json({
                message: "Nhân viên đã được phân công vào ca này",
                error: true,
                success: false
            });
        }

        // Check max staff limit
        if (shift.assignedStaff.length >= shift.maxStaff) {
            return res.status(400).json({
                message: "Ca làm việc đã đủ số lượng nhân viên",
                error: true,
                success: false
            });
        }

        // Add staff to shift
        shift.assignedStaff.push({ userId, role, confirmed: false });
        await shift.save();

        const updatedShift = await ShiftModel.findById(shiftId)
            .populate('assignedStaff.userId', 'name email role employeeId');

        return res.status(200).json({
            message: "Phân công nhân viên thành công",
            data: updatedShift,
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
    createShift,
    getShiftsByDate,
    getShiftsByEmployee,
    updateShift,
    deleteShift,
    assignStaffToShift
};
