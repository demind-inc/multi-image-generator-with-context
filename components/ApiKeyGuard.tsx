
import React from 'react';

interface ApiKeyGuardProps {
  onKeySelected: () => void;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({ onKeySelected }) => {
  const handleOpenKeySelector = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Per instructions, assume success after triggering the dialog to avoid race conditions
      onKeySelected();
    } catch (error) {
      console.error("Failed to open key selector", error);
    }
  };

  return (
    <div className="api-key-guard">
      <div className="api-key-guard__dialog">
        <div className="api-key-guard__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="api-key-guard__title">API Key Required</h2>
        <p className="api-key-guard__text">
          Gemini 3 Pro Image Preview requires a paid API key from a Google Cloud project. Please select your key to continue.
        </p>
        <div className="api-key-guard__actions">
          <button onClick={handleOpenKeySelector} className="api-key-guard__primary">
            Select API Key
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="api-key-guard__link"
          >
            Learn more about billing & requirements
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyGuard;
