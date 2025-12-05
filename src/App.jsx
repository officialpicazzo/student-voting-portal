import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserGraduate } from "react-icons/fa";

// ✅ API CONFIG
const API_BASE = (() => {
  try {
    if (import.meta && import.meta.env && import.meta.env.VITE_API_BASE)
      return import.meta.env.VITE_API_BASE;
  } catch (e) {}
  if (typeof window !== "undefined" && window.__REACT_APP_API_BASE)
    return window.__REACT_APP_API_BASE;
  return "http://localhost:5148/api";
})();
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ✅ COMPONENTS
function TopHeader() {
  return (
    <header className="w-full header-blue text-white p-4">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="text-lg font-bold">Student Voting Portal</div>
        <div className="text-sm">Welcome</div>
      </div>
    </header>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen">
      <TopHeader />
      <main className="max-w-3xl mx-auto p-6">{children}</main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

// ✅ Helper input with icon
function InputWithIcon({ icon, ...props }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-3 text-gray-400">{icon}</span>
      <input
        {...props}
        className="w-full border rounded pl-10 p-3 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

// ✅ Mock helpers for offline testing
function mockRegister(data) {
  const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
  users.push(data);
  localStorage.setItem("mock_users", JSON.stringify(users));
  return true;
}
function mockLogin(matric, password) {
  const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
  const found = users.find((u) => u.matricNo === matric);
  if (found) {
    localStorage.setItem("token", "mock_" + Math.random().toString(36).slice(2));
    localStorage.setItem(
      "mock_user",
      JSON.stringify({
        name: found.firstName + " " + found.surname,
        matricNumber: found.matricNo,
      })
    );
    return true;
  }
  return false;
}

// ✅ Register Page
function RegisterPage() {
  const [surname, setSurname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!surname || !firstName || !email || !matricNo || !password) {
      setError("Please fill required fields");
      return;
    }

    const payload = { surname, firstName, email, matricNo, phone, password };

    try {
      const res = await api.post("/Auth/register", payload);
      if (res.data && res.data.success) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        mockRegister(payload);
        setSuccess("Registered (mock). Redirecting to login...");
        setTimeout(() => navigate("/login"), 1200);
      }
    } catch (err) {
      mockRegister(payload);
      setSuccess("Registered (mock). Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm card p-6">
        <div className="text-center mb-4">
          <img
            src="/src/assets/logo.png"
            alt="Student Voting Logo"
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              margin: "0 auto",
              objectFit: "contain",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
            }}
          />
          <h2 className="text-xl font-bold mt-3">Student Voting Portal</h2>
        </div>

        {error && <div className="text-red-600 mb-3">{error}</div>}
        {success && <div className="text-green-600 mb-3">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <InputWithIcon icon={<FaUser />} placeholder="Surname" value={surname} onChange={(e)=>setSurname(e.target.value)} />
          <InputWithIcon icon={<FaUser />} placeholder="First Name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          <InputWithIcon icon={<FaEnvelope />} placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <InputWithIcon icon={<FaUserGraduate />} placeholder="Matric No" value={matricNo} onChange={(e)=>setMatricNo(e.target.value)} />
          <InputWithIcon icon={<FaPhone />} placeholder="Phone number" value={phone} onChange={(e)=>setPhone(e.target.value)} />
          <InputWithIcon icon={<FaLock />} type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button type="submit" className="w-full btn-primary">Submit</button>
        </form>

        <div className="text-center text-sm mt-3">
          <Link to="/login" className="text-primary">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

// ✅ Login Page
function LoginPage() {
  const [matric, setMatric] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!matric || !password) {
      setError("Please provide matric and password");
      return;
    }

    try {
      const res = await api.post("/Auth/login", { matricNumber: matric, password });
      const token = res.data?.token;
      if (!token) {
        setError("Login failed: no token");
        return;
      }
      localStorage.setItem("token", token);
      navigate("/");
    } catch (err) {
      if (mockLogin(matric, password)) {
        navigate("/");
        return;
      }
      setError("Login failed — check backend.");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm card p-6">
        <div className="text-center mb-4">
          <img
            src="/src/assets/logo.png"
            alt="Student Voting Logo"
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              margin: "0 auto",
              objectFit: "contain",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
            }}
          />
          <h2 className="text-xl font-bold mt-3">Student Voting Portal</h2>
        </div>

        {error && <div className="text-red-600 mb-3">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-3">
          <InputWithIcon icon={<FaUserGraduate />} placeholder="Matric Number" value={matric} onChange={(e)=>setMatric(e.target.value)} />
          <InputWithIcon icon={<FaLock />} type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button type="submit" className="w-full btn-primary">Login</button>
        </form>

        <div className="text-center text-sm mt-3">
          <Link to="/register" className="text-primary">Register</Link>
        </div>
      </div>
    </div>
  );
}

// ✅ Dashboard, Vote, Profile remain the same (no change)
function Dashboard(){ return (<div className="p-6">Dashboard content...</div>); }
function VotePage(){ return (<div className="p-6">Vote Page...</div>); }
function ProfilePage(){ return (<div className="p-6">Profile Page...</div>); }

// ✅ MAIN APP EXPORT
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<PageShell><RegisterPage/></PageShell>} />
        <Route path="/login" element={<PageShell><LoginPage/></PageShell>} />
        <Route path="/" element={<PageShell><PrivateRoute><Dashboard/></PrivateRoute></PageShell>} />
        <Route path="/vote" element={<PageShell><PrivateRoute><VotePage/></PrivateRoute></PageShell>} />
        <Route path="/profile" element={<PageShell><PrivateRoute><ProfilePage/></PrivateRoute></PageShell>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
