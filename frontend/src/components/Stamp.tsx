import React from 'react';

export type StampStatus = 'success' | 'pending' | 'error' | 'accent';

export const Stamp: React.FC<{ text: string, status: StampStatus, subtext?: string }> = ({ text, status, subtext }) => {
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className={`status-stamp stamp-${status}`}>
        {text}
      </div>
      {subtext && <span className="text-xs text-cv-text-secondary mt-1">{subtext}</span>}
    </div>
  );
};
