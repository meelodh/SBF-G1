import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import supabase from "./supabaseClient.js";

const app = express();
const PORT = process.env.PORT || 3000;

/*
  Middleware
*/
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/*
  Serve frontend files
*/
app.use(express.static("StudyBuddyFinder/public"));

/*
  Auth Helpers
*/
function setAuthCookies(res, session) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true only when using HTTPS
    path: "/",
  };

  res.cookie("access_token", session.access_token, cookieOptions);
  res.cookie("refresh_token", session.refresh_token, cookieOptions);
}

/*
  Routes
*/

// SIGN UP
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // email confirmation OFF → session exists immediately
    if (data?.session) {
      setAuthCookies(res, data.session);
      return res.json({ ok: true });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    setAuthCookies(res, data.session);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// CHECK SESSION
app.get("/me", async (req, res) => {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    return res.status(401).json({ error: "Invalid session" });
  }

  return res.json({ ok: true, user: data.user });
});

// LISTINGS
// GET all listings (requires auth)
app.get("/listings", async (req, res) => {
  try {
    const accessToken = req.cookies?.access_token;
    if (!accessToken) return res.status(401).json({ error: "Not logged in" });

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError) return res.status(401).json({ error: "Invalid session" });

    const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    return res.json(data || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST create a listing
app.post("/listings", async (req, res) => {
  try {
    const accessToken = req.cookies?.access_token;
    if (!accessToken) return res.status(401).json({ error: "Not logged in" });

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError) return res.status(401).json({ error: "Invalid session" });

    const user = userData.user;
    const { group_size, location, time, description } = req.body || {};

    // basic validation
    const parsedSize = parseInt(group_size, 10);
    if (!parsedSize || parsedSize < 1) return res.status(400).json({ error: "Invalid group_size" });
    if (!location || !time) return res.status(400).json({ error: "Location and time are required" });

    const { data, error } = await supabase.from("listings").insert([{
      user_id: user.id,
      group_size: parsedSize,
      location,
      time,
      description: description || null
    }]).select().single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT update a listing (must own)
app.put("/listings/:id", async (req, res) => {
  try {
    const accessToken = req.cookies?.access_token;
    if (!accessToken) return res.status(401).json({ error: "Not logged in" });

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError) return res.status(401).json({ error: "Invalid session" });

    const user = userData.user;
    const id = req.params.id;

    const { data: existing, error: fetchErr } = await supabase.from("listings").select("*").eq("id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: "Listing not found" });
    if (existing.user_id !== user.id) return res.status(403).json({ error: "Not authorized" });

    const updates = {};
    const { group_size, location, time, description } = req.body || {};
    if (group_size !== undefined) updates.group_size = parseInt(group_size, 10);
    if (location !== undefined) updates.location = location;
    if (time !== undefined) updates.time = time;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase.from("listings").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE listing (must own)
app.delete("/listings/:id", async (req, res) => {
  try {
    const accessToken = req.cookies?.access_token;
    if (!accessToken) return res.status(401).json({ error: "Not logged in" });

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError) return res.status(401).json({ error: "Invalid session" });

    const user = userData.user;
    const id = req.params.id;

    const { data: existing, error: fetchErr } = await supabase.from("listings").select("*").eq("id", id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: "Listing not found" });
    if (existing.user_id !== user.id) return res.status(403).json({ error: "Not authorized" });

    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.json({ ok: true });
});

/*
  Start Server
*/
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
