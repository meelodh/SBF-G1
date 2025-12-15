// ==================== SUPABASE API SETUP ====================
const API = "http://localhost:3000";

// Format date from YYYY-MM-DD to "Day, Month Date, Year"
function formatDateDisplay(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString + 'T00:00:00Z');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

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

// ==================== MESSAGE DISPLAY ====================
function showMessage(text, isSuccess = true) {
  const msgEl = document.getElementById('msg');
  msgEl.textContent = text;
  msgEl.className = `message ${isSuccess ? 'success' : 'error'}`;
  if (isSuccess) {
    setTimeout(() => msgEl.className = 'message', 3000);
  }
}

// ==================== PAGE INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return;

  // Wire save button
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('displayName').value.trim();
    if (!name) {
      showMessage('Please enter a display name', false);
      return;
    }
    
    try {
      console.log('[Profile] Saving display name:', name);
      const res = await fetch(`${API}/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName: name }),
      });

      console.log('[Profile] Response status:', res.status);
      const responseData = await res.json();
      console.log('[Profile] Response data:', responseData);

      if (!res.ok) {
        showMessage(`Error: ${responseData.error || 'Failed to update profile'}`, false);
        return;
      }

      showMessage('Profile updated!', true);
      // Reload the user data to reflect changes
      const updatedUser = await checkAuth();
      if (updatedUser) {
        loadProfile(updatedUser);
      }
    } catch (err) {
      showMessage('Error updating profile', false);
      console.error('[Profile] Error:', err);
    }
  });

  // Wire sign out button
  document.getElementById('signoutBtn').addEventListener('click', async () => {
    logout();
  });

  loadProfile(user);
  loadListings();
  loadJoinedGroups();
});

// ==================== PROFILE LOADING ====================
async function loadProfile(user) {
  try {
    document.getElementById('email').textContent = user.email || '';
    const joined = user?.created_at ? new Date(user.created_at).toLocaleString() : '';
    document.getElementById('joined').textContent = joined ? `Joined: ${joined}` : '';
    document.getElementById('avatar').textContent = (user.email || 'U').slice(0, 2).toUpperCase();
    document.getElementById('displayName').value = user?.user_metadata?.displayName || '';
  } catch (err) {
    console.error(err);
    window.location.href = 'index.html';
  }
}


// ==================== LISTINGS MANAGEMENT ====================
function makeListingNode(listing, canEdit = false) {
  const wrap = document.createElement('div');
  wrap.className = 'group-details';

  const dateDisplay = listing.meeting_date ? formatDateDisplay(listing.meeting_date) : 'N/A';
  
  const info = document.createElement('div');
  info.innerHTML = `
    <p><strong>Group Size:</strong> ${listing.group_size}</p>
    <p><strong>Location:</strong> ${listing.location}</p>
    <p><strong>Time:</strong> ${listing.time}</p>
    <p><strong>When:</strong> ${dateDisplay} at ${listing.time}</p>
    <p><strong>Description:</strong> ${listing.description || 'N/A'}</p>
    <p><strong>Created:</strong> ${new Date(listing.created_at).toLocaleString()}</p>
  `;
  wrap.appendChild(info);

  if (canEdit) {
    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = '8px';
    btns.style.marginTop = '1rem';
    btns.style.flexWrap = 'wrap';

    const viewMembers = document.createElement('button');
    viewMembers.className = 'btn-neon';
    viewMembers.textContent = 'View Members';
    viewMembers.style.flex = '1';
    viewMembers.style.minWidth = '80px';
    viewMembers.onclick = () => viewGroupMembers(listing.id);

    const edit = document.createElement('button');
    edit.className = 'btn-neon';
    edit.textContent = 'Edit';
    edit.style.flex = '1';
    edit.style.minWidth = '80px';
    edit.onclick = () => showEditForm(listing, wrap);

    const del = document.createElement('button');
    del.className = 'btn-neon';
    del.textContent = 'Delete';
    del.style.flex = '1';
    del.style.minWidth = '80px';
    del.onclick = () => deleteListing(listing.id);

    btns.appendChild(viewMembers);
    btns.appendChild(edit);
    btns.appendChild(del);
    wrap.appendChild(btns);
  }

  return wrap;
}

async function deleteListing(id) {
  if (!confirm('Are you sure you want to delete this listing?')) return;
  try {
    const res = await fetch(`${API}/listings/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.error || 'Failed to delete listing'}`);
      return;
    }

    loadListings();
  } catch (err) {
    alert('Error deleting listing');
    console.error(err);
  }
}

function showEditForm(listing, container) {
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-group">
      <label>Group Size</label>
      <input name="group_size" value="${listing.group_size}" />
    </div>
    <div class="form-group">
      <label>Location</label>
      <input name="location" value="${listing.location}" />
    </div>
    <div class="form-group">
      <label>Time</label>
      <input name="time" value="${listing.time}" />
    </div>
    <div class="form-group">
      <label>Meeting Date</label>
      <input name="meeting_date" type="date" value="${listing.meeting_date || ''}" />
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea name="description" style="resize: vertical; min-height: 100px;">${listing.description || ''}</textarea>
    </div>
  `;

  const save = document.createElement('button');
  save.className = 'btn-neon';
  save.textContent = 'Save Changes';
  save.style.flex = '1';
  save.style.minWidth = '80px';
  save.onclick = async () => {
    const payload = {
      group_size: form.querySelector('input[name=group_size]').value,
      location: form.querySelector('input[name=location]').value,
      time: form.querySelector('input[name=time]').value,
      meeting_date: form.querySelector('input[name=meeting_date]').value,
      description: form.querySelector('textarea[name=description]').value,
    };

    try {
      const res = await fetch(`${API}/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to update listing'}`);
        return;
      }

      loadListings();
    } catch (err) {
      alert('Error updating listing');
      console.error(err);
    }
  };

  const cancel = document.createElement('button');
  cancel.className = 'btn-neon';
  cancel.textContent = 'Cancel';
  cancel.style.flex = '1';
  cancel.style.minWidth = '80px';
  cancel.onclick = () => loadListings();

  const btnDiv = document.createElement('div');
  btnDiv.style.display = 'flex';
  btnDiv.style.gap = '8px';
  btnDiv.style.marginTop = '1rem';
  btnDiv.appendChild(save);
  btnDiv.appendChild(cancel);
  form.appendChild(btnDiv);

  container.innerHTML = '';
  container.appendChild(form);
}

async function loadListings() {
  const listEl = document.getElementById('listings');
  listEl.innerHTML = '<p class="muted">Loading your listings...</p>';

  try {
    const res = await fetch(`${API}/listings?mine=true`, { credentials: 'include' });
    if (!res.ok) {
      listEl.innerHTML = '<p class="muted">Error loading listings.</p>';
      return;
    }

    const listings = await res.json();
    if (!listings || listings.length === 0) {
      listEl.innerHTML = '<p class="muted">No listings yet. Create one from the Home page!</p>';
      return;
    }

    listEl.innerHTML = '';
    listings.forEach(l => {
      const node = makeListingNode(l, true);
      listEl.appendChild(node);
    });
  } catch (err) {
    listEl.innerHTML = '<p class="muted">Error loading listings.</p>';
    console.error(err);
  }
}

// ==================== JOINED GROUPS MANAGEMENT ====================
async function loadJoinedGroups() {
  const container = document.getElementById('joined-groups');
  if (!container) return;

  container.innerHTML = '<p class="muted">Loading joined groups...</p>';

  try {
    const res = await fetch(`${API}/listings`, { credentials: 'include' });
    if (!res.ok) {
      container.innerHTML = '<p class="muted">Error loading joined groups.</p>';
      return;
    }

    // Fetch all listings
    const listings = await res.json();
    const joinedGroupIds = new Set();

    // For each listing, check if current user is a member
    let joinedGroups = [];
    
    for (const listing of listings) {
      try {
        const memberRes = await fetch(`${API}/listings/${listing.id}/members`, { credentials: 'include' });
        if (memberRes.ok) {
          const members = await memberRes.json();
          // Check if current user is in members (simple check by listing)
          if (members.length > 0) {
            // We need to check if current user is in this group
            // For now, we'll fetch the user and check
            const userRes = await fetch(`${API}/me`, { credentials: 'include' });
            if (userRes.ok) {
              const userData = await userRes.json();
              const currentUserId = userData.user?.id;
              const isJoined = members.some(m => m.user_id === currentUserId);
              if (isJoined) {
                joinedGroups.push(listing);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking membership:', err);
      }
    }

    if (!joinedGroups || joinedGroups.length === 0) {
      container.innerHTML = '<p class="muted">You haven\'t joined any groups yet.</p>';
      return;
    }

    container.innerHTML = '';
    joinedGroups.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'group-details';
      const postedBy = group.display_name || group.user_email || 'Anonymous';
      const dateDisplay = group.meeting_date ? formatDateDisplay(group.meeting_date) : 'N/A';
      groupDiv.innerHTML = `
        <p><strong>Group Size:</strong> ${group.group_size}</p>
        <p><strong>Location:</strong> ${group.location}</p>
        <p><strong>Time:</strong> ${group.time}</p>
        <p><strong>When:</strong> ${dateDisplay} at ${group.time}</p>
        <p><strong>Description:</strong> ${group.description || 'N/A'}</p>
        <p><strong>Posted by:</strong> ${postedBy}</p>
        <div style="display: flex; gap: 8px; margin-top: 1rem;">
          <button class="btn-neon" style="flex: 1; min-width: 80px;" onclick="viewGroupMembers('${group.id}')">View Members</button>
          <button class="btn-neon" style="flex: 1; min-width: 80px;" onclick="leaveGroup('${group.id}')">Leave Group</button>
        </div>
      `;
      container.appendChild(groupDiv);
    });
  } catch (err) {
    container.innerHTML = '<p class="muted">Error loading joined groups.</p>';
    console.error(err);
  }
}

async function leaveGroup(listingId) {
  if (!confirm('Are you sure you want to leave this group?')) return;

  try {
    const res = await fetch(`${API}/listings/${listingId}/join`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.error || 'Failed to leave group'}`);
      return;
    }

    alert('You\'ve left the group');
    loadJoinedGroups();
  } catch (err) {
    console.error('Error leaving group:', err);
    alert('Error leaving group');
  }
}

// ==================== VIEW GROUP MEMBERS ====================
async function viewGroupMembers(listingId) {
  try {
    console.log('[viewGroupMembers] Fetching members for listing:', listingId);
    
    const res = await fetch(`${API}/listings/${listingId}/members`, { credentials: 'include' });

    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.error || 'Failed to load members'}`);
      return;
    }

    const members = await res.json();

    if (!members || members.length === 0) {
      alert('No members have joined this group yet.');
      return;
    }

    // Format members for display with better layout
    let membersList = '👥 GROUP MEMBERS\n';
    membersList += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    members.forEach((member, index) => {
      const name = member.user_display_name || member.user_email || 'Unknown';
      const email = member.user_email;
      const joinedDate = new Date(member.joined_at).toLocaleDateString();
      membersList += `${index + 1}. ${name}\n`;
      membersList += `   📧 ${email}\n`;
      membersList += `   📅 Joined: ${joinedDate}\n\n`;
    });

    membersList += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    membersList += `Total Members: ${members.length}\n\n`;
    membersList += 'You can copy email addresses to contact members.';

    // Show members in a formatted alert
    alert(membersList);
  } catch (err) {
    console.error('[viewGroupMembers] Error:', err);
    alert('Error loading group members');
  }
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
