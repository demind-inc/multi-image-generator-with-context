import React from "react";
import styles from "./Footer.module.scss";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footer__content}>
        <p>© 2026 NanoGen AI — Gemini 3 Pro Engine</p>
      </div>
    </footer>
  );
};

export default Footer;
