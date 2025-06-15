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
const editForm = document.getElementById('editForm');
const editModalStatusMsg = document.getElementById('editModalStatusMsg');
let uploadModal;
let editModal;

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
    document.getElementById('adminEmail').textContent = 'Admin';
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
  editModal = new bootstrap.Modal(document.getElementById('editModal'));
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
  const standardsList = document.getElementById('standardsList');
  if (error) {
    standardsList.innerHTML = '<div class="alert alert-danger">Failed to load standards.</div>';
    return;
  }
  if (!data || data.length === 0) {
    standardsList.innerHTML = '<div class="alert alert-info">No standards found.</div>';
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
    // Sort standards within each year by title_no's numeric part
    grouped[year].sort((a, b) => {
      const numA = Number(a.title_no.split(':')[0].split(' ').pop());
      const numB = Number(b.title_no.split(':')[0].split(' ').pop());
      return numB - numA; // Descending order
    });
    
    html += `<h5 class="mt-4">Year of Publication: <b>${year}</b></h5>`;
    html += `<div class="table-responsive"><table class="table table-striped align-middle" style="width: 100%; table-layout: fixed;">
      <thead><tr>
        <th style="width: 15%">Category</th>
        <th style="width: 15%">Title No.</th>
        <th style="width: 50%">Title</th>
        <th style="width: 10%">File</th>
        <th style="width: 10%">Actions</th>
      </tr></thead><tbody>`;
    grouped[year].forEach(s => {
      html += `<tr>
        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.category}</td>
        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.title_no}</td>
        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.title}</td>
        <td>${s.file_url ? `<a href="${s.file_url}" target="_blank" class="btn btn-success btn-sm">View PDF</a>` : '<span class="text-muted">No file</span>'}</td>
        <td>
          <div class="d-flex gap-2 justify-content-center">
            <button class="btn btn-outline-warning btn-sm rounded-circle edit-btn" data-id="${s.id}" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm rounded-circle delete-btn" data-id="${s.id}" data-file-url="${s.file_url}" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  });
  standardsList.innerHTML = html;
  // Attach event listeners for edit and delete
  standardsList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  standardsList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.id, btn.dataset.fileUrl));
  });
}

async function openEditModal(id) {
  editModalStatusMsg.innerHTML = '';
  // Fetch the standard
  const { data, error } = await supabase.from('standards').select('*').eq('id', id).single();
  if (error) {
    showToast('Failed to fetch standard for editing.', 'danger');
    return;
  }
  document.getElementById('editId').value = data.id;
  document.getElementById('editCategory').value = data.category;
  document.getElementById('editTitleNo').value = data.title_no;
  document.getElementById('editTitle').value = data.title;
  document.getElementById('editYear').value = data.year;
  if (!editModal) editModal = new bootstrap.Modal(document.getElementById('editModal'));
  editModal.show();
}

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const category = document.getElementById('editCategory').value;
  const title_no = document.getElementById('editTitleNo').value;
  const title = document.getElementById('editTitle').value;
  const year = parseInt(document.getElementById('editYear').value, 10);
  const fileInput = document.getElementById('editFile');
  const file = fileInput.files[0];

  let updateObj = { category, title_no, title, year };

  if (file) {
    // Upload new file
    const filePath = `${year}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('standards-files').upload(filePath, file);
    if (uploadError) {
      editModalStatusMsg.innerHTML = `<div class="alert alert-danger">File upload failed: ${uploadError.message}</div>`;
      showToast('File upload failed: ' + uploadError.message, 'danger');
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('standards-files').getPublicUrl(filePath);
    updateObj.file_url = publicUrl;
  }

  const { error: updateError } = await supabase.from('standards').update(updateObj).eq('id', id);
  if (updateError) {
    editModalStatusMsg.innerHTML = `<div class="alert alert-danger">Update failed: ${updateError.message}</div>`;
    showToast('Update failed: ' + updateError.message, 'danger');
    return;
  }
  editModalStatusMsg.innerHTML = `<div class="alert alert-success">Standard updated successfully!</div>`;
  showToast('Standard updated successfully!', 'success');
  if (editModal) editModal.hide();
  fetchAndRenderStandards();
});

async function handleDelete(id, fileUrl) {
  if (!confirm('Are you sure you want to delete this standard? This will also delete the file.')) return;
  // Delete the file from storage if fileUrl exists
  if (fileUrl) {
    // Extract the path after the bucket name
    const urlParts = fileUrl.split('/object/public/standards-files/');
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      await supabase.storage.from('standards-files').remove([filePath]);
    }
  }
  // Delete the record from the table
  const { error } = await supabase.from('standards').delete().eq('id', id);
  if (error) {
    showToast('Delete failed: ' + error.message, 'danger');
    return;
  }
  showToast('Standard deleted successfully!', 'success');
  fetchAndRenderStandards();
}

// On page load, check session
checkSession();
// Listen for auth state changes
supabase.auth.onAuthStateChange((_event, _session) => {
  checkSession();
}); 