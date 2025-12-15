import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

// Base client (anon) - good for auth methods, NOT for RLS DB calls unless you attach user token
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Serve frontend files
app.use(express.static("StudyBuddyFinder/public"));

/*
  Helpers
*/
function setAuthCookies(res, session) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true only on HTTPS
    path: "/",
  };

  res.cookie("access_token", session.access_token, cookieOptions);
  res.cookie("refresh_token", session.refresh_token, cookieOptions);
}

function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

// Create an "authed" client that includes the user's JWT so RLS works
function supabaseAuthed(req) {
  const accessToken = req.cookies?.access_token || "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
    },
  });
}

// Simple auth guard
async function requireUser(req, res) {
  const accessToken = req.cookies?.access_token;
  if (!accessToken) return { error: "Not logged in" };

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) return { error: "Invalid session" };

  return { user: data.user };
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

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    // if email confirmation is OFF, session exists immediately
    if (data?.session) {
      setAuthCookies(res, data.session);
    }

    return res.json({ ok: true, needsEmailConfirmation: !data?.session });
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
    if (error) return res.status(401).json({ error: error.message });

    setAuthCookies(res, data.session);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// CHECK SESSION
app.get("/me", async (req, res) => {
  const result = await requireUser(req, res);
  if (result.error) return res.status(401).json({ error: result.error });
  return res.json({ ok: true, user: result.user });
});

// UPDATE PROFILE
app.put("/me", async (req, res) => {
  try {
    const result = await requireUser(req, res);
    if (result.error) return res.status(401).json({ error: result.error });

    const { displayName } = req.body || {};
    if (!displayName || typeof displayName !== 'string' || displayName.trim() === '') {
      return res.status(400).json({ error: "Display name is required" });
    }

    const accessToken = req.cookies?.access_token;
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
      },
    });

    const { data, error } = await supabaseUser.auth.updateUser({
      data: { displayName: displayName.trim() },
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({ ok: true, user: data.user });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/*
  LISTINGS (RLS enabled, so we MUST use supabaseAuthed(req))
*/

// GET listings - returns all listings (or just user's if ?mine=true)
app.get("/listings", async (req, res) => {
  try {
    const result = await requireUser(req, res);
    if (result.error) return res.status(401).json({ error: result.error });

    const sb = supabaseAuthed(req);
    const userId = result.user.id;
    const isMine = req.query.mine === 'true';

    console.log(`[DEBUG] /listings called - isMine=${isMine}, userId=${userId}`);

    let query = sb.from("listings").select("*");

    // If ?mine=true, filter to only this user's listings
    if (isMine) {
      console.log(`[DEBUG] Filtering to user ${userId}`);
      query = query.eq("user_id", userId);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    console.log(`[DEBUG] Query result: ${data?.length || 0} listings`);
    if (data && data.length > 0) {
      console.log(`[DEBUG] First listing user_id: ${data[0].user_id}`);
    }

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST create a listing (must set user_id = auth.uid(), RLS checks it)
app.post("/listings", async (req, res) => {
  try {
    const result = await requireUser(req, res);
    if (result.error) return res.status(401).json({ error: result.error });

    const user = result.user;
    const { group_size, location, time, description } = req.body || {};

    const parsedSize = parseInt(group_size, 10);
    if (!parsedSize || parsedSize < 1) {
      return res.status(400).json({ error: "Invalid group_size" });
    }
    if (!location || !time) {
      return res.status(400).json({ error: "Location and time are required" });
    }

    const sb = supabaseAuthed(req);

    const { data, error } = await sb
      .from("listings")
      .insert([
        {
          user_id: user.id,
          group_size: parsedSize,
          location,
          time,
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT update listing (RLS enforces ownership, but we still use authed client)
app.put("/listings/:id", async (req, res) => {
  try {
    const result = await requireUser(req, res);
    if (result.error) return res.status(401).json({ error: result.error });

    const id = req.params.id;
    const { group_size, location, time, description } = req.body || {};

    const updates = {};
    if (group_size !== undefined) updates.group_size = parseInt(group_size, 10);
    if (location !== undefined) updates.location = location;
    if (time !== undefined) updates.time = time;
    if (description !== undefined) updates.description = description;

    const sb = supabaseAuthed(req);

    const { data, error } = await sb
      .from("listings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    // If they try updating someone else's row, RLS makes it return null
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(403).json({ error: "Not authorized or not found" });

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE listing (RLS enforces ownership)
app.delete("/listings/:id", async (req, res) => {
  try {
    const result = await requireUser(req, res);
    if (result.error) return res.status(401).json({ error: result.error });

    const id = req.params.id;
    const sb = supabaseAuthed(req);

    // First, check if the listing exists and belongs to the user
    const { data: existing, error: fetchError } = await sb
      .from("listings")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res.status(403).json({ error: "Not authorized or not found" });
    }

    // Now delete it
    const { error } = await sb.from("listings").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
