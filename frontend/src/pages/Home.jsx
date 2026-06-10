import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/30">
            D
          </div>

          <h1 className="text-2xl font-bold tracking-wide">
            Docu<span className="text-blue-500">Flow</span>
          </h1>
        </div>

        {/* Login Button */}
        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 px-5 py-2 rounded-xl font-medium shadow-md shadow-blue-500/20"
        >
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight max-w-4xl">
          Secure & Smart <span className="text-blue-500">Document</span>
          <br />
          Management System
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-2xl leading-relaxed">
          Store, manage, and access your important documents anytime with secure
          cloud storage. DocuFlow helps individuals and organizations organize
          files efficiently with speed, security, and simplicity.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex gap-5 flex-wrap justify-center">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 px-7 py-3 rounded-xl text-lg font-semibold transition duration-300 shadow-lg shadow-blue-500/30"
          >
            Get Started
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 w-full max-w-6xl">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-blue-500 transition duration-300">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">
              Secure Storage
            </h3>
            <p className="text-gray-400">
              Keep your documents safe with encrypted cloud-based storage.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-blue-500 transition duration-300">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">
              Easy Access
            </h3>
            <p className="text-gray-400">
              Access your files anytime, anywhere from any device.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-blue-500 transition duration-300">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">
              Fast Management
            </h3>
            <p className="text-gray-400">
              Upload, organize, and manage documents with a smooth workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-5 text-center text-gray-500">
        © 2026 DMS. All Rights Reserved.
      </footer>
    </div>
  );
}
