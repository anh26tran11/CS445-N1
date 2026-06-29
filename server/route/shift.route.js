import { Router } from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/roleAuth.js";
import {
    createShift,
    getShiftsByDate,
    getShiftsByEmployee,
    updateShift,
    deleteShift,
    assignStaffToShift
} from "../controllers/shift.controller.js";

const shiftRouter = Router();

// Create shift (Manager only)
shiftRouter.post('/create', auth, requireRole('ADMIN', 'MANAGER'), createShift);

// Get shifts by date range (All authenticated users)
shiftRouter.get('/date', auth, getShiftsByDate);

// Get shifts by employee (Employee can view own, Manager can view all)
shiftRouter.get('/employee/:employeeId', auth, getShiftsByEmployee);

// Update shift (Manager only)
shiftRouter.put('/update/:id', auth, requireRole('ADMIN', 'MANAGER'), updateShift);

// Delete shift (Manager only)
shiftRouter.delete('/delete/:id', auth, requireRole('ADMIN', 'MANAGER'), deleteShift);

// Assign staff to shift (Manager only)
shiftRouter.post('/assign', auth, requireRole('ADMIN', 'MANAGER'), assignStaffToShift);

export default shiftRouter;
