
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, Mic2, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#131b2b] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Animated 404 with comedy theme */}
        <div className="mb-8 relative">
          <div className="text-8xl md:text-9xl font-bold text-white/20 mb-4">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Mic2 className="w-16 h-16 md:w-20 md:h-20 text-yellow-400 animate-pulse" />
          </div>
        </div>

        {/* Main message */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Looks like this page bombed!
          </h1>
          <p className="text-xl text-white/80 mb-2">
            Even the best comedians have off nights.
          </p>
          <p className="text-lg text-white/60">
            The page you're looking for seems to have left the stage.
          </p>
        </div>

        {/* Error details in a styled box */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 text-orange-300 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Route not found:</span>
          </div>
          <code className="text-white/80 bg-black/30 px-3 py-1 rounded text-sm">
            {location.pathname}
          </code>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium">
            <Link to="/">
              <Home className="w-5 h-5 mr-2" />
              Back to Stage
            </Link>
          </Button>
          <Button asChild className="professional-button border-white/20 text-white hover:bg-white/10">
            <Link to="/browse">
              <Search className="w-5 h-5 mr-2" />
              Find Shows
            </Link>
          </Button>
        </div>

        {/* Fun comedy-themed message */}
        <div className="mt-8 text-white/60 text-sm">
          <p>💡 Pro tip: Check the URL for typos, or try searching for what you need!</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
