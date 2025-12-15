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
  const location = document.getElementById('location').value;
  const group_size = document.getElementById('group-size').value;
  const time = document.getElementById('time').value;
  const description = document.getElementById('description').value;

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
    document.getElementById('group-size').value = '0';
    document.getElementById('location').value = '0';
    document.getElementById('time').value = '0';
    document.getElementById('description').value = '';
    // Refresh listings display
    displayListings();
  } catch (err) {
    console.error('Error creating listing:', err);
    alert('Error creating listing');
  }
}

async function displayListings() {
  const container = document.getElementById('group-details');

  try {
    const res = await fetch(`${API}/listings`, { credentials: 'include' });
    if (!res.ok) {
      container.innerHTML = '<p class="muted">Failed to load listings.</p>';
      return;
    }

    const listings = await res.json();
    if (!listings || listings.length === 0) {
      container.innerHTML = '<p class="muted">No listings available yet.</p>';
      return;
    }

    container.innerHTML = '';
    listings.forEach((listing) => {
      const listingDiv = document.createElement('div');
      listingDiv.className = 'group-details';
      // Use display name if available, otherwise fall back to email
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
  } catch (err) {
    console.error('Error loading listings:', err);
    container.innerHTML = '<p class="muted">Error loading listings.</p>';
  }
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
