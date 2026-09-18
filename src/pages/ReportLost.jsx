import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InternalLayout from "../components/InternalLayout";
import { apiFetch, getLoggedInUser } from "../api";

function ReportLost() {
  const navigate = useNavigate();
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const choose = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    const user = getLoggedInUser();
    if (!user?.id) return navigate("/login");
    if (!itemName.trim() || !category || !description.trim() || !date || !location.trim()) {
      return alert("Please fill all required details.");
    }
    try {
      setLoading(true);
      await apiFetch("/items", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, itemName, category, description, type: "LOST", date, location, image })
      });
      alert("Lost item report submitted successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <InternalLayout title="Report Lost Item" subtitle="Provide as much detail as possible to help others find your item.">
      <form className="report-form-card" onSubmit={submit}>
        <div className="form-title">
          <span>🔍</span>
          <div><h2>Lost Item Details</h2><p>Provide accurate information to help find your item.</p></div>
        </div>
        <div className="two-col">
          <label>Item Name *<input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Black Wallet" /></label>
          <label>Category *<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Select category</option><option>Mobile Phone</option><option>Wallet</option><option>ID Card</option><option>Bag</option><option>Watch</option><option>Keys</option><option>Other</option></select></label>
        </div>
        <label>Description *<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter detailed description..." /></label>
        <div className="two-col">
          <label>Date Lost *<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label>Location *<input value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter location" /></label>
        </div>
        <label>Upload Image
          <div className="upload-area upload-preview-area">
            {image ? <img src={image} alt="Selected item" /> : <span className="upload-icon">📷</span>}
            <small>{image ? "Image selected — click to change" : "Click to upload or drag and drop"}</small>
            <input type="file" accept="image/*" onChange={choose} />
          </div>
        </label>
        <div className="form-actions"><Link to="/dashboard" className="secondary-btn">Cancel</Link><button className="primary-btn" disabled={loading}>{loading ? "Submitting..." : "Submit Report"}</button></div>
      </form>
    </InternalLayout>
  );
}
export default ReportLost;
