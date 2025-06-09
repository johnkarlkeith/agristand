import { supabase } from './supabase.js';

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const standardsList = document.getElementById('standardsList');

let standards = [];
let categories = new Set();

async function fetchStandards() {
  const { data, error } = await supabase
    .from('standards')
    .select('*')
    .order('year', { ascending: false })
    .order('title_no', { ascending: true });
  if (error) {
    standardsList.innerHTML = `<div class="alert alert-danger">Failed to load standards.</div>`;
    return;
  }
  standards = data;
  categories = new Set(standards.map(s => s.category));
  renderCategoryOptions();
  renderStandards();
}

function renderCategoryOptions() {
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  Array.from(categories).sort().forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function renderStandards() {
  const search = searchInput.value.toLowerCase();
  const filterCat = categoryFilter.value;
  const filtered = standards.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(search) ||
      s.title_no.toLowerCase().includes(search) ||
      s.category.toLowerCase().includes(search);
    const matchesCat = !filterCat || s.category === filterCat;
    return matchesSearch && matchesCat;
  });
  // Group by year
  const grouped = {};
  filtered.forEach(s => {
    if (!grouped[s.year]) grouped[s.year] = [];
    grouped[s.year].push(s);
  });
  let html = '';
  Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
    html += `<h5 class="mt-4">Year of Publication: <b>${year}</b></h5>`;
    html += `<div class="table-responsive"><table class="table table-striped align-middle">
      <thead><tr>
        <th>Category</th><th>Title No.</th><th>Title</th><th>File</th>
      </tr></thead><tbody>`;
    grouped[year].forEach(s => {
      html += `<tr>
        <td>${s.category}</td>
        <td>${s.title_no}</td>
        <td>${s.title}</td>
        <td>${s.file_url ? `<a href="${s.file_url}" target="_blank" class="btn btn-success btn-sm">View PDF</a>` : '<span class="text-muted">No file</span>'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  });
  standardsList.innerHTML = html || '<div class="alert alert-info">No standards found.</div>';
}

searchInput.addEventListener('input', renderStandards);
categoryFilter.addEventListener('change', renderStandards);

fetchStandards(); 