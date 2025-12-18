import { Phone, Mail } from 'lucide-react';

export default function SupportFooter() {
  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 shadow-lg z-50"
      aria-label="Customer support"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6">
          {/* Left side - Support text (hidden on mobile) */}
          <div className="hidden sm:block">
            <p className="text-base font-semibold text-white">Need help?</p>
          </div>

          {/* Center - Contact options */}
          <nav 
            className="flex items-center justify-center gap-6"
            aria-label="Support contact options"
          >
            {/* Phone */}
            <a 
              href="tel:+12019999999" 
              className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg px-3 py-2 transition-all duration-200 min-h-[44px]"
              title="Call customer support"
              aria-label="Call customer support at 201-999-9999"
            >
              <Phone size={18} aria-hidden="true" className="text-blue-400" />
              <span className="text-sm font-semibold">201-999-9999</span>
            </a>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-600" aria-hidden="true"></div>

            {/* Email */}
            <a 
              href="mailto:support@example.com" 
              className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg px-3 py-2 transition-all duration-200 min-h-[44px]"
              title="Email customer support"
              aria-label="Email customer support at support@example.com"
            >
              <Mail size={18} aria-hidden="true" className="text-blue-400" />
              <span className="text-sm font-semibold">support@example.com</span>
            </a>
          </nav>

          {/* Right side - Status indicator (hidden on mobile) */}
          <div 
            className="hidden sm:flex items-center gap-2"
            aria-live="polite"
            aria-label="Support status"
          >
            <div 
              className="w-3 h-3 bg-green-400 rounded-full animate-pulse" 
              aria-hidden="true"
            ></div>
            <span className="text-sm text-slate-300">Support available</span>
          </div>
        </div>
      </div>
    </footer>
  );
}