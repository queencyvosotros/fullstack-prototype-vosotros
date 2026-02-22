let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
window.db = {};

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || '#/';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const route = hash.replace('#/', '') || 'home';
  const page = document.getElementById(`${route}-page`);

  const protectedRoutes = ['profile', 'requests'];
  const adminRoutes = ['employees', 'accounts', 'departments'];

  if (protectedRoutes.includes(route) && !currentUser) {
    return navigateTo('#/login');
  }

  if (adminRoutes.includes(route) && (!currentUser || currentUser.role !== 'admin')) {
    return navigateTo('#/');
  }

  if (page) page.classList.add('active');

  const routeRenderers = {
    'profile': renderProfile,
    'accounts': renderAccountsList,
    'departments': renderDepartments,
    'employees': renderEmployees,
    'requests': renderRequests,
    'register': renderRegister,
    'verify-email': renderVerifyEmail,
    'login': renderLogin
  };

  if (routeRenderers[route]) routeRenderers[route]();
}

window.addEventListener('hashchange', handleRouting);

function setAuthState(isAuth, user = null) {
  currentUser = user;

  if (isAuth && user) {
    document.body.classList.remove('not-authenticated');
    document.body.classList.add('authenticated');

    if (user.role === 'admin') document.body.classList.add('is-admin');
    else document.body.classList.remove('is-admin');

    document.getElementById('nav-username').textContent = user.firstName;
  } else {
    document.body.classList.remove('authenticated', 'is-admin');
    document.body.classList.add('not-authenticated');
    currentUser = null;
  }
}

function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        window.db = JSON.parse(stored);
    } else {
        
        window.db = {
            accounts: [{ email: 'admin@example.com', password: 'Password123!', role: 'admin', verified: true }],
            departments: [{ id: 1, name: 'Engineering' }, { id: 2, name: 'HR' }],
            employees: [],
            requests: []
        };
        saveToStorage();
    }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();

  const token = localStorage.getItem('auth_token');
  if (token) {
    const user = window.db.accounts.find(acc => acc.email === token);
    if (user) setAuthState(true, user);
  } else {
    setAuthState(false);
  }

  if (!window.location.hash) navigateTo('#/');
  handleRouting();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('auth_token');
      setAuthState(false);
      navigateTo('#/');
    });
  }
});


function renderProfile() {
  const page = document.getElementById('profile-page');
  page.innerHTML = `
    <h3>Profile</h3>
    <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
    <p><strong>Email:</strong> ${currentUser.email}</p>
    <p><strong>Role:</strong> ${currentUser.role}</p>
    <button class="btn btn-primary" onclick="alert('Edit coming soon')">Edit Profile</button>
  `;
}

function renderRegister() {
  const page = document.getElementById('register-page');
  page.innerHTML = `
    <h3>Register</h3>
    <form id="registerForm">
      <input class="form-control mb-2" placeholder="First Name" id="regFirst" required>
      <input class="form-control mb-2" placeholder="Last Name" id="regLast" required>
      <input type="email" class="form-control mb-2" placeholder="Email" id="regEmail" required>
      <input type="password" class="form-control mb-2" placeholder="Password (min 6 chars)" id="regPassword" required>
      <button class="btn btn-primary w-100">Register</button>
    </form>
  `;

  const form = document.getElementById('registerForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const firstName = regFirst.value.trim();
    const lastName = regLast.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();

    if (password.length < 6) return alert('Password must be at least 6 characters.');

    if (window.db.accounts.find(acc => acc.email === email)) {
      return alert('Email already exists.');
    }

    window.db.accounts.push({ firstName, lastName, email, password, role: 'user', verified: false });
    saveToStorage();
    localStorage.setItem('unverified_email', email);
    navigateTo('#/verify-email');
  });
}

function renderVerifyEmail() {
  const page = document.getElementById('verify-email-page');
  const email = localStorage.getItem('unverified_email');
  page.innerHTML = `
    <h3>Email Verification</h3>
    <p>Verification sent to <strong>${email}</strong></p>
    <button class="btn btn-success" id="verifyBtn">✅ Simulate Email Verification</button>
  `;

  document.getElementById('verifyBtn').addEventListener('click', () => {
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
      account.verified = true;
      saveToStorage();
      localStorage.removeItem('unverified_email');
      alert('Email Verified!');
      navigateTo('#/login');
    }
  });
}

function renderLogin() {
  const page = document.getElementById('login-page');
  page.innerHTML = `
    <h3>Login</h3>
    <form id="loginForm">
      <input type="email" class="form-control mb-2" placeholder="Email" id="loginEmail" required>
      <input type="password" class="form-control mb-2" placeholder="Password" id="loginPassword" required>
      <button class="btn btn-primary w-100">Login</button>
    </form>
  `;

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    const user = window.db.accounts.find(acc => acc.email === email && acc.password === password && acc.verified);
    if (!user) return alert('Invalid credentials or email not verified.');

    localStorage.setItem('auth_token', email);
    setAuthState(true, user);
    navigateTo('#/profile');
  });
}

function renderAccountsList() {
    const page = document.getElementById('accounts-page');
    let rows = window.db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td><span class="badge bg-secondary">${acc.role}</span></td>
            <td>${acc.verified ? '✔' : '—'}</td>
            <td>
                <button class="btn btn-sm btn-outline-warning" onclick="resetPassword('${acc.email}')">Reset PW</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${acc.email}')">Delete</button>
            </td>
        </tr>
    `).join('');

    page.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Accounts</h3>
            <button class="btn btn-primary" onclick="navigateTo('#/register')">+ Add Account</button>
        </div>
        <table class="table table-hover align-middle">
            <thead class="table-dark">
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5">No accounts found.</td></tr>'}</tbody>
        </table>
    `;
}

function resetPassword(email) {
    const newPw = prompt("Enter new password for " + email + ":");
    if (newPw && newPw.length >= 6) {
        const acc = window.db.accounts.find(a => a.email === email);
        if (acc) {
            acc.password = newPw;
            saveToStorage();
            alert("Password reset successfully!");
        }
    } else if (newPw) {
        alert("Password must be at least 6 characters.");
    }
}

function renderDepartments() {
  const page = document.getElementById('departments-page');
  let rows = window.db.departments.map(d => `
    <tr><td>${d.name}</td><td>${d.description}</td><td><button class="btn btn-sm btn-secondary" onclick="alert('Add/Edit not implemented')">Edit</button></td></tr>
  `).join('');

  page.innerHTML = `
    <h3>Departments</h3>
    <button class="btn btn-primary mb-2" onclick="alert('Add Department not implemented')">+ Add Department</button>
    <table class="table"><thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
  `;
}

function renderEmployees() {
  const page = document.getElementById('employees-page');
  let rows = window.db.employees.map(emp => `
    <tr>
      <td>${emp.id}</td>
      <td>${emp.userEmail}</td>
      <td>${emp.position}</td>
      <td>${getDepartmentName(emp.departmentId)}</td>
      <td>${emp.hireDate}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editEmployee('${emp.id}')">Edit</button>
      </td>
    </tr>
  `).join('');

  page.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3>Employees</h3>
      <button class="btn btn-primary" onclick="openEmployeeForm()">+ Add Employee</button>
    </div>
    <table class="table table-hover">
      <thead class="table-light">
        <tr><th>ID</th><th>User</th><th>Position</th><th>Dept</th><th>Hire Date</th><th>Actions</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6" class="text-center">No employees found.</td></tr>'}</tbody>
    </table>
  `;
}

function openEmployeeForm() {
    const deptSelect = document.getElementById('empDept');
    deptSelect.innerHTML = window.db.departments.map(d => 
        `<option value="${d.id}">${d.name}</option>`
    ).join('');

    document.getElementById('employeeForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    modal.show();
}

function getDepartmentName(id) {
  const dept = window.db.departments.find(d => d.id === id);
  return dept ? dept.name : '';
}

function deleteAccount(email) {
  if (!confirm('Are you sure?')) return;
  if (currentUser.email === email) return alert("Cannot delete yourself!");
  window.db.accounts = window.db.accounts.filter(acc => acc.email !== email);
  saveToStorage();
  renderAccountsList();
}

function renderRequests() {
  const page = document.getElementById('requests-page');
  const userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);

  let rows = userRequests.map(r => `
    <tr>
      <td>${r.type}</td>
      <td>${r.date}</td>
      <td><span class="badge ${r.status === 'Approved' ? 'bg-success' : r.status === 'Rejected' ? 'bg-danger' : 'bg-warning'}">${r.status}</span></td>
    </tr>
  `).join('');

  page.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3>My Requests</h3>
      <button class="btn btn-primary" onclick="openRequestModal()">+ New Request</button>
    </div>
    <table class="table"><thead><tr><th>Type</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="3" class="text-center">No requests yet.</td></tr>'}</tbody></table>
  `;
}

function openRequestModal() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';
  addItemField();
  const modal = new bootstrap.Modal(document.getElementById('requestModal'));
  modal.show();
}

function addItemField(name = '', qty = '') {
  const container = document.getElementById('itemsContainer');
  const div = document.createElement('div');
  div.classList.add('d-flex', 'mb-2');
  div.innerHTML = `
    <input class="form-control me-2 item-name" placeholder="Item Name" value="${name}" required>
    <input type="number" class="form-control me-2 item-qty" placeholder="Qty" value="${qty}" required>
    <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(div);
}

document.addEventListener('submit', function(e) {
  if (e.target.id === 'requestForm') {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('#itemsContainer .d-flex').forEach(row => {
      const name = row.querySelector('.item-name').value.trim();
      const qty = row.querySelector('.item-qty').value.trim();
      if (name && qty) items.push({ name, qty });
    });
    if (items.length === 0) return alert("Add at least one item.");

    window.db.requests.push({
      type: document.getElementById('requestType').value,
      items,
      status: 'Pending',
      date: new Date().toLocaleDateString(),
      employeeEmail: currentUser.email
    });
    saveToStorage();
    alert('Request Submitted!');
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    renderRequests();
  }
});

document.addEventListener('submit', function(e) {
    if (e.target.id === 'employeeForm') {
        e.preventDefault();

        const id = document.getElementById('empId').value.trim();
        const email = document.getElementById('empUserEmail').value.trim();
        const pos = document.getElementById('empPosition').value.trim();
        const deptId = parseInt(document.getElementById('empDept').value);
        const date = document.getElementById('empHireDate').value;

        const newEmp = {
            id: id,
            userEmail: email,
            position: pos,
            departmentId: deptId,
            hireDate: date
        };

        window.db.employees.push(newEmp);
        saveToStorage();

        const modalElement = document.getElementById('employeeModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }

        renderEmployees();
        alert("Employee added successfully!");
    }
});
