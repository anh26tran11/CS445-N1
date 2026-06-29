import { Router } from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/roleAuth.js";
import {
    getPerformanceStats,
    getTeamPerformance,
    updatePerformanceMetrics
} from "../controllers/performance.controller.js";

const performanceRouter = Router();

// Get employee performance stats (Employee can view own, Manager can view all)
performanceRouter.get('/employee/:employeeId', auth, getPerformanceStats);

// Get team performance (Manager/Admin only)
performanceRouter.get('/team', auth, requireRole('ADMIN', 'MANAGER'), getTeamPerformance);

// Update performance metrics (System/Internal use)
performanceRouter.post('/update', auth, updatePerformanceMetrics);

export default performanceRouter;
