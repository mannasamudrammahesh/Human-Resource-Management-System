const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply for leave
router.post('/apply', authenticateToken, [
  body('leave_type').isIn(['paid', 'sick', 'unpaid', 'casual']).withMessage('Invalid leave type'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leave_type, start_date, end_date, reason } = req.body;
    const userId = req.user.id;

    // Calculate days requested
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (daysRequested <= 0) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check for overlapping leave requests
    const [overlapping] = await db.execute(`
      SELECT id FROM leave_requests 
      WHERE user_id = ? AND status != 'rejected' 
      AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))
    `, [userId, start_date, start_date, end_date, end_date]);

    if (overlapping.length > 0) {
      return res.status(400).json({ message: 'You have overlapping leave requests' });
    }

    await db.execute(
      'INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_requested, reason) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, leave_type, start_date, end_date, daysRequested, reason]
    );

    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let query = `
      SELECT lr.*, u.employee_id, ep.first_name, ep.last_name, ep.department,
             approver.employee_id as approver_employee_id,
             approver_profile.first_name as approver_first_name,
             approver_profile.last_name as approver_last_name
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      LEFT JOIN employee_profiles approver_profile ON approver.id = approver_profile.user_id
    `;
    let params = [];

    // If not admin/hr, only show own requests
    if (!['admin', 'hr'].includes(req.user.role)) {
      query += ' WHERE lr.user_id = ?';
      params.push(req.user.id);
    } else {
      // Admin/HR can filter by user_id
      if (user_id) {
        query += ' WHERE lr.user_id = ?';
        params.push(user_id);
      } else {
        query += ' WHERE 1=1';
      }
    }

    if (status) {
      query += params.length > 0 ? ' AND lr.status = ?' : ' WHERE lr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY lr.created_at DESC';

    const [requests] = await db.execute(query, params);
    res.json(requests);
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject leave request (Admin/HR only)
router.put('/:id/status', authenticateToken, requireRole(['admin', 'hr']), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('admin_comments').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, admin_comments } = req.body;
    const approvedBy = req.user.id;

    // Get leave request details
    const [leaveRequests] = await db.execute(
      'SELECT * FROM leave_requests WHERE id = ?',
      [id]
    );

    if (leaveRequests.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leaveRequest = leaveRequests[0];

    // Update leave request
    await db.execute(
      'UPDATE leave_requests SET status = ?, approved_by = ?, admin_comments = ? WHERE id = ?',
      [status, approvedBy, admin_comments, id]
    );

    // If approved, create attendance records for leave days
    if (status === 'approved') {
      const startDate = new Date(leaveRequest.start_date);
      const endDate = new Date(leaveRequest.end_date);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if attendance record already exists
        const [existing] = await db.execute(
          'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
          [leaveRequest.user_id, dateStr]
        );

        if (existing.length === 0) {
          await db.execute(
            'INSERT INTO attendance (user_id, date, status, remarks) VALUES (?, ?, ?, ?)',
            [leaveRequest.user_id, dateStr, 'leave', `${leaveRequest.leave_type} leave`]
          );
        } else {
          await db.execute(
            'UPDATE attendance SET status = ?, remarks = ? WHERE user_id = ? AND date = ?',
            ['leave', `${leaveRequest.leave_type} leave`, leaveRequest.user_id, dateStr]
          );
        }
      }
    }

    res.json({ message: `Leave request ${status} successfully` });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave balance (simplified - you can enhance this)
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const [approvedLeaves] = await db.execute(`
      SELECT leave_type, SUM(days_requested) as days_taken 
      FROM leave_requests 
      WHERE user_id = ? AND status = 'approved' AND YEAR(start_date) = ?
      GROUP BY leave_type
    `, [userId, currentYear]);

    // Default leave balances (you can make this configurable)
    const defaultBalances = {
      paid: 21,
      sick: 10,
      casual: 12,
      unpaid: 365 // No limit for unpaid
    };

    const balances = {};
    Object.keys(defaultBalances).forEach(type => {
      const taken = approvedLeaves.find(l => l.leave_type === type)?.days_taken || 0;
      balances[type] = {
        total: defaultBalances[type],
        taken: parseInt(taken),
        remaining: defaultBalances[type] - parseInt(taken)
      };
    });

    res.json(balances);
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;