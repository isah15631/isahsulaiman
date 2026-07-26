import { useState } from "react";

export default function Contact() {
  const [note, setNote] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // Placeholder handler: wire this to your email service / backend.
    setNote("Thanks! This is a demo form. Connect it to your email service to receive messages.");
    e.target.reset();
  };

  return (
    <section className="section contact" id="contact">
      <div className="contact-inner">
        <h2 className="contact-title">Let's Work<br />Together</h2>
        <p className="contact-sub">
          Have a project in mind or just want to say hi? Drop your email and I'll get back to you.
        </p>
        <form className="contact-form" onSubmit={onSubmit}>
          <input type="email" placeholder="YOUR EMAIL" required aria-label="Your email" />
          <button type="submit" className="btn btn-primary">Send</button>
        </form>
        <p className="contact-note">{note}</p>
      </div>
    </section>
  );
}
