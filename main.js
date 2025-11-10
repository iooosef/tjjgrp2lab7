// Placeholder for main JS logic
// - Modal open hooks (Bootstrap handles via data attributes)
// - Future: client-side validation
// - Future: search and sorting
// - Future: dynamic table render and search

document.addEventListener('DOMContentLoaded', () => {
  const employeeForm = document.getElementById('employee-form');
  const employeeSaveBtn = document.getElementById('employee-save-btn');
  const employeesTableBody = document.querySelector('#employees-table tbody');
  const resetDemoBtn = document.getElementById('reset-demo-btn');
  const userEmployeeSelect = document.getElementById('user-employee-id');
  const usersTableBody = document.querySelector('#users-table tbody');

  // Load data
  let employees = loadEmployees();
  let users = loadUsers();

  // Seed Admin employee/user if missing
  seedAdminRecords();

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

  // Reset demo data
  resetDemoBtn?.addEventListener('click', () => {
    if (!confirm('Reset demo data? This will clear all employees and users stored in this browser.')) return;
    localStorage.removeItem('employeesData');
    localStorage.removeItem('usersData');
    employees = [];
    users = [];
    seedAdminRecords();
    renderEmployeesTable();
    renderUsersTable();
    populateUserEmployeeDropdown();
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

  // UUID helper
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Employees
  function addEmployeeFromForm() {
    const data = {
      employee_id: generateUUID(),
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
  function seedAdminRecords() {
    const ADMIN_EMPLOYEE_ID = '00000000-0000-0000-0000-000000000001';
    let adminEmp = employees.find(e => e.employee_id === ADMIN_EMPLOYEE_ID);
    if (!adminEmp) {
      adminEmp = {
        employee_id: ADMIN_EMPLOYEE_ID,
        last_name: 'Admin',
        first_name: 'System',
        middle_name: 'A',
        suffix_name: '',
        gender: 'Other',
        birthdate: '1990-01-01',
        contact_number: '0000000000',
        position: 'admin',
        status: 'active',
        added_on: new Date().toISOString()
      };
      employees.unshift(adminEmp);
      persistEmployees();
    }

    const existingAdminUser = users.find(u => (u.role === 'Admin') && (u.employee_id === ADMIN_EMPLOYEE_ID));
    if (!existingAdminUser) {
      const adminUser = {
        user_id: generateUUID(),
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin',
        role: 'Admin',
        employee_id: ADMIN_EMPLOYEE_ID,
        status: 'active',
        added_on: new Date().toISOString()
      };
      users.unshift(adminUser);
      persistUsers();
    }
  }

  // Utils
  function escapeHtml(str) {
    return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function formatDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }
});
