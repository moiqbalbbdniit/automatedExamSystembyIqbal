export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 border-t border-slate-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Container */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          {/* Left Section */}
          <p className="text-xs sm:text-sm">
            © {new Date().getFullYear()}{" "}
            <span className="text-blue-400 font-semibold">AI Exam System</span>.  
            Built with ❤️ by{" "}
            <a
              href="https://algoforgestudios.com"
              target="_blank"
              className="hover:text-white transition-colors font-medium"
              rel="noopener noreferrer"
            >
              AlgoforgeStudios.com
            </a>
          </p>

          {/* Right Section */}
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a
              href="https://algoforgestudios.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Visit Us
            </a>
            <a href="/contact" className="hover:text-white transition-colors">
              Contact Us
            </a>
          </div>
        </div>

        {/* Divider Line */}
        <div className="mt-6 border-t border-slate-800"></div>

        {/* Bottom Small Text */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Designed for modern, secure, and intelligent online exams.
        </div>
      </div>
    </footer>
  );
}
