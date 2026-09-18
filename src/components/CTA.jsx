import { Link } from "react-router-dom";
function CTA() {
  return (
    <section className="cta">
      <div><p className="section-label">READY TO HELP?</p><h2>Help reconnect what matters.</h2><p>Every report brings a lost item one step closer to its owner.</p></div>
      <div className="cta-actions"><Link to="/login">Report an Item</Link><Link to="/signup">Join LostLoop</Link></div>
    </section>
  );
}
export default CTA;
