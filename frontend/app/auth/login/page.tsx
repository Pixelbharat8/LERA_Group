"use client";

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost/api/identity/login", {
        email,
        password
      });

      Cookies.set("token", res.data.data.token);
      Cookies.set("role", res.data.data.role);

      window.location.href = "/dashboard/" + res.data.data.role;
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <main className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg p-6 rounded w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>

        <form onSubmit={login} className="flex flex-col gap-3">
          <input 
            type="email" 
            placeholder="Email" 
            className="p-2 border rounded"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <input 
            type="password" 
            placeholder="Password"
            className="p-2 border rounded"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button 
            type="submit" 
            className="p-2 bg-blue-600 text-white rounded"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
