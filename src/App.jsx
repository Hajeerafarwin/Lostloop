import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import HowItWorks from "./components/HowItWorks";
import RecentItems from "./components/RecentItems";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ReportLost from "./pages/ReportLost";
import FoundItem from "./pages/FoundItem";
import ReportFound from "./pages/ReportFound";
import History from "./pages/History";
import Browse from "./pages/Browse";
import ItemDetails from "./pages/ItemDetails";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

function Protected({ children }) {
  return localStorage.getItem("loggedInUser")
    ? children
    : <Navigate to="/login" replace />;
}

function Home() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <section id="home"><Hero /></section>
        <Stats />
        <section id="how-it-works"><HowItWorks /></section>
        <RecentItems />
        <CTA />
        <section id="about" className="about-section">
          <div className="section-heading">
            <p className="section-label">ABOUT LOSTLOOP</p>
            <h2>Connecting lost items with their rightful owners.</h2>
            <p>LostLoop is a smart Lost & Found platform that helps people report, discover and reconnect with their belongings.</p>
          </div>
          <div className="about-grid">
            <div className="about-card"><span>🔎</span><h3>Easy Reporting</h3><p>Report lost or found items with useful details.</p></div>
            <div className="about-card"><span>🎯</span><h3>Smart Matching</h3><p>Compare reports to discover possible matches.</p></div>
            <div className="about-card"><span>🤝</span><h3>Easy Reunion</h3><p>Contact the right person and complete the return process.</p></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/report-lost" element={<Protected><ReportLost /></Protected>} />
      <Route path="/found-item" element={<Protected><FoundItem /></Protected>} />
      <Route path="/report-found" element={<Protected><ReportFound /></Protected>} />
      <Route path="/history" element={<Protected><History /></Protected>} />
      <Route path="/browse" element={<Protected><Browse /></Protected>} />
      <Route path="/item-details" element={<Protected><ItemDetails /></Protected>} />
      <Route path="/matches" element={<Protected><Matches /></Protected>} />
      <Route path="/messages" element={<Protected><Messages /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
    </Routes>
  );
}
export default App;
