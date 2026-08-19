import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';

export const RedactedValue: React.FC<{ value: string | null | undefined, placeholderWidth?: string, copyable?: boolean }> = ({ value, placeholderWidth = '200px', copyable = true }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  if (!value) {
    return <span className="redaction-bar" style={{ minWidth: placeholderWidth }}>[REDACTED]</span>;
  }

  const handleCopy = () => {
    if (!copyable) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
  };

  const displayValue = copyable && value.length > 20 ? value.substring(0, 10) + '...' + value.substring(value.length - 8) : value;
  console.log('RedactedValue rendering with value:', value, 'displayValue:', displayValue);

  return (
    <span className="inline-flex items-center gap-2 group relative">
      <span className="redaction-revealed">{displayValue}</span>
      {copyable && (
        <button type="button" onClick={handleCopy} className="text-cv-text-secondary hover:text-cv-accent transition-colors p-1" title="Copy value">
          <Copy className="w-4 h-4" />
          <span className={`stamp-tooltip ${copied ? 'opacity-100' : ''}`}>COPIED</span>
        </button>
      )}
    </span>
  );
};
