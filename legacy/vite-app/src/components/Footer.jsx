export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <a href="#top" className="brand footer-brand">Isah Sulaiman</a>
        <div className="footer-social">
          <a href="#">GitHub</a>
          <a href="#">LinkedIn</a>
          <a href="#">X / Twitter</a>
          <a href="#">Email</a>
        </div>
        <p className="footer-copy">&copy; {year} Isah Sulaiman. All rights reserved.</p>
      </div>
    </footer>
  );
}
