# Human Resource Management System (HRMS)

A comprehensive web-based Human Resource Management System built with Node.js, Express, MySQL, and vanilla JavaScript.

## Features

### Authentication & Authorization
- ✅ User registration and login
- ✅ Role-based access control (Admin, HR, Employee)
- ✅ JWT-based authentication
- ✅ Password security validation

### Employee Management
- ✅ Employee profile management
- ✅ Profile picture upload
- ✅ Personal and job information
- ✅ Admin can manage all employee details

### Attendance Management
- ✅ Daily check-in/check-out system
- ✅ Real-time attendance tracking
- ✅ Weekly and monthly attendance views
- ✅ Admin can view all employee attendance
- ✅ Manual attendance correction by admin

### Leave Management
- ✅ Leave application system
- ✅ Multiple leave types (Paid, Sick, Casual, Unpaid)
- ✅ Leave balance tracking
- ✅ Admin approval workflow
- ✅ Leave status tracking (Pending, Approved, Rejected)

### Payroll Management
- ✅ Salary structure management
- ✅ Basic salary, allowances, and deductions
- ✅ Automatic gross and net salary calculation
- ✅ Employee can view salary information (read-only)
- ✅ Admin can manage all payroll data

### Dashboard & Reports
- ✅ Role-based dashboards
- ✅ Real-time statistics
- ✅ Modern, responsive UI
- ✅ Mobile-friendly design

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern design
- **Vanilla JavaScript** - Functionality
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## Prerequisites

Before running this application, make sure you have the following installed:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/

2. **MySQL** (v8.0 or higher)
   - Download from: https://dev.mysql.com/downloads/mysql/

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## Installation & Setup

### 1. Clone or Download the Project
```bash
git clone <repository-url>
cd hrms-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Create MySQL Database
1. Open MySQL Command Line or MySQL Workbench
2. Run the following commands:
```sql
CREATE DATABASE hrms_db;
USE hrms_db;
```

3. Import the database schema:
```bash
mysql -u root -p hrms_db < config/init-db.sql
```

Or copy and paste the contents of `config/init-db.sql` into your MySQL client.

### 4. Environment Configuration

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Edit the `.env` file with your configuration:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hrms_db
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Important:** 
- Replace `your_mysql_password` with your actual MySQL password
- Generate a strong JWT secret (at least 32 characters)
- Email configuration is optional for now

### 5. Start the Application

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The application will be available at: http://localhost:3000

## Default Admin Account

The system comes with a pre-configured admin account:

- **Email:** admin@hrms.com
- **Password:** password
- **Role:** Admin

**Important:** Change the admin password immediately after first login!

## Usage Guide

### For Employees:
1. **Sign Up:** Register with your employee ID and email
2. **Dashboard:** View quick access to all features
3. **Check-in/Out:** Use the attendance system daily
4. **Profile:** Update your personal information
5. **Leave Requests:** Apply for leave and track status
6. **Payroll:** View your salary information

### For Admin/HR:
1. **Employee Management:** Add, edit, and manage employee profiles
2. **Attendance Oversight:** Monitor all employee attendance
3. **Leave Approval:** Review and approve/reject leave requests
4. **Payroll Management:** Set up and manage employee salaries
5. **Reports:** Generate various HR reports (coming soon)

## File Structure

```
hrms-system/
├── client/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── script.js          # JavaScript functionality
├── config/                # Configuration files
│   ├── database.js        # Database connection
│   └── init-db.sql        # Database schema
├── middleware/            # Express middleware
│   └── auth.js           # Authentication middleware
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── employees.js     # Employee management
│   ├── attendance.js    # Attendance management
│   ├── leave.js         # Leave management
│   └── payroll.js       # Payroll management
├── uploads/             # File upload directory
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
├── .env.example         # Environment template
└── README.md           # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees (Admin only)
- `GET /api/employees/profile/:id?` - Get employee profile
- `PUT /api/employees/profile/:id?` - Update employee profile

### Attendance
- `POST /api/attendance/checkin` - Check in/out
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/all` - Get all attendance (Admin only)
- `GET /api/attendance/today` - Get today's attendance status

### Leave Management
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave` - Get leave requests
- `PUT /api/leave/:id/status` - Approve/reject leave (Admin only)
- `GET /api/leave/balance` - Get leave balance

### Payroll
- `GET /api/payroll` - Get payroll information
- `POST /api/payroll` - Create payroll (Admin only)
- `PUT /api/payroll/:id` - Update payroll (Admin only)

## Deployment

### Local Deployment
The application is ready to run locally following the setup instructions above.

### Production Deployment

#### Option 1: Traditional Server
1. Set up a Linux server (Ubuntu/CentOS)
2. Install Node.js, MySQL, and PM2
3. Clone the repository
4. Configure environment variables
5. Set up MySQL database
6. Use PM2 to run the application:
```bash
npm install -g pm2
pm2 start server.js --name "hrms"
pm2 startup
pm2 save
```

#### Option 2: Cloud Platforms
- **Heroku:** Use Heroku MySQL addon
- **AWS:** Use EC2 + RDS
- **DigitalOcean:** Use Droplet + Managed Database
- **Railway:** Simple deployment with MySQL

### Environment Variables for Production
```env
NODE_ENV=production
PORT=80
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=hrms_db
JWT_SECRET=your_super_secure_jwt_secret
```

## Security Considerations

1. **Change Default Passwords:** Update the default admin password
2. **JWT Secret:** Use a strong, unique JWT secret
3. **Database Security:** Use strong database passwords
4. **HTTPS:** Enable HTTPS in production
5. **File Uploads:** Validate file types and sizes
6. **Input Validation:** All inputs are validated server-side

## Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Check MySQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use:**
   - Change PORT in `.env` file
   - Kill existing processes on port 3000

3. **File Upload Issues:**
   - Check `uploads/` directory exists
   - Verify file permissions

4. **Authentication Issues:**
   - Clear browser localStorage
   - Check JWT_SECRET in `.env`

### Getting Help:
- Check the browser console for errors
- Review server logs in terminal
- Verify all environment variables are set correctly

## Future Enhancements

- 📧 Email notifications for leave approvals
- 📊 Advanced reporting and analytics
- 📱 Mobile app
- 🔔 Real-time notifications
- 📄 Document management
- 🎯 Performance reviews
- 📈 HR analytics dashboard
- 🔄 Backup and restore functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Happy HR Management! 🎉**