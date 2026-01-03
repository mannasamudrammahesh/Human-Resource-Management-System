const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get payroll information
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.query;
    const targetUserId = user_id || req.user.id;

    // Check permissions
    if (targetUserId != req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [payroll] = await db.execute(`
      SELECT p.*, u.employee_id, ep.first_name, ep.last_name, ep.department, ep.position
      FROM payroll p 
      JOIN users u ON p.user_id = u.id 
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [targetUserId]);

    res.json(payroll);
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all employees payroll (Admin/HR only)
router.get('/all', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const [payroll] = await db.execute(`
      SELECT p.*, u.employee_id, ep.first_name, ep.last_name, ep.department, ep.position
      FROM payroll p 
      JOIN users u ON p.user_id = u.id 
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
      ORDER BY ep.first_name, ep.last_name, p.created_at DESC
    `);

    res.json(payroll);
  } catch (error) {
    console.error('Get all payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create/Update payroll (Admin/HR only)
router.post('/', authenticateToken, requireRole(['admin', 'hr']), [
  body('user_id').isInt().withMessage('Valid user ID is required'),
  body('basic_salary').isFloat({ min: 0 }).withMessage('Valid basic salary is required'),
  body('allowances').optional().isFloat({ min: 0 }).withMessage('Valid allowances amount'),
  body('deductions').optional().isFloat({ min: 0 }).withMessage('Valid deductions amount'),
  body('pay_period_start').isISO8601().withMessage('Valid pay period start date is required'),
  body('pay_period_end').isISO8601().withMessage('Valid pay period end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      user_id, 
      basic_salary, 
      allowances = 0, 
      deductions = 0, 
      pay_period_start, 
      pay_period_end 
    } = req.body;

    // Calculate gross and net salary
    const grossSalary = parseFloat(basic_salary) + parseFloat(allowances);
    const netSalary = grossSalary - parseFloat(deductions);

    // Check if payroll already exists for this period
    const [existing] = await db.execute(
      'SELECT id FROM payroll WHERE user_id = ? AND pay_period_start = ? AND pay_period_end = ?',
      [user_id, pay_period_start, pay_period_end]
    );

    if (existing.length > 0) {
      // Update existing payroll
      await db.execute(`
        UPDATE payroll SET 
        basic_salary = ?, allowances = ?, deductions = ?, 
        gross_salary = ?, net_salary = ?
        WHERE id = ?
      `, [basic_salary, allowances, deductions, grossSalary, netSalary, existing[0].id]);

      res.json({ message: 'Payroll updated successfully' });
    } else {
      // Create new payroll
      await db.execute(`
        INSERT INTO payroll 
        (user_id, basic_salary, allowances, deductions, gross_salary, net_salary, pay_period_start, pay_period_end) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [user_id, basic_salary, allowances, deductions, grossSalary, netSalary, pay_period_start, pay_period_end]);

      res.status(201).json({ message: 'Payroll created successfully' });
    }
  } catch (error) {
    console.error('Create/Update payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payroll (Admin/HR only)
router.put('/:id', authenticateToken, requireRole(['admin', 'hr']), [
  body('basic_salary').isFloat({ min: 0 }).withMessage('Valid basic salary is required'),
  body('allowances').optional().isFloat({ min: 0 }).withMessage('Valid allowances amount'),
  body('deductions').optional().isFloat({ min: 0 }).withMessage('Valid deductions amount')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { basic_salary, allowances = 0, deductions = 0 } = req.body;

    // Calculate gross and net salary
    const grossSalary = parseFloat(basic_salary) + parseFloat(allowances);
    const netSalary = grossSalary - parseFloat(deductions);

    await db.execute(`
      UPDATE payroll SET 
      basic_salary = ?, allowances = ?, deductions = ?, 
      gross_salary = ?, net_salary = ?
      WHERE id = ?
    `, [basic_salary, allowances, deductions, grossSalary, netSalary, id]);

    res.json({ message: 'Payroll updated successfully' });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payroll (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM payroll WHERE id = ?', [id]);

    res.json({ message: 'Payroll deleted successfully' });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current salary structure for employee
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [payroll] = await db.execute(`
      SELECT * FROM payroll 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    if (payroll.length === 0) {
      return res.status(404).json({ message: 'No payroll information found' });
    }

    res.json(payroll[0]);
  } catch (error) {
    console.error('Get current payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;