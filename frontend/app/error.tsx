"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Animated Error Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-white/10 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-6xl">⚠️</span>
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-300 text-lg mb-8">
          We apologize for the inconvenience. An unexpected error occurred while processing your request.
        </p>
        
        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-black/30 rounded-lg p-4 mb-8 text-left overflow-auto max-h-40">
            <p className="text-red-300 font-mono text-sm break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-gray-400 font-mono text-xs mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 bg-yellow-400 text-gray-900 rounded-full font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
          >
            🔄 Try Again
          </button>
          <Link 
            href="/"
            className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all border border-white/30"
          >
            🏠 Go Home
          </Link>
        </div>
        
        {/* Support Info */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-400 mb-2">
            If the problem persists, please contact support:
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm">
            <a href="tel:0387633141" className="text-yellow-400 hover:underline flex items-center justify-center gap-2">
              📞 0387.633.141
            </a>
            <span className="hidden sm:inline text-gray-600">•</span>
            <a href="mailto:info@lera.edu.vn" className="text-yellow-400 hover:underline flex items-center justify-center gap-2">
              ✉️ info@lera.edu.vn
            </a>
          </div>
        </div>
        
        {/* Branding */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-900 font-bold">L</span>
          </div>
          <span className="text-white font-bold">LERA Academy</span>
        </div>
      </div>
    </div>
  );
}
