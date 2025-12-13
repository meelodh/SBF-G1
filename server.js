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
