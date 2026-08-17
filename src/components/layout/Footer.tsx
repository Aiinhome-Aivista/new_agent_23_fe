import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-light-border bg-card px-6 py-3 flex justify-center items-center">
      <p className="font-footer-text">
        Powered by PwC AI Architecture Team • Enterprise Unit-Test Agent © {new Date().getFullYear()}
      </p>
    </footer>
  );
};
