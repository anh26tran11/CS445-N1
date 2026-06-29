import { Router } from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/roleAuth.js";
import {
    checkIn,
    checkOut,
    getAttendanceByEmployee,
    getAttendanceByDate,
    getCurrentAttendance
} from "../controllers/attendance.controller.js";

const attendanceRouter = Router();

// Check-in (All employees)
attendanceRouter.post('/check-in', auth, checkIn);

// Check-out (All employees)
attendanceRouter.post('/check-out', auth, checkOut);

// Get current attendance status (All employees)
attendanceRouter.get('/current', auth, getCurrentAttendance);

// Get attendance by employee (Employee can view own, Manager can view all)
attendanceRouter.get('/employee/:employeeId', auth, getAttendanceByEmployee);

// Get attendance by date (Manager only)
attendanceRouter.get('/date/:date', auth, requireRole('ADMIN', 'MANAGER'), getAttendanceByDate);

export default attendanceRouter;
