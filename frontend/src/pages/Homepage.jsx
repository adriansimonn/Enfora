import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import emblemLogo from '../assets/logos/emblem_logo_t_light.png';

const MOTTOS = [
  'Accountability, Automated.',
  'Bet Against Your Failures.',
  'Commit. Deliver. Repeat.',
  'Enforce Your Productivity.',
  'Your Goals. Enforced.',
  'Accountability That Bites.',
  'Own Your Outcomes.',
  'Bet on Yourself.',
  'Enforce Your Progress.',
  'Enforce Your Success.'
];

export default function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [motto, setMotto] = useState('');

  useEffect(() => {
    // Pick a random motto on component mount
    const randomMotto = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];
    setMotto(randomMotto);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      <Navigation />

      <div className="relative">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center">
            {/* Emblem Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
                <img
                  src={emblemLogo}
                  alt="Enfora"
                  className="h-32 w-auto relative z-10"
                />
              </div>
            </div>

            {/* Hero Text */}
            <h1 className="text-6xl font-normal text-white mb-6 tracking-tight">
              {motto}
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
              A powerful platform for task management and evidence-based verification.
              Track, validate, and enforce accountability with cutting-edge technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex justify-center gap-4">
              {!user ? (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 bg-white text-black font-semibold rounded-lg"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 bg-zinc-800 text-white font-semibold rounded-lg border border-zinc-700"
                  >
                    Login
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 bg-white text-black font-semibold rounded-lg"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Task Verification</h3>
              <p className="text-gray-400">
                Submit evidence and get instant AI-powered verification for your completed tasks.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Tracking</h3>
              <p className="text-gray-400">
                Monitor task progress and status updates in real-time with powerful analytics.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-400">
                Your data is encrypted and protected with enterprise-grade security measures.
              </p>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10"></div>
        </div>
      </div>
    </div>
  );
}
