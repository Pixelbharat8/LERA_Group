export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto relative">
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full animate-spin"></div>
            
            {/* Logo center */}
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-xl">
              <span className="text-blue-900 font-bold text-3xl">L</span>
            </div>
          </div>
        </div>
        
        {/* Loading text with animated dots */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-white text-xl font-medium">Loading</span>
          <span className="flex gap-1">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
          </span>
        </div>
        
        {/* Brand tagline */}
        <p className="text-gray-400 mt-4 text-sm">
          Where Excellence is the Standard
        </p>
      </div>
    </div>
  );
}
