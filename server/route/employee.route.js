import { Router } from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/roleAuth.js";
import {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesByRole
} from "../controllers/employee.controller.js";

const employeeRouter = Router();

// Get all employees (Admin/Manager only)
employeeRouter.get('/all', auth, requireRole('ADMIN', 'MANAGER'), getAllEmployees);

// Get employee by ID (Admin/Manager only)
employeeRouter.get('/:id', auth, requireRole('ADMIN', 'MANAGER'), getEmployeeById);

// Create new employee (Admin/Manager only)
employeeRouter.post('/create', auth, requireRole('ADMIN', 'MANAGER'), createEmployee);

// Update employee (Admin/Manager only)
employeeRouter.put('/update/:id', auth, requireRole('ADMIN', 'MANAGER'), updateEmployee);

// Delete employee (Admin only)
employeeRouter.delete('/delete/:id', auth, requireRole('ADMIN', 'MANAGER'), deleteEmployee);

// Get employees by role (Admin/Manager only)
employeeRouter.get('/role/:role', auth, requireRole('ADMIN', 'MANAGER'), getEmployeesByRole);

export default employeeRouter;
