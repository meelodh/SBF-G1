const API = "http://localhost:3000";

// Require login on page load + set welcome message
(async () => {
  try {
    const res = await fetch(`${API}/me`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      // IMPORTANT: no "public/" in the URL when Express serves static files
      return (window.location.href = "index.html");
    }

    const welcomeEl = document.getElementById("welcome");
    if (welcomeEl && data?.user?.email) {
      welcomeEl.textContent = "Welcome back, " + data.user.email + "!";
    }
  } catch (err) {
    // If the server is down or request fails, go back to login
    window.location.href = "index.html";
  }
})();

async function createListing() {
  const location = document.getElementById("location").value;
  const group_size = parseInt(document.getElementById("group-size").value, 10);
  const time = document.getElementById("time").value;
  const description = document.getElementById("description").value;

  try {
    const res = await fetch(`${API}/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ send cookies
      body: JSON.stringify({ location, group_size, time, description }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Listing submitted!");
      console.log("Inserted:", data);
    } else {
      console.log("Error:", data.error || "Failed to create listing");
      alert(data.error || "Failed to create listing");
    }
  } catch (err) {
    console.log("Network error creating listing");
    alert("Network error creating listing");
  }
}

async function getListings() {
  try {
    const res = await fetch(`${API}/listings`, {
      method: "GET",
      credentials: "include", // ✅ send cookies (if your backend protects listings)
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("Error:", data.error || "Failed to load listings");
      return alert(data.error || "Failed to load listings");
    }

    if (!Array.isArray(data) || data.length === 0) {
      return alert("No listings found.");
    }

    const first = data[0];
    const paragraphs = document.querySelectorAll("div.group-details > p");

    if (paragraphs.length >= 4) {
      paragraphs[0].textContent = "Group Size: " + (first.group_size ?? "");
      paragraphs[1].textContent = "Location: " + (first.location ?? "");
      paragraphs[2].textContent = "Time: " + (first.time ?? "");
      paragraphs[3].textContent = "Description: " + (first.description ?? "");
    }

    console.log(data);
  } catch (err) {
    console.log("Network error loading listings");
    alert("Network error loading listings");
  }
}

async function logout() {
  try {
    const res = await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include", // ✅ send cookies so server clears them
    });

    // Even if logout fails, still clear local stuff and redirect
    localStorage.removeItem("auth");
    sessionStorage.removeItem("auth");

    // IMPORTANT: no "public/" in the URL
    window.location.href = "index.html";
  } catch (err) {
    localStorage.removeItem("auth");
    sessionStorage.removeItem("auth");
    window.location.href = "index.html";
  }
}
