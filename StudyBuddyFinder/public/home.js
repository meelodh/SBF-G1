// ==================== SUPABASE API SETUP ====================
const API = "http://localhost:3000";

// Check authentication status
async function checkAuth() {
  try {
    const res = await fetch(`${API}/me`, { credentials: 'include' });
    if (!res.ok) {
      window.location.href = 'index.html';
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = 'index.html';
    return null;
  }
}

// ==================== PAGE INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  
  if (user) {
    const welcomeEl = document.getElementById('welcome');
    if (welcomeEl) {
      const displayName = user.user_metadata?.displayName || user.email;
      welcomeEl.textContent = `Welcome back, ${displayName}!`;
    }
  }
  
  // Load listings on page load
  displayListings();
});

// ==================== LISTING MANAGEMENT ====================
async function createListing() {
  const location = document.getElementById('create-location').value;
  const group_size = document.getElementById('create-group-size').value;
  const time = document.getElementById('create-time').value;
  const description = document.getElementById('create-description').value;

  // Validation
  if (!location || location === '0') {
    alert('Please select a location');
    return;
  }
  if (!group_size || group_size === '0') {
    alert('Please select a group size');
    return;
  }
  if (!time || time === '0') {
    alert('Please select a time');
    return;
  }

  try {
    const res = await fetch(`${API}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        location,
        group_size: parseInt(group_size, 10),
        time,
        description: description || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.error || 'Failed to create listing'}`);
      return;
    }

    alert('Listing created successfully!');
    // Clear form
    document.getElementById('create-group-size').value = '0';
    document.getElementById('create-location').value = '0';
    document.getElementById('create-time').value = '0';
    document.getElementById('create-description').value = '';
    // Refresh listings display
    displayListings();
  } catch (err) {
    console.error('Error creating listing:', err);
    alert('Error creating listing');
  }
}

async function displayListings() {
  const container = document.getElementById('group-details');
  const filterInfo = document.getElementById('filter-info');
  const filterText = document.getElementById('filter-text');

  try {
    const res = await fetch(`${API}/listings`, { credentials: 'include' });
    if (!res.ok) {
      container.innerHTML = '<p class="muted">Failed to load listings.</p>';
      filterInfo.style.display = 'none';
      return;
    }

    const listings = await res.json();
    if (!listings || listings.length === 0) {
      container.innerHTML = '<p class="muted">No listings available yet.</p>';
      filterInfo.style.display = 'none';
      return;
    }

    // Hide filter info for "show all" view
    filterInfo.style.display = 'none';
    renderListings(listings, container);
  } catch (err) {
    console.error('Error loading listings:', err);
    container.innerHTML = '<p class="muted">Error loading listings.</p>';
    filterInfo.style.display = 'none';
  }
}

// Hybrid approach: server-side filtering + client-side keyword search
async function findGroups() {
  const container = document.getElementById('group-details');
  const filterInfo = document.getElementById('filter-info');
  const filterText = document.getElementById('filter-text');

  // Get filter criteria
  const groupSize = document.getElementById('group-size').value;
  const location = document.getElementById('location').value;
  const time = document.getElementById('time').value;
  const keyword = document.getElementById('search-keyword').value.toLowerCase();

  // Build query string for server-side filtering
  const params = new URLSearchParams();
  if (groupSize) params.append('group_size', groupSize);
  if (location) params.append('location', location);
  if (time) params.append('time', time);

  try {
    const queryString = params.toString();
    const url = queryString ? `${API}/listings?${queryString}` : `${API}/listings`;
    
    console.log('[findGroups] Searching with URL:', url);
    const res = await fetch(url, { credentials: 'include' });
    
    if (!res.ok) {
      container.innerHTML = '<p class="muted">Failed to search listings.</p>';
      filterInfo.style.display = 'none';
      return;
    }

    let listings = await res.json();

    // Client-side keyword filtering on descriptions
    if (keyword) {
      listings = listings.filter(listing => {
        const description = (listing.description || '').toLowerCase();
        const displayName = (listing.display_name || '').toLowerCase();
        const userEmail = (listing.user_email || '').toLowerCase();
        return description.includes(keyword) || displayName.includes(keyword) || userEmail.includes(keyword);
      });
    }

    if (!listings || listings.length === 0) {
      container.innerHTML = '<p class="muted">No groups match your search criteria.</p>';
      filterInfo.style.display = 'block';
      filterText.innerHTML = buildFilterSummary(groupSize, location, time, keyword);
      return;
    }

    // Show filter info with summary
    filterInfo.style.display = 'block';
    filterText.innerHTML = buildFilterSummary(groupSize, location, time, keyword) + ` (${listings.length} result${listings.length !== 1 ? 's' : ''})`;

    renderListings(listings, container);
  } catch (err) {
    console.error('Error searching listings:', err);
    container.innerHTML = '<p class="muted">Error searching listings.</p>';
    filterInfo.style.display = 'none';
  }
}

function buildFilterSummary(groupSize, location, time, keyword) {
  const parts = [];
  if (groupSize) parts.push(`Size: ${groupSize}`);
  if (location) parts.push(`Location: ${location}`);
  if (time) parts.push(`Time: ${time}`);
  if (keyword) parts.push(`Keyword: "${keyword}"`);
  return parts.length > 0 ? parts.join(' • ') : 'All groups';
}

function clearFilters() {
  // Reset all filter inputs
  document.getElementById('group-size').value = '';
  document.getElementById('location').value = '';
  document.getElementById('time').value = '';
  document.getElementById('search-keyword').value = '';
  
  // Show all listings
  displayListings();
}

function renderListings(listings, container) {
  container.innerHTML = '';
  listings.forEach((listing) => {
    const listingDiv = document.createElement('div');
    listingDiv.className = 'group-details';
    const postedBy = listing.display_name || listing.user_email || 'Anonymous';
    listingDiv.innerHTML = `
      <p><strong>Group Size:</strong> ${listing.group_size}</p>
      <p><strong>Location:</strong> ${listing.location}</p>
      <p><strong>Time:</strong> ${listing.time}</p>
      <p><strong>Description:</strong> ${listing.description || 'N/A'}</p>
      <p><strong>Posted by:</strong> ${postedBy}</p>
      <div style="display: flex; gap: 8px; margin-top: 1rem;">
        <button class="btn-neon" style="flex: 1; min-width: 100px;" onclick="joinListing('${listing.id}')">Join Group</button>
      </div>
    `;
    container.appendChild(listingDiv);
  });
}

function joinListing(listingId) {
  alert(`You've expressed interest in this group! In production, contact information would be shared here.`);
}

function getListings() {
  displayListings();
}

async function logout() {
  try {
    await fetch(`${API}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
  window.location.href = 'index.html';
}
