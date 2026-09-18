import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Auth.css";
import { apiFetch } from "../api";

function Login() {
  const navigate=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [show,setShow]=useState(false); const [loading,setLoading]=useState(false);
  const submit=async(e)=>{e.preventDefault(); if(!email.trim()||!password) return alert("Please enter your email and password."); try{setLoading(true); const data=await apiFetch("/auth/login",{method:"POST",body:JSON.stringify({email,password})}); localStorage.setItem("loggedInUser",JSON.stringify(data.user)); alert(`Welcome back, ${data.user.name}!`); navigate("/dashboard");}catch(err){alert(err.message);}finally{setLoading(false);}};
  return <div className="auth-page">
    <div className="auth-showcase login-showcase"><div className="auth-brand">♧ LostLoop</div><div className="showcase-copy"><h2>Good to have you back!</h2><p>Login to continue your LostLoop journey.</p><div className="showcase-person">👩🏻‍💻</div><b>Small actions. Big reunions.</b></div></div>
    <div className="auth-form-side"><div className="auth-form-wrap"><h1>Login</h1><p className="auth-subtitle">Welcome back! Please login to your account.</p>
      <form onSubmit={submit}>
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="youremail@example.com"/></label>
        <label>Password<div className="password-field"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/><button type="button" onClick={()=>setShow(!show)}>{show?"🙈":"👁"}</button></div></label>
        <div className="forgot">Forgot password?</div><button className="primary-auth" disabled={loading}>{loading?"Logging in...":"Login"}</button>
      </form><div className="or">or continue with</div><button type="button" className="social">🌈 Continue with Google</button><button type="button" className="social">🔵 Continue with Facebook</button>
      <p className="auth-switch">Don't have an account? <Link to="/signup">Sign Up</Link></p><Link to="/" className="back-home">← Back to Home</Link>
    </div></div>
  </div>;
}
export default Login;
