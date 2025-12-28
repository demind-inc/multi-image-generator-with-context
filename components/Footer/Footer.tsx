import React from "react";
import "./Footer.scss";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        <p>© 2024 NanoGen AI — Gemini 3 Pro Engine</p>
        <div className="footer__status">
          <span>
            <span className="status-dot status-dot--green" />
            Character Identity Locked
          </span>
          <span>
            <span className="status-dot status-dot--blue" />
            Lifestack Slideshow Optimized
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
