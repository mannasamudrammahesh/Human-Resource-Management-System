const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Check in/out
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    // Check if already checked in today
    const [existing] = await db.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (existing.length > 0) {
      if (existing[0].check_in && !existing[0].check_out) {
        // Check out
        const checkInTime = new Date(`${today} ${existing[0].check_in}`);
        const checkOutTime = new Date(`${today} ${currentTime}`);
        const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);

        await db.execute(
          'UPDATE attendance SET check_out = ?, hours_worked = ?, status = ? WHERE id = ?',
          [currentTime, hoursWorked.toFixed(2), 'present', existing[0].id]
        );

        res.json({ message: 'Checked out successfully', type: 'checkout', time: currentTime });
      } else {
        res.status(400).json({ message: 'Already completed attendance for today' });
      }
    } else {
      // Check in
      await db.execute(
        'INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, ?)',
        [userId, today, currentTime, 'present']
      );

      res.json({ message: 'Checked in successfully', type: 'checkin', time: currentTime });
    }
  } catch (error) {
    console.error('Check in/out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;
    const targetUserId = user_id || req.user.id;

    // Check permissions
    if (targetUserId != req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = `
      SELECT a.*, u.employee_id, ep.first_name, ep.last_name 
      FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
      WHERE a.user_id = ?
    `;
    let params = [targetUserId];

    if (start_date && end_date) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY a.date DESC';

    const [attendance] = await db.execute(query, params);
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all employees attendance (Admin/HR only)
router.get('/all', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [attendance] = await db.execute(`
      SELECT a.*, u.employee_id, ep.first_name, ep.last_name, ep.department 
      FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
      WHERE a.date = ?
      ORDER BY ep.first_name, ep.last_name
    `, [targetDate]);

    res.json(attendance);
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance (Admin/HR only)
router.put('/:id', authenticateToken, requireRole(['admin', 'hr']), [
  body('status').isIn(['present', 'absent', 'half_day', 'leave']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, check_in, check_out, hours_worked, remarks } = req.body;

    await db.execute(
      'UPDATE attendance SET status = ?, check_in = ?, check_out = ?, hours_worked = ?, remarks = ? WHERE id = ?',
      [status, check_in, check_out, hours_worked, remarks, id]
    );

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's attendance status
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [attendance] = await db.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (attendance.length === 0) {
      res.json({ status: 'not_checked_in', canCheckIn: true });
    } else {
      const record = attendance[0];
      if (record.check_in && !record.check_out) {
        res.json({ 
          status: 'checked_in', 
          canCheckOut: true, 
          check_in: record.check_in 
        });
      } else if (record.check_in && record.check_out) {
        res.json({ 
          status: 'completed', 
          check_in: record.check_in, 
          check_out: record.check_out,
          hours_worked: record.hours_worked 
        });
      }
    }
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;