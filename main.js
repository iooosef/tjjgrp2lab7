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

	// Load employees from localStorage
	let employees = loadEmployees();
	renderEmployeesTable();

	// Enable save button handler
	employeeSaveBtn?.addEventListener('click', () => {
		if (!employeeForm) return;
		// Trigger HTML5 validation
		if (!employeeForm.checkValidity()) {
			employeeForm.classList.add('was-validated');
			return;
		}
		addEmployeeFromForm();
	});

	// Reset demo data (invisible button next to title)
	resetDemoBtn?.addEventListener('click', () => {
		if (!confirm('Reset demo data? This will clear all employees stored in this browser.')) return;
		localStorage.removeItem('employeesData');
		employees = [];
		renderEmployeesTable();
	});

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

	function persistEmployees() {
		localStorage.setItem('employeesData', JSON.stringify(employees));
	}

	function generateUUID() {
		// Simple UUID v4 generator
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

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
		// Reset form
		employeeForm.reset();
		employeeForm.classList.remove('was-validated');
		// Hide modal
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

	function escapeHtml(str) {
		return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
	}

	function formatDate(iso) {
		try {
			return new Date(iso).toLocaleString();
		} catch { return iso; }
	}

		// CSV-related logic removed per requirement
});
