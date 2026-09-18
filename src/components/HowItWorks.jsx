function HowItWorks() {
  const steps = [
    ["01","🔴","Report","Report a lost or found item with important details and an image."],
    ["02","🔍","Discover","Browse reports and discover possible matches for your item."],
    ["03","🤝","Reunite","Connect with the other person and complete the return process."]
  ];
  return (
    <section className="how-it-works">
      <div className="section-heading">
        <p className="section-label">HOW IT WORKS</p>
        <h2>From Lost to Reunited</h2>
        <p>LostLoop makes it simple to report, discover and reconnect with lost belongings.</p>
      </div>
      <div className="steps">
        {steps.map(([n,icon,title,text]) => (
          <div className="step-card" key={n}><div className="step-number">{n}</div><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>
        ))}
      </div>
    </section>
  );
}
export default HowItWorks;
