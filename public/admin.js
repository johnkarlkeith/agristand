import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://mwdjnvdtxvxcheksfsht.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZGpudmR0eHZ4Y2hla3Nmc2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0OTE3NzQsImV4cCI6MjA2NTA2Nzc3NH0.ZTzKys9uKf4kJxzgdgMxo61ppxOxNVmG8RfrevcBicU';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const statusMsg = document.getElementById('statusMsg');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const openUploadModalBtn = document.getElementById('openUploadModalBtn');
const uploadForm = document.getElementById('uploadForm');
const standardsTable = document.getElementById('standardsTable');
const adminStatusMsg = document.getElementById('adminStatusMsg');
const modalStatusMsg = document.getElementById('modalStatusMsg');
let uploadModal;

// Toast notification logic
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// Optional: Restrict to a specific admin email
// const ADMIN_EMAIL = 'admin@example.com';

function showStatus(msg, type = 'info', where = 'main') {
  if (where === 'modal') {
    modalStatusMsg.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  } else {
    adminStatusMsg.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }
}

function showLogin() {
  loginSection.style.display = '';
  adminSection.style.display = 'none';
}

function showAdmin() {
  loginSection.style.display = 'none';
  adminSection.style.display = '';
  fetchAndRenderStandards();
}

async function checkSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Uncomment to restrict to a specific admin email
    // if (user.email !== ADMIN_EMAIL) {
    //   showStatus('Access denied: not an admin.', 'danger');
    //   await supabase.auth.signOut();
    //   showLogin();
    //   return;
    // }
    showAdmin();
  } else {
    showLogin();
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  statusMsg.innerHTML = '<div class="alert alert-info">Logging in...</div>';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    statusMsg.innerHTML = '<div class="alert alert-danger">Login failed: ' + error.message + '</div>';
  } else {
    statusMsg.innerHTML = '';
    showAdmin();
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showStatus('Logged out.', 'info');
  showLogin();
});

// Modal logic
if (typeof bootstrap !== 'undefined') {
  uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));
}
if (openUploadModalBtn) {
  openUploadModalBtn.addEventListener('click', () => {
    modalStatusMsg.innerHTML = '';
    uploadForm.reset();
    if (!uploadModal) uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));
    uploadModal.show();
  });
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const title_no = document.getElementById('titleNo').value;
  const title = document.getElementById('title').value;
  const year = parseInt(document.getElementById('year').value, 10);
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];
  if (!file) {
    showStatus('Please select a PDF file.', 'warning', 'modal');
    showToast('Please select a PDF file.', 'danger');
    return;
  }
  showStatus('Uploading file...', 'info', 'modal');
  // Place file in a folder named after the year
  const filePath = `${year}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('standards-files').upload(filePath, file);
  if (uploadError) {
    showStatus('File upload failed: ' + uploadError.message, 'danger', 'modal');
    showToast('File upload failed: ' + uploadError.message, 'danger');
    return;
  }
  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from('standards-files').getPublicUrl(filePath);
  // Insert into standards table
  const { error: insertError } = await supabase.from('standards').insert([
    { category, title_no, title, year, file_url: publicUrl }
  ]);
  if (insertError) {
    showStatus('Database insert failed: ' + insertError.message, 'danger', 'modal');
    showToast('Database insert failed: ' + insertError.message, 'danger');
    return;
  }
  showStatus('Standard uploaded successfully!', 'success', 'modal');
  showToast('Standard uploaded successfully!', 'success');
  uploadForm.reset();
  if (uploadModal) uploadModal.hide();
  showStatus('Standard uploaded successfully!', 'success', 'main');
  fetchAndRenderStandards();
});

async function fetchAndRenderStandards() {
  const { data, error } = await supabase.from('standards').select('*').order('year', { ascending: false }).order('title_no', { ascending: true });
  const tbody = standardsTable.querySelector('tbody');
  if (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Failed to load standards.</td></tr>';
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted">No standards found.</td></tr>';
    return;
  }
  // Group by year
  const grouped = {};
  data.forEach(s => {
    if (!grouped[s.year]) grouped[s.year] = [];
    grouped[s.year].push(s);
  });
  let html = '';
  Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
    html += `<tr><td colspan="5" class="bg-light fw-bold">Year: ${year}</td></tr>`;
    grouped[year].forEach(s => {
      html += `
        <tr>
          <td>${s.category}</td>
          <td>${s.title_no}</td>
          <td>${s.title}</td>
          <td>${s.year}</td>
          <td>${s.file_url ? `<a href="${s.file_url}" target="_blank" class="btn btn-sm btn-success">View PDF</a>` : '<span class="text-muted">No file</span>'}</td>
        </tr>
      `;
    });
  });
  tbody.innerHTML = html;
}

// On page load, check session
checkSession();
// Listen for auth state changes
supabase.auth.onAuthStateChange((_event, _session) => {
  checkSession();
}); 