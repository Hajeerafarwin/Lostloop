import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Auth.css";
import { apiFetch } from "../api";

function Signup() {
  const navigate = useNavigate();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [phone,setPhone]=useState(""); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [show,setShow]=useState(false); const [loading,setLoading]=useState(false);
  const submit=async(e)=>{e.preventDefault(); if(!name.trim()||!email.trim()||!phone.trim()||!password||!confirm) return alert("Please fill all details."); if(password.length<6) return alert("Password must contain at least 6 characters."); if(password!==confirm) return alert("Passwords do not match."); try{setLoading(true); await apiFetch("/auth/signup",{method:"POST",body:JSON.stringify({name,email,phone,password})}); alert("Account created successfully!"); navigate("/login");}catch(err){alert(err.message);}finally{setLoading(false);}};
  return <div className="auth-page">
    <div className="auth-showcase signup-showcase"><div className="auth-brand">♧ LostLoop</div><div className="showcase-copy"><h2>Join LostLoop today!</h2><p>Be a part of a community that helps people reunite with what matters.</p><div className="showcase-person">🧑🏻‍💻</div><b>Report. Support. Reunite.</b></div></div>
    <div className="auth-form-side"><div className="auth-form-wrap"><h1>Create Account</h1><p className="auth-subtitle">Let's get you started!</p>
      <form onSubmit={submit}>
        <label>Full Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your full name"/></label>
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="youremail@example.com"/></label>
        <label>Phone number<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter your phone number"/></label>
        <label>Password<div className="password-field"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password"/><button type="button" onClick={()=>setShow(!show)}>{show?"🙈":"👁"}</button></div></label>
        <label>Confirm Password<div className="password-field"><input type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm your password"/><button type="button" onClick={()=>setShow(!show)}>{show?"🙈":"👁"}</button></div></label>
        <label className="terms"><input type="checkbox" required/> I agree to the Terms & Conditions</label>
        <button className="primary-auth" disabled={loading}>{loading?"Creating Account...":"Sign Up"}</button>
      </form><p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p><Link to="/" className="back-home">← Back to Home</Link>
    </div></div>
  </div>;
}
export default Signup;
