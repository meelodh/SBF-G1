const API = "http://localhost:3000";

async function loadProfile() {
  try {
    const res = await fetch(`${API}/me`, { credentials: 'include' });
    if (!res.ok) return (window.location.href = 'index.html');

    const data = await res.json();
    const user = data?.user;
    if (!user) return (window.location.href = 'index.html');

    document.getElementById('email').textContent = user.email || '';
    const joined = user?.created_at ? new Date(user.created_at).toLocaleString() : '';
    document.getElementById('joined').textContent = joined ? `Joined: ${joined}` : '';
    document.getElementById('avatar').textContent = (user.email || 'U').slice(0,2).toUpperCase();
    document.getElementById('displayName').value = user?.user_metadata?.displayName || '';
  } catch (err) {
    console.error(err);
    window.location.href = 'index.html';
  }
}

function showMessage(text, isSuccess = true) {
  const msgEl = document.getElementById('msg');
  msgEl.textContent = text;
  msgEl.className = `message ${isSuccess ? 'success' : 'error'}`;
  if (isSuccess) {
    setTimeout(() => msgEl.className = 'message', 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire save button
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('displayName').value.trim();
    if (!name) {
      showMessage('Please enter a display name', false);
      return;
    }

    try {
      const res = await fetch(`${API}/me`, { 
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name })
      });
      
      if (!res.ok) {
        showMessage('Failed to save. Please try again.', false);
        return;
      }

      showMessage('Profile saved successfully!', true);
    } catch (err) {
      console.error(err);
      showMessage('Network error. Please try again.', false);
    }
  });

  // Wire sign out button
  document.getElementById('signoutBtn').addEventListener('click', async () => {
    try {
      await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = 'index.html';
    }
  });

  loadProfile();
  loadListings();
});

async function fetchMe() {
  const res = await fetch(`${API}/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Not logged in');
  return res.json();
}

async function fetchListings() {
  const res = await fetch(`${API}/listings`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed loading listings');
  return res.json();
}

function renderEmpty() {
  const el = document.getElementById('listings');
  el.innerHTML = '<p class="muted">No listings yet. Create one from the Home page!</p>';
}

function makeListingNode(listing, canEdit = false) {
  const wrap = document.createElement('div');
  wrap.className = 'group-details';

  const info = document.createElement('div');
  info.innerHTML = `
    <p><strong>Group Size:</strong> ${listing.group_size}</p>
    <p><strong>Location:</strong> ${listing.location}</p>
    <p><strong>Time:</strong> ${listing.time}</p>
    <p><strong>Description:</strong> ${listing.description || 'N/A'}</p>
  `;
  wrap.appendChild(info);

  if (canEdit) {
    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = '8px';
    btns.style.marginTop = '1rem';
    btns.style.flexWrap = 'wrap';

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

    btns.appendChild(edit);
    btns.appendChild(del);
    wrap.appendChild(btns);
  }

  return wrap;
}

async function deleteListing(id) {
  if (!confirm('Are you sure you want to delete this listing?')) return;
  try {
    const res = await fetch(`${API}/listings/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delete failed');
    }
    loadListings();
  } catch (err) {
    alert(err.message || 'Delete failed');
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
      <label>Description</label>
      <textarea name="description" style="resize: vertical; min-height: 100px;">${listing.description || ''}</textarea>
    </div>
  `;

  const save = document.createElement('button');
  save.className = 'btn-neon';
  save.textContent = 'Save';
  save.style.flex = '1';
  save.style.minWidth = '80px';
  save.onclick = async () => {
    const payload = {
      group_size: form.querySelector('input[name=group_size]').value,
      location: form.querySelector('input[name=location]').value,
      time: form.querySelector('input[name=time]').value,
      description: form.querySelector('textarea[name=description]').value,
    };

    try {
      const res = await fetch(`${API}/listings/${listing.id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
      loadListings();
    } catch (err) {
      alert(err.message || 'Update failed');
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
    const me = await fetchMe();
    const all = await fetchListings();
    const mine = all.filter(l => l.user_id === me.user.id);

    if (!mine || mine.length === 0) return renderEmpty();

    listEl.innerHTML = '';
    mine.forEach(l => {
      const node = makeListingNode(l, true);
      listEl.appendChild(node);
    });
  } catch (err) {
    listEl.innerHTML = '<p class="muted">Not signed in or unable to load listings.</p>';
    console.error(err);
  }
}

async function logout() {
  try {
    await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' });
  } finally {
    window.location.href = 'index.html';
  }
}
