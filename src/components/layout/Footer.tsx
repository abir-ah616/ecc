import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-neutral-800 bg-[#090A0F] py-4 px-4 sm:px-6 select-none mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-200">ESP CALC</span>
          <span className="text-neutral-700">•</span>
          <span>Free Fire Tournament Calculator</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>By</span>
            <a
              href="https://mroppy.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>MR. OPPY</span>
              <ExternalLink className="h-3 w-3 text-neutral-500" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
