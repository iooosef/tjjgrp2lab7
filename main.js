// Placeholder for main JS logic
// - Modal open hooks (Bootstrap handles via data attributes)
// - Future: client-side validation
// - Future: search and sorting
// - Future: dynamic table render and search

document.addEventListener('DOMContentLoaded', async () => {
  const employeeForm = document.getElementById('employee-form');
  const employeeSaveBtn = document.getElementById('employee-save-btn');
  const employeesTableBody = document.querySelector('#employees-table tbody');
  const resetDemoBtn = document.getElementById('reset-demo-btn');
  const userEmployeeSelect = document.getElementById('user-employee-id');
  const usersTableBody = document.querySelector('#users-table tbody');
  const userForm = document.getElementById('user-form');
  const userSaveBtn = document.getElementById('user-save-btn');

  // Load data
  let employees = loadEmployees();
  let users = loadUsers();

  // Seed Admin employee/user if missing and backfill missing hashes
  await backfillUserHashes();
  await seedAdminRecords();

  // Initial render
  renderEmployeesTable();
  renderUsersTable();
  populateUserEmployeeDropdown();

  // Save Employee handler
  employeeSaveBtn?.addEventListener('click', () => {
    if (!employeeForm) return;
    if (!employeeForm.checkValidity()) {
      employeeForm.classList.add('was-validated');
      return;
    }
    addEmployeeFromForm();
    populateUserEmployeeDropdown();
  });

  // Save User handler
  userSaveBtn?.addEventListener('click', async () => {
    if (!userForm) return;
    // clear any custom validity
    const usernameInput = document.getElementById('user-username');
    const employeeSelect = document.getElementById('user-employee-id');
    usernameInput?.setCustomValidity('');
    employeeSelect?.setCustomValidity('');

    if (!userForm.checkValidity()) {
      userForm.classList.add('was-validated');
      return;
    }

    const username = value('user-username');
    const employee_id = value('user-employee-id');
    const password = value('user-password');

    // custom duplicate checks
    if (users.some(u => (u.username || u.email) === username)) {
      usernameInput?.setCustomValidity('Username already exists');
      userForm.classList.add('was-validated');
      usernameInput?.reportValidity();
      return;
    }
    if (users.some(u => u.employee_id === employee_id)) {
      employeeSelect?.setCustomValidity('This employee already has an account');
      userForm.classList.add('was-validated');
      employeeSelect?.reportValidity();
      return;
    }

    const newUser = {
      user_id: generateUserId(),
      username,
      email: '',
      password, // kept for demo/backfill; not recommended in production
      role: 'Staff',
      employee_id,
      status: 'active',
      added_on: new Date().toISOString(),
      hashed_password: await hashPassword(password)
    };
    users.push(newUser);
    persistUsers();
    renderUsersTable();

    // reset form and close modal
    userForm.reset();
    userForm.classList.remove('was-validated');
    const modalEl = document.getElementById('userModal');
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.hide();
    }
  });

  // Reset demo data
  resetDemoBtn?.addEventListener('click', async () => {
    if (!confirm('Reset demo data? This will clear all employees and users stored in this browser.')) return;
    localStorage.removeItem('employeesData');
    localStorage.removeItem('usersData');
    employees = [];
    users = [];
    await seedAdminRecords();
    renderEmployeesTable();
    renderUsersTable();
    populateUserEmployeeDropdown();
  });

  // Search Employees
  const searchEmployeesInput = document.getElementById('search-employees');
  searchEmployeesInput?.addEventListener('input', () => {
    const query = searchEmployeesInput.value.toLowerCase();
    const rows = employeesTableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = Array.from(row.cells);
      const matches = cells.some(cell => cell.textContent.toLowerCase().includes(query));
      row.style.display = matches ? '' : 'none';
    });
  });

  // Search Users
  const searchUsersInput = document.getElementById('search-users');
  searchUsersInput?.addEventListener('input', () => {
    const query = searchUsersInput.value.toLowerCase();
    const rows = usersTableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = Array.from(row.cells);
      const matches = cells.some(cell => cell.textContent.toLowerCase().includes(query));
      row.style.display = matches ? '' : 'none';
    });
  });

  // Storage helpers
  function loadEmployees() {
    try {
      const raw = localStorage.getItem('employeesData');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse employees from localStorage', e);
      return [];
    }
  }
  function loadUsers() {
    try {
      const raw = localStorage.getItem('usersData');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse users from localStorage', e);
      return [];
    }
  }
  function persistEmployees() {
    localStorage.setItem('employeesData', JSON.stringify(employees));
  }
  function persistUsers() {
    localStorage.setItem('usersData', JSON.stringify(users));
  }

  // UUID helper (legacy or other IDs)
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Employee ID helper: YYMMNN (YY=year last two, MM=current minute, NN=auto-increment)
  function generateEmployeeId() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMinutes()).padStart(2, '0');
    let counter = parseInt(localStorage.getItem('employeeCounter') || '0', 10);
    counter += 1;
    localStorage.setItem('employeeCounter', String(counter));
    const nn = String(counter).padStart(2, '0');
    return `${yy}${mm}${nn}`;
  }

  // User ID helper: YYMMNN with independent counter
  function generateUserId() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMinutes()).padStart(2, '0');
    let counter = parseInt(localStorage.getItem('userCounter') || '0', 10);
    counter += 1;
    localStorage.setItem('userCounter', String(counter));
    const nn = String(counter).padStart(2, '0');
    return `${yy}${mm}${nn}`;
  }

  // Employees
  function addEmployeeFromForm() {
    const data = {
      employee_id: generateEmployeeId(),
      last_name: value('emp-last-name'),
      first_name: value('emp-first-name'),
      middle_name: value('emp-middle-name'),
      suffix_name: value('emp-suffix'),
      gender: value('emp-gender'),
      birthdate: value('emp-birthdate'),
      contact_number: value('emp-contact'),
      position: value('emp-position'),
      status: 'active',
      added_on: new Date().toISOString()
    };
    employees.push(data);
    persistEmployees();
    appendEmployeeRow(data);
    employeeForm.reset();
    employeeForm.classList.remove('was-validated');
    const modalEl = document.getElementById('employeeModal');
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.hide();
    }
  }
  function value(id) {
    return (document.getElementById(id)?.value || '').trim();
  }
  function renderEmployeesTable() {
    employeesTableBody.innerHTML = '';
    employees.forEach(emp => appendEmployeeRow(emp));
  }
  function appendEmployeeRow(emp) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${emp.employee_id}</td>
      <td>${escapeHtml(emp.last_name)}</td>
      <td>${escapeHtml(emp.first_name)}</td>
      <td>${escapeHtml(emp.middle_name)}</td>
      <td>${escapeHtml(emp.suffix_name)}</td>
      <td>${escapeHtml(emp.gender)}</td>
      <td>${escapeHtml(emp.birthdate)}</td>
      <td>${escapeHtml(emp.contact_number)}</td>
      <td>${escapeHtml(emp.position)}</td>
      <td>${escapeHtml(emp.status)}</td>
      <td>${formatDate(emp.added_on)}</td>
      <td><button class="btn btn-sm btn-outline-secondary" disabled title="Edit coming soon">Edit</button></td>
    `;
    employeesTableBody.appendChild(tr);
  }

  // Users
  function renderUsersTable() {
    if (!usersTableBody) return;
    usersTableBody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.user_id}</td>
        <td>${escapeHtml(u.email || u.username || '')}</td>
        <td>${escapeHtml(u.role || '')}</td>
        <td>${escapeHtml(u.employee_id || '')}</td>
        <td>${escapeHtml(u.status || '')}</td>
        <td>${formatDate(u.added_on || '')}</td>
        <td>${escapeHtml(u.hashed_password || '')}</td>
        <td><button class="btn btn-sm btn-outline-secondary" disabled title="Edit coming soon">Edit</button></td>
      `;
      usersTableBody.appendChild(tr);
    });
  }

  function populateUserEmployeeDropdown() {
    if (!userEmployeeSelect) return;
    const current = userEmployeeSelect.value;
    userEmployeeSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Employee...';
    placeholder.disabled = true;
    placeholder.selected = true;
    userEmployeeSelect.appendChild(placeholder);

    employees.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp.employee_id;
      const pos = emp.position ? ` (${emp.position})` : '';
      opt.textContent = `${emp.last_name}, ${emp.first_name}${pos}`;
      userEmployeeSelect.appendChild(opt);
    });
    if (current && [...userEmployeeSelect.options].some(o => o.value === current)) {
      userEmployeeSelect.value = current;
    }
  }

  // Seeding
  async function seedAdminRecords() {
    // Find by name instead of fixed ID so ID scheme changes don't break seeding
    let adminEmp = employees.find(e => e.last_name === 'Admin' && e.first_name === 'System');
    if (!adminEmp) {
      adminEmp = {
        employee_id: generateEmployeeId(),
        last_name: 'Admin',
        first_name: 'System',
        middle_name: 'A',
        suffix_name: '',
        gender: 'Other',
        birthdate: '1990-01-01',
        contact_number: '0000000000',
        position: 'human_resources',
        status: 'active',
        added_on: new Date().toISOString()
      };
      employees.unshift(adminEmp);
      persistEmployees();
    }

    const existingAdminUser = users.find(u => (u.role === 'Admin') && (u.employee_id === adminEmp.employee_id));
    if (!existingAdminUser) {
      const adminUser = {
        user_id: generateUserId(),
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin', // demo only
        role: 'Admin',
        employee_id: adminEmp.employee_id,
        status: 'active',
        added_on: new Date().toISOString()
      };
      adminUser.hashed_password = await hashPassword(adminUser.password);
      users.unshift(adminUser);
      persistUsers();
    }
  }

  // Hashing helpers
  async function hashPassword(plain) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const enc = new TextEncoder();
        const data = enc.encode(plain);
        const buf = await window.crypto.subtle.digest('SHA-256', data);
        const bytes = Array.from(new Uint8Array(buf));
        return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('WebCrypto hash failed, falling back', e);
    }
    // Fallback (non-cryptographic; demo only)
    let hash = 0;
    for (let i = 0; i < plain.length; i++) {
      hash = ((hash << 5) - hash) + plain.charCodeAt(i);
      hash |= 0;
    }
    return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
  }

  async function backfillUserHashes() {
    let changed = false;
    for (const u of users) {
      if (!u.hashed_password && u.password) {
        u.hashed_password = await hashPassword(u.password);
        changed = true;
      }
    }
    if (changed) persistUsers();
  }

  // Utils
  function escapeHtml(str) {
    return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function formatDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }
});
