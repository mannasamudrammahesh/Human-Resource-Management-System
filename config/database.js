const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create SQLite database
const dbPath = path.join(__dirname, '..', 'hrms.db');
const db = new sqlite3.Database(dbPath);

// Promisify SQLite operations
const promiseDb = {
  execute: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows]);
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
        });
      }
    });
  }
};

// Initialize database tables
const initDb = () => {
  const schema = `
    -- Users table for authentication
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'employee' CHECK(role IN ('employee', 'admin', 'hr')),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Employee profiles table
    CREATE TABLE IF NOT EXISTS employee_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        date_of_birth DATE,
        hire_date DATE,
        department TEXT,
        position TEXT,
        profile_picture TEXT,
        documents TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Attendance table
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status TEXT DEFAULT 'absent' CHECK(status IN ('present', 'absent', 'half_day', 'leave')),
        hours_worked REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
    );

    -- Leave requests table
    CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        leave_type TEXT NOT NULL CHECK(leave_type IN ('paid', 'sick', 'unpaid', 'casual')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_requested INTEGER NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER,
        admin_comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Payroll table
    CREATE TABLE IF NOT EXISTS payroll (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        basic_salary REAL NOT NULL,
        allowances REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        gross_salary REAL NOT NULL,
        net_salary REAL NOT NULL,
        pay_period_start DATE,
        pay_period_end DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  // Split and execute each CREATE TABLE statement
  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  statements.forEach(stmt => {
    if (stmt.trim()) {
      db.run(stmt, (err) => {
        if (err) console.error('Error creating table:', err);
      });
    }
  });

  // Insert default admin user (password: 'password')
  const adminCheck = `SELECT id FROM users WHERE employee_id = 'ADMIN001'`;
  db.get(adminCheck, (err, row) => {
    if (!row) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('password', 10);
      
      const insertAdmin = `INSERT INTO users (employee_id, email, password, role, is_verified) 
                          VALUES ('ADMIN001', 'admin@hrms.com', ?, 'admin', 1)`;
      
      db.run(insertAdmin, [hashedPassword], function(err) {
        if (!err) {
          const insertProfile = `INSERT INTO employee_profiles (user_id, first_name, last_name, department, position, hire_date)
                                VALUES (?, 'System', 'Administrator', 'IT', 'System Admin', date('now'))`;
          db.run(insertProfile, [this.lastID]);
          console.log('Default admin user created: admin@hrms.com / password');
        }
      });
    }
  });
};

// Initialize database on startup
initDb();

module.exports = promiseDb;