const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all employees (Admin/HR only)
router.get('/', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const [employees] = await db.execute(`
      SELECT u.id, u.employee_id, u.email, u.role, u.created_at,
             ep.first_name, ep.last_name, ep.phone, ep.department, ep.position, ep.hire_date
      FROM users u 
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
      ORDER BY ep.first_name, ep.last_name
    `);

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee profile
router.get('/profile/:id?', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.params.id || req.user.id;
    
    // Check if user can access this profile
    if (employeeId != req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [profiles] = await db.execute(`
      SELECT u.id, u.employee_id, u.email, u.role, u.created_at,
             ep.first_name, ep.last_name, ep.phone, ep.address, ep.date_of_birth,
             ep.hire_date, ep.department, ep.position, ep.profile_picture, ep.documents
      FROM users u 
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
      WHERE u.id = ?
    `, [employeeId]);

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee profile
router.put('/profile/:id?', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    const employeeId = req.params.id || req.user.id;
    const { first_name, last_name, phone, address, date_of_birth, department, position } = req.body;
    
    // Check permissions
    const canEditAll = ['admin', 'hr'].includes(req.user.role);
    const isOwnProfile = employeeId == req.user.id;
    
    if (!canEditAll && !isOwnProfile) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let updateFields = [];
    let updateValues = [];

    // Fields that employees can edit
    if (first_name) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }

    // Fields only admin/HR can edit
    if (canEditAll) {
      if (date_of_birth) {
        updateFields.push('date_of_birth = ?');
        updateValues.push(date_of_birth);
      }
      if (department) {
        updateFields.push('department = ?');
        updateValues.push(department);
      }
      if (position) {
        updateFields.push('position = ?');
        updateValues.push(position);
      }
    }

    if (req.file) {
      updateFields.push('profile_picture = ?');
      updateValues.push(req.file.filename);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(employeeId);

    await db.execute(
      `UPDATE employee_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;