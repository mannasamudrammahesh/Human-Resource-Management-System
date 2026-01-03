// Global variables
let currentUser = null;
let authToken = null;

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                showDashboard();
                return;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    
    // Show login screen
    hideLoading();
    showLogin();
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.querySelector('.tab-btn.active').classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

function showLoginForm() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.tab-btn.active').classList.remove('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
}

// Authentication
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showToast('Login successful!', 'success');
            showDashboard();
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
});

document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        employee_id: document.getElementById('employeeId').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        role: document.getElementById('role').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Account created successfully! Please sign in.', 'success');
            showLoginForm();
        } else {
            showToast(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
});

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    
    // Update user info
    document.getElementById('userName').textContent = 
        `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email;
    
    // Setup sidebar menu
    setupSidebarMenu();
    
    // Load dashboard content
    loadDashboardContent();
}

function setupSidebarMenu() {
    const menu = document.getElementById('sidebarMenu');
    const isAdmin = ['admin', 'hr'].includes(currentUser.role);
    
    const menuItems = [
        { icon: 'fas fa-tachometer-alt', text: 'Dashboard', page: 'dashboard' },
        { icon: 'fas fa-user', text: 'Profile', page: 'profile' },
        { icon: 'fas fa-clock', text: 'Attendance', page: 'attendance' },
        { icon: 'fas fa-calendar-alt', text: 'Leave Requests', page: 'leave' },
        { icon: 'fas fa-money-bill-wave', text: 'Payroll', page: 'payroll' }
    ];
    
    if (isAdmin) {
        menuItems.push(
            { icon: 'fas fa-users', text: 'Employees', page: 'employees' },
            { icon: 'fas fa-chart-bar', text: 'Reports', page: 'reports' }
        );
    }
    
    menu.innerHTML = menuItems.map(item => `
        <li>
            <a href="#" onclick="navigateTo('${item.page}')" data-page="${item.page}">
                <i class="${item.icon}"></i>
                ${item.text}
            </a>
        </li>
    `).join('');
}

function navigateTo(page) {
    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Update page title
    const pageTitle = document.querySelector(`[data-page="${page}"]`).textContent.trim();
    document.getElementById('pageTitle').textContent = pageTitle;
    
    // Load page content
    switch(page) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'profile':
            loadProfileContent();
            break;
        case 'attendance':
            loadAttendanceContent();
            break;
        case 'leave':
            loadLeaveContent();
            break;
        case 'payroll':
            loadPayrollContent();
            break;
        case 'employees':
            loadEmployeesContent();
            break;
        case 'reports':
            loadReportsContent();
            break;
    }
}

async function loadDashboardContent() {
    const isAdmin = ['admin', 'hr'].includes(currentUser.role);
    
    if (isAdmin) {
        // Admin dashboard
        const content = `
            <div class="dashboard-grid">
                <div class="dashboard-card" onclick="navigateTo('employees')">
                    <div class="card-header">
                        <div class="card-icon primary">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <div class="card-title">Total Employees</div>
                        </div>
                    </div>
                    <div class="card-value" id="totalEmployees">-</div>
                    <div class="card-description">Active employees in system</div>
                </div>
                
                <div class="dashboard-card" onclick="navigateTo('attendance')">
                    <div class="card-header">
                        <div class="card-icon success">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div>
                            <div class="card-title">Present Today</div>
                        </div>
                    </div>
                    <div class="card-value" id="presentToday">-</div>
                    <div class="card-description">Employees present today</div>
                </div>
                
                <div class="dashboard-card" onclick="navigateTo('leave')">
                    <div class="card-header">
                        <div class="card-icon warning">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div>
                            <div class="card-title">Pending Leaves</div>
                        </div>
                    </div>
                    <div class="card-value" id="pendingLeaves">-</div>
                    <div class="card-description">Leave requests awaiting approval</div>
                </div>
                
                <div class="dashboard-card" onclick="navigateTo('payroll')">
                    <div class="card-header">
                        <div class="card-icon info">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div>
                            <div class="card-title">Payroll</div>
                        </div>
                    </div>
                    <div class="card-value">Active</div>
                    <div class="card-description">Payroll management</div>
                </div>
            </div>
            
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">Recent Activities</h3>
                </div>
                <div id="recentActivities">Loading...</div>
            </div>
        `;
        
        document.getElementById('content').innerHTML = content;
        loadAdminDashboardData();
    } else {
        // Employee dashboard
        const content = `
            <div class="checkin-container">
                <div class="checkin-time" id="currentTime"></div>
                <div class="checkin-date" id="currentDate"></div>
                <button class="btn btn-primary checkin-btn" id="checkinBtn" onclick="handleCheckin()">
                    <i class="fas fa-clock"></i> Check In
                </button>
                <div id="checkinStatus" class="mt-20"></div>
            </div>
            
            <div class="dashboard-grid">
                <div class="dashboard-card" onclick="navigateTo('profile')">
                    <div class="card-header">
                        <div class="card-icon primary">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <div class="card-title">My Profile</div>
                        </div>
                    </div>
                    <div class="card-description">View and edit your profile</div>
                </div>
                
                <div class="dashboard-card" onclick="navigateTo('attendance')">
                    <div class="card-header">
                        <div class="card-icon success">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div>
                            <div class="card-title">Attendance</div>
                        </div>
                    </div>
                    <div class="card-description">View your attendance records</div>
                </div>
                
                <div class="dashboard-card" onclick="navigateTo('leave')">
                    <div class="card-header">
                        <div class="card-icon warning">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div>
                            <div class="card-title">Leave Requests</div>
                        </div>
                    </div>
                    <div class="card-description">Apply for leave and view status</div>
                </div>
                
                <div class="dashboard-card" onclick="navigateTo('payroll')">
                    <div class="card-header">
                        <div class="card-icon info">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div>
                            <div class="card-title">Payroll</div>
                        </div>
                    </div>
                    <div class="card-description">View your salary information</div>
                </div>
            </div>
        `;
        
        document.getElementById('content').innerHTML = content;
        updateDateTime();
        setInterval(updateDateTime, 1000);
        loadTodayAttendance();
    }
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function loadTodayAttendance() {
    try {
        const response = await fetch(`${API_BASE}/attendance/today`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const btn = document.getElementById('checkinBtn');
            const status = document.getElementById('checkinStatus');
            
            if (data.status === 'not_checked_in') {
                btn.innerHTML = '<i class="fas fa-clock"></i> Check In';
                btn.onclick = () => handleCheckin('checkin');
            } else if (data.status === 'checked_in') {
                btn.innerHTML = '<i class="fas fa-clock"></i> Check Out';
                btn.onclick = () => handleCheckin('checkout');
                status.innerHTML = `<p>Checked in at: ${data.check_in}</p>`;
            } else if (data.status === 'completed') {
                btn.innerHTML = '<i class="fas fa-check"></i> Completed';
                btn.disabled = true;
                btn.classList.add('btn-success');
                status.innerHTML = `
                    <p>Checked in: ${data.check_in}</p>
                    <p>Checked out: ${data.check_out}</p>
                    <p>Hours worked: ${data.hours_worked}</p>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

async function handleCheckin() {
    try {
        const response = await fetch(`${API_BASE}/attendance/checkin`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message, 'success');
            loadTodayAttendance(); // Refresh status
        } else {
            showToast(data.message || 'Error processing request', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

async function loadAdminDashboardData() {
    try {
        // Load employees count
        const employeesResponse = await fetch(`${API_BASE}/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (employeesResponse.ok) {
            const employees = await employeesResponse.json();
            document.getElementById('totalEmployees').textContent = employees.length;
        }
        
        // Load today's attendance
        const attendanceResponse = await fetch(`${API_BASE}/attendance/all`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (attendanceResponse.ok) {
            const attendance = await attendanceResponse.json();
            const presentCount = attendance.filter(a => a.status === 'present').length;
            document.getElementById('presentToday').textContent = presentCount;
        }
        
        // Load pending leaves
        const leaveResponse = await fetch(`${API_BASE}/leave?status=pending`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (leaveResponse.ok) {
            const leaves = await leaveResponse.json();
            document.getElementById('pendingLeaves').textContent = leaves.length;
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Profile Management
async function loadProfileContent() {
    try {
        const response = await fetch(`${API_BASE}/employees/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const profile = await response.json();
            displayProfile(profile);
        } else {
            showToast('Error loading profile', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

function displayProfile(profile) {
    const canEdit = currentUser.role === 'admin' || currentUser.role === 'hr' || profile.id === currentUser.id;
    
    const content = `
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Employee Profile</h3>
                ${canEdit ? '<button class="btn btn-primary" onclick="editProfile()"><i class="fas fa-edit"></i> Edit Profile</button>' : ''}
            </div>
            <div class="modal-body">
                <div class="text-center mb-20">
                    ${profile.profile_picture ? 
                        `<img src="/uploads/${profile.profile_picture}" class="profile-picture" alt="Profile Picture">` :
                        '<div class="profile-picture" style="background: #667eea; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;"><i class="fas fa-user"></i></div>'
                    }
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" value="${profile.first_name || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" value="${profile.last_name || ''}" readonly>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Employee ID</label>
                        <input type="text" value="${profile.employee_id || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" value="${profile.email || ''}" readonly>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="text" value="${profile.phone || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" value="${profile.department || ''}" readonly>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Position</label>
                        <input type="text" value="${profile.position || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Hire Date</label>
                        <input type="date" value="${profile.hire_date ? profile.hire_date.split('T')[0] : ''}" readonly>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Address</label>
                    <textarea readonly>${profile.address || ''}</textarea>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
}

function editProfile() {
    // Implementation for profile editing modal
    showModal('Edit Profile', `
        <form id="editProfileForm">
            <div class="form-row">
                <div class="form-group">
                    <label for="editFirstName">First Name</label>
                    <input type="text" id="editFirstName" value="${currentUser.first_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="editLastName">Last Name</label>
                    <input type="text" id="editLastName" value="${currentUser.last_name || ''}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="editPhone">Phone</label>
                <input type="text" id="editPhone">
            </div>
            
            <div class="form-group">
                <label for="editAddress">Address</label>
                <textarea id="editAddress"></textarea>
            </div>
            
            <div class="form-group">
                <label for="editProfilePicture">Profile Picture</label>
                <input type="file" id="editProfilePicture" accept="image/*">
            </div>
            
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Save Changes
            </button>
        </form>
    `);
    
    document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('first_name', document.getElementById('editFirstName').value);
        formData.append('last_name', document.getElementById('editLastName').value);
        formData.append('phone', document.getElementById('editPhone').value);
        formData.append('address', document.getElementById('editAddress').value);
        
        const fileInput = document.getElementById('editProfilePicture');
        if (fileInput.files[0]) {
            formData.append('profile_picture', fileInput.files[0]);
        }
        
        try {
            const response = await fetch(`${API_BASE}/employees/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });
            
            if (response.ok) {
                showToast('Profile updated successfully!', 'success');
                closeModal();
                loadProfileContent();
            } else {
                const data = await response.json();
                showToast(data.message || 'Error updating profile', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });
}

// Utility functions
function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    showLogin();
    showToast('Logged out successfully', 'success');
}

// Close modal when clicking outside
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Initialize first menu item as active
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const firstMenuItem = document.querySelector('.sidebar-menu a');
        if (firstMenuItem) {
            firstMenuItem.classList.add('active');
        }
    }, 100);
});

// Attendance Management
async function loadAttendanceContent() {
    const isAdmin = ['admin', 'hr'].includes(currentUser.role);
    
    const content = `
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Attendance Records</h3>
                <div>
                    ${isAdmin ? '<select id="employeeFilter" onchange="filterAttendance()"><option value="">All Employees</option></select>' : ''}
                    <input type="date" id="startDate" onchange="filterAttendance()">
                    <input type="date" id="endDate" onchange="filterAttendance()">
                    <button class="btn btn-primary btn-sm" onclick="filterAttendance()">
                        <i class="fas fa-filter"></i> Filter
                    </button>
                </div>
            </div>
            <div id="attendanceTable">Loading...</div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    
    if (isAdmin) {
        await loadEmployeeFilter();
    }
    
    loadAttendanceData();
}

async function loadEmployeeFilter() {
    try {
        const response = await fetch(`${API_BASE}/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const employees = await response.json();
            const select = document.getElementById('employeeFilter');
            
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.first_name} ${emp.last_name} (${emp.employee_id})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function loadAttendanceData() {
    try {
        const params = new URLSearchParams();
        
        const employeeId = document.getElementById('employeeFilter')?.value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (employeeId) params.append('user_id', employeeId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const url = ['admin', 'hr'].includes(currentUser.role) && !employeeId ? 
            `${API_BASE}/attendance/all?${params}` : 
            `${API_BASE}/attendance?${params}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const attendance = await response.json();
            displayAttendanceTable(attendance);
        } else {
            showToast('Error loading attendance data', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

function displayAttendanceTable(attendance) {
    const isAdmin = ['admin', 'hr'].includes(currentUser.role);
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    ${isAdmin ? '<th>Employee</th>' : ''}
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    ${isAdmin ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${attendance.map(record => `
                    <tr>
                        ${isAdmin ? `<td>${record.first_name} ${record.last_name}</td>` : ''}
                        <td>${new Date(record.date).toLocaleDateString()}</td>
                        <td>${record.check_in || '-'}</td>
                        <td>${record.check_out || '-'}</td>
                        <td>${record.hours_worked || '-'}</td>
                        <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                        <td>${record.remarks || '-'}</td>
                        ${isAdmin ? `<td>
                            <button class="btn btn-sm btn-primary" onclick="editAttendance(${record.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>` : ''}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('attendanceTable').innerHTML = tableHTML;
}

function filterAttendance() {
    loadAttendanceData();
}

// Leave Management
async function loadLeaveContent() {
    const isAdmin = ['admin', 'hr'].includes(currentUser.role);
    
    const content = `
        <div class="leave-balance-grid">
            <div class="leave-balance-card">
                <div class="leave-type">Paid Leave</div>
                <div class="leave-remaining" id="paidLeaveRemaining">-</div>
                <div class="leave-total">of <span id="paidLeaveTotal">-</span> days</div>
            </div>
            <div class="leave-balance-card">
                <div class="leave-type">Sick Leave</div>
                <div class="leave-remaining" id="sickLeaveRemaining">-</div>
                <div class="leave-total">of <span id="sickLeaveTotal">-</span> days</div>
            </div>
            <div class="leave-balance-card">
                <div class="leave-type">Casual Leave</div>
                <div class="leave-remaining" id="casualLeaveRemaining">-</div>
                <div class="leave-total">of <span id="casualLeaveTotal">-</span> days</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Leave Requests</h3>
                <div>
                    ${isAdmin ? '<select id="leaveEmployeeFilter" onchange="filterLeaveRequests()"><option value="">All Employees</option></select>' : ''}
                    <select id="leaveStatusFilter" onchange="filterLeaveRequests()">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button class="btn btn-primary btn-sm" onclick="applyForLeave()">
                        <i class="fas fa-plus"></i> Apply Leave
                    </button>
                </div>
            </div>
            <div id="leaveRequestsTable">Loading...</div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    
    if (isAdmin) {
        await loadEmployeeFilterForLeave();
    }
    
    loadLeaveBalance();
    loadLeaveRequests();
}

async function loadEmployeeFilterForLeave() {
    try {
        const response = await fetch(`${API_BASE}/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const employees = await response.json();
            const select = document.getElementById('leaveEmployeeFilter');
            
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.first_name} ${emp.last_name} (${emp.employee_id})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function loadLeaveBalance() {
    try {
        const response = await fetch(`${API_BASE}/leave/balance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const balance = await response.json();
            
            document.getElementById('paidLeaveRemaining').textContent = balance.paid.remaining;
            document.getElementById('paidLeaveTotal').textContent = balance.paid.total;
            document.getElementById('sickLeaveRemaining').textContent = balance.sick.remaining;
            document.getElementById('sickLeaveTotal').textContent = balance.sick.total;
            document.getElementById('casualLeaveRemaining').textContent = balance.casual.remaining;
            document.getElementById('casualLeaveTotal').textContent = balance.casual.total;
        }
    } catch (error) {
        console.error('Error loading leave balance:', error);
    }
}

async function loadLeaveRequests() {
    try {
        const params = new URLSearchParams();
        
        const employeeId = document.getElementById('leaveEmployeeFilter')?.value;
        const status = document.getElementById('leaveStatusFilter').value;
        
        if (employeeId) params.append('user_id', employeeId);
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE}/leave?${params}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const requests = await response.json();
            displayLeaveRequestsTable(requests);
        } else {
            showToast('Error loading leave requests', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

function displayLeaveRequestsTable(requests) {
    const isAdmin = ['admin', 'hr'].includes(currentUser.role);
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    ${isAdmin ? '<th>Employee</th>' : ''}
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    ${isAdmin ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${requests.map(request => `
                    <tr>
                        ${isAdmin ? `<td>${request.first_name} ${request.last_name}</td>` : ''}
                        <td>${request.leave_type.toUpperCase()}</td>
                        <td>${new Date(request.start_date).toLocaleDateString()}</td>
                        <td>${new Date(request.end_date).toLocaleDateString()}</td>
                        <td>${request.days_requested}</td>
                        <td>${request.reason}</td>
                        <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                        <td>${new Date(request.created_at).toLocaleDateString()}</td>
                        ${isAdmin && request.status === 'pending' ? `<td>
                            <button class="btn btn-sm btn-success" onclick="approveLeave(${request.id})">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="rejectLeave(${request.id})">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>` : '<td>-</td>'}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('leaveRequestsTable').innerHTML = tableHTML;
}

function filterLeaveRequests() {
    loadLeaveRequests();
}

function applyForLeave() {
    showModal('Apply for Leave', `
        <form id="applyLeaveForm">
            <div class="form-group">
                <label for="leaveType">Leave Type</label>
                <select id="leaveType" required>
                    <option value="">Select Leave Type</option>
                    <option value="paid">Paid Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="leaveStartDate">Start Date</label>
                    <input type="date" id="leaveStartDate" required>
                </div>
                <div class="form-group">
                    <label for="leaveEndDate">End Date</label>
                    <input type="date" id="leaveEndDate" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="leaveReason">Reason</label>
                <textarea id="leaveReason" required placeholder="Please provide reason for leave"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-paper-plane"></i> Submit Request
            </button>
        </form>
    `);
    
    document.getElementById('applyLeaveForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            leave_type: document.getElementById('leaveType').value,
            start_date: document.getElementById('leaveStartDate').value,
            end_date: document.getElementById('leaveEndDate').value,
            reason: document.getElementById('leaveReason').value
        };
        
        try {
            const response = await fetch(`${API_BASE}/leave/apply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Leave request submitted successfully!', 'success');
                closeModal();
                loadLeaveRequests();
                loadLeaveBalance();
            } else {
                showToast(data.message || 'Error submitting leave request', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });
}

async function approveLeave(requestId) {
    const comments = prompt('Add comments (optional):');
    
    try {
        const response = await fetch(`${API_BASE}/leave/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                admin_comments: comments
            })
        });
        
        if (response.ok) {
            showToast('Leave request approved!', 'success');
            loadLeaveRequests();
        } else {
            const data = await response.json();
            showToast(data.message || 'Error approving leave', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

async function rejectLeave(requestId) {
    const comments = prompt('Add rejection reason:');
    if (!comments) return;
    
    try {
        const response = await fetch(`${API_BASE}/leave/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                admin_comments: comments
            })
        });
        
        if (response.ok) {
            showToast('Leave request rejected!', 'success');
            loadLeaveRequests();
        } else {
            const data = await response.json();
            showToast(data.message || 'Error rejecting leave', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

// Payroll Management
async function loadPayrollContent() {
    const isAdmin = ['admin', 'hr'].includes(currentUser.role);
    
    const content = `
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Payroll Information</h3>
                ${isAdmin ? `
                    <div>
                        <select id="payrollEmployeeFilter" onchange="filterPayroll()">
                            <option value="">All Employees</option>
                        </select>
                        <button class="btn btn-primary btn-sm" onclick="addPayroll()">
                            <i class="fas fa-plus"></i> Add Payroll
                        </button>
                    </div>
                ` : ''}
            </div>
            <div id="payrollTable">Loading...</div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    
    if (isAdmin) {
        await loadEmployeeFilterForPayroll();
        loadAllPayroll();
    } else {
        loadEmployeePayroll();
    }
}

async function loadEmployeeFilterForPayroll() {
    try {
        const response = await fetch(`${API_BASE}/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const employees = await response.json();
            const select = document.getElementById('payrollEmployeeFilter');
            
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.first_name} ${emp.last_name} (${emp.employee_id})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function loadEmployeePayroll() {
    try {
        const response = await fetch(`${API_BASE}/payroll`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const payroll = await response.json();
            displayPayrollTable(payroll, false);
        } else {
            showToast('Error loading payroll data', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

async function loadAllPayroll() {
    try {
        const params = new URLSearchParams();
        const employeeId = document.getElementById('payrollEmployeeFilter')?.value;
        
        if (employeeId) params.append('user_id', employeeId);
        
        const url = employeeId ? 
            `${API_BASE}/payroll?${params}` : 
            `${API_BASE}/payroll/all`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const payroll = await response.json();
            displayPayrollTable(payroll, true);
        } else {
            showToast('Error loading payroll data', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

function displayPayrollTable(payroll, isAdmin) {
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    ${isAdmin ? '<th>Employee</th>' : ''}
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Gross Salary</th>
                    <th>Net Salary</th>
                    <th>Pay Period</th>
                    ${isAdmin ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
                ${payroll.map(record => `
                    <tr>
                        ${isAdmin ? `<td>${record.first_name} ${record.last_name}</td>` : ''}
                        <td>$${parseFloat(record.basic_salary).toFixed(2)}</td>
                        <td>$${parseFloat(record.allowances).toFixed(2)}</td>
                        <td>$${parseFloat(record.deductions).toFixed(2)}</td>
                        <td>$${parseFloat(record.gross_salary).toFixed(2)}</td>
                        <td><strong>$${parseFloat(record.net_salary).toFixed(2)}</strong></td>
                        <td>${new Date(record.pay_period_start).toLocaleDateString()} - ${new Date(record.pay_period_end).toLocaleDateString()}</td>
                        ${isAdmin ? `<td>
                            <button class="btn btn-sm btn-primary" onclick="editPayroll(${record.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>` : ''}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('payrollTable').innerHTML = tableHTML;
}

function filterPayroll() {
    loadAllPayroll();
}

function addPayroll() {
    showModal('Add Payroll', `
        <form id="addPayrollForm">
            <div class="form-group">
                <label for="payrollEmployee">Employee</label>
                <select id="payrollEmployee" required>
                    <option value="">Select Employee</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="basicSalary">Basic Salary</label>
                    <input type="number" id="basicSalary" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="allowances">Allowances</label>
                    <input type="number" id="allowances" step="0.01" value="0">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="deductions">Deductions</label>
                    <input type="number" id="deductions" step="0.01" value="0">
                </div>
                <div class="form-group">
                    <label>Net Salary</label>
                    <input type="text" id="netSalaryDisplay" readonly>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="payPeriodStart">Pay Period Start</label>
                    <input type="date" id="payPeriodStart" required>
                </div>
                <div class="form-group">
                    <label for="payPeriodEnd">Pay Period End</label>
                    <input type="date" id="payPeriodEnd" required>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Save Payroll
            </button>
        </form>
    `);
    
    // Load employees for payroll
    loadEmployeesForPayroll();
    
    // Calculate net salary on input change
    ['basicSalary', 'allowances', 'deductions'].forEach(id => {
        document.getElementById(id).addEventListener('input', calculateNetSalary);
    });
    
    document.getElementById('addPayrollForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            user_id: document.getElementById('payrollEmployee').value,
            basic_salary: document.getElementById('basicSalary').value,
            allowances: document.getElementById('allowances').value,
            deductions: document.getElementById('deductions').value,
            pay_period_start: document.getElementById('payPeriodStart').value,
            pay_period_end: document.getElementById('payPeriodEnd').value
        };
        
        try {
            const response = await fetch(`${API_BASE}/payroll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Payroll added successfully!', 'success');
                closeModal();
                loadAllPayroll();
            } else {
                showToast(data.message || 'Error adding payroll', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });
}

async function loadEmployeesForPayroll() {
    try {
        const response = await fetch(`${API_BASE}/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const employees = await response.json();
            const select = document.getElementById('payrollEmployee');
            
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.first_name} ${emp.last_name} (${emp.employee_id})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function calculateNetSalary() {
    const basic = parseFloat(document.getElementById('basicSalary').value) || 0;
    const allowances = parseFloat(document.getElementById('allowances').value) || 0;
    const deductions = parseFloat(document.getElementById('deductions').value) || 0;
    
    const netSalary = basic + allowances - deductions;
    document.getElementById('netSalaryDisplay').value = `$${netSalary.toFixed(2)}`;
}

// Employee Management (Admin only)
async function loadEmployeesContent() {
    const content = `
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Employee Management</h3>
                <button class="btn btn-primary" onclick="addEmployee()">
                    <i class="fas fa-user-plus"></i> Add Employee
                </button>
            </div>
            <div id="employeesTable">Loading...</div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
    loadEmployeesData();
}

async function loadEmployeesData() {
    try {
        const response = await fetch(`${API_BASE}/employees`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const employees = await response.json();
            displayEmployeesTable(employees);
        } else {
            showToast('Error loading employees', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

function displayEmployeesTable(employees) {
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Role</th>
                    <th>Hire Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${employees.map(emp => `
                    <tr>
                        <td>${emp.employee_id}</td>
                        <td>${emp.first_name} ${emp.last_name}</td>
                        <td>${emp.email}</td>
                        <td>${emp.department || '-'}</td>
                        <td>${emp.position || '-'}</td>
                        <td><span class="status-badge status-${emp.role}">${emp.role}</span></td>
                        <td>${emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewEmployee(${emp.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editEmployee(${emp.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('employeesTable').innerHTML = tableHTML;
}

// Reports (Admin only)
async function loadReportsContent() {
    const content = `
        <div class="dashboard-grid">
            <div class="dashboard-card" onclick="generateAttendanceReport()">
                <div class="card-header">
                    <div class="card-icon primary">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <div class="card-title">Attendance Report</div>
                    </div>
                </div>
                <div class="card-description">Generate monthly attendance reports</div>
            </div>
            
            <div class="dashboard-card" onclick="generateLeaveReport()">
                <div class="card-header">
                    <div class="card-icon success">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div>
                        <div class="card-title">Leave Report</div>
                    </div>
                </div>
                <div class="card-description">Generate leave utilization reports</div>
            </div>
            
            <div class="dashboard-card" onclick="generatePayrollReport()">
                <div class="card-header">
                    <div class="card-icon warning">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </div>
                    <div>
                        <div class="card-title">Payroll Report</div>
                    </div>
                </div>
                <div class="card-description">Generate salary and payroll reports</div>
            </div>
            
            <div class="dashboard-card" onclick="generateEmployeeReport()">
                <div class="card-header">
                    <div class="card-icon info">
                        <i class="fas fa-users"></i>
                    </div>
                    <div>
                        <div class="card-title">Employee Report</div>
                    </div>
                </div>
                <div class="card-description">Generate employee statistics</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h3 class="table-title">Report History</h3>
            </div>
            <div class="modal-body">
                <p>Report generation and history features will be available in future updates.</p>
            </div>
        </div>
    `;
    
    document.getElementById('content').innerHTML = content;
}

function generateAttendanceReport() {
    showToast('Attendance report generation coming soon!', 'info');
}

function generateLeaveReport() {
    showToast('Leave report generation coming soon!', 'info');
}

function generatePayrollReport() {
    showToast('Payroll report generation coming soon!', 'info');
}

function generateEmployeeReport() {
    showToast('Employee report generation coming soon!', 'info');
}