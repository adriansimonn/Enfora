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

// Interactive gradient box component
function InteractiveGradientBox({ children, gradientColors, className = '' }) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const gradient = `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${gradientColors.join(', ')})`;

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      style={{ background: gradient }}
    >
      {children}
    </div>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [motto, setMotto] = useState('');

  useEffect(() => {
    // Set page title
    document.title = 'Enfora';

    // Pick a random motto on component mount
    const randomMotto = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];
    setMotto(randomMotto);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="relative">
        {/* Hero Section */}
        <div className="max-w-[1280px] mx-auto px-6 pt-32 pb-40">
          <div className="text-center">
            {/* Emblem Logo */}
            <div className="flex justify-center mb-12">
              <div className="relative inline-block">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                <img
                  src={emblemLogo}
                  alt="Enfora"
                  className="h-36 w-auto relative z-10"
                />
              </div>
            </div>

            {/* Hero Text */}
            <h1 className="text-6xl font-light text-white mb-6 tracking-[-0.02em] leading-[1.1] max-w-4xl mx-auto">
              {motto}
            </h1>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-[1.6]">
              Enfora is a productivity platform that actually holds you accountable.
              Failure to complete your tasks in time results in an automatic charge.
            </p>

            {/* CTA Buttons */}
            <div className="flex justify-center gap-3">
              {!user ? (
                <>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-8 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                  >
                    Login
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Problem Section */}
        <div className="max-w-[1280px] mx-auto px-6 py-28">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-light text-white mb-3 text-center tracking-[-0.01em]">
              Why Motivation Fails
            </h2>
            <div className="space-y-6">
              <p className="text-center mb-14 text-gray-500 text-[15px] font-light">
                We've all been there. You set a goal, feel excited for a day or two, then life gets in the way.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <InteractiveGradientBox
                  className="rounded-2xl p-7 relative overflow-hidden transition-all duration-200 shadow-lg"
                  gradientColors={['rgba(250, 250, 250, 1)', 'rgba(235, 235, 235, 1)', 'rgba(220, 220, 220, 1)']}
                >
                  <div className="text-red-600 mb-2.5 text-lg font-light relative z-10">✗</div>
                  <p className="text-black font-normal mb-1.5 text-[15px] relative z-10">Motivation is unreliable</p>
                  <p className="text-[13px] text-gray-700 leading-relaxed font-light relative z-10">It fades when you need it most</p>
                </InteractiveGradientBox>
                <InteractiveGradientBox
                  className="rounded-2xl p-7 relative overflow-hidden transition-all duration-200 shadow-lg"
                  gradientColors={['rgba(250, 250, 250, 1)', 'rgba(235, 235, 235, 1)', 'rgba(220, 220, 220, 1)']}
                >
                  <div className="text-red-600 mb-2.5 text-lg font-light relative z-10">✗</div>
                  <p className="text-black font-normal mb-1.5 text-[15px] relative z-10">To-do lists don't enforce anything</p>
                  <p className="text-[13px] text-gray-700 leading-relaxed font-light relative z-10">They just sit there, ignored</p>
                </InteractiveGradientBox>
                <InteractiveGradientBox
                  className="rounded-2xl p-7 relative overflow-hidden transition-all duration-200 shadow-lg"
                  gradientColors={['rgba(250, 250, 250, 1)', 'rgba(235, 235, 235, 1)', 'rgba(220, 220, 220, 1)']}
                >
                  <div className="text-red-600 mb-2.5 text-lg font-light relative z-10">✗</div>
                  <p className="text-black font-normal mb-1.5 text-[15px] relative z-10">Deadlines have no consequences</p>
                  <p className="text-[13px] text-gray-700 leading-relaxed font-light relative z-10">Missing them has no immediate cost</p>
                </InteractiveGradientBox>
                <InteractiveGradientBox
                  className="rounded-2xl p-7 relative overflow-hidden transition-all duration-200 shadow-lg"
                  gradientColors={['rgba(250, 250, 250, 1)', 'rgba(235, 235, 235, 1)', 'rgba(220, 220, 220, 1)']}
                >
                  <div className="text-red-600 mb-2.5 text-lg font-light relative z-10">✗</div>
                  <p className="text-black font-normal mb-1.5 text-[15px] relative z-10">No accountability</p>
                  <p className="text-[13px] text-gray-700 leading-relaxed font-light relative z-10">Nobody checks if you followed through</p>
                </InteractiveGradientBox>
              </div>
              <p className="text-center mt-14 text-lg text-white/90 font-light">
                Enfora fixes this by incorporating what other productivity apps don't: <span className="text-blue-400 font-normal">stakes</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div className="max-w-[1280px] mx-auto px-6 py-28">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-light text-white mb-16 text-center tracking-[-0.01em]">
              How Enfora Works
            </h2>
            <div className="space-y-5">
              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-11 h-11 bg-white/[0.03] rounded-xl flex items-center justify-center text-white/60 font-light text-base border border-white/[0.06] group-hover:border-white/[0.12] transition-all duration-300">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[17px] font-normal text-white mb-2">Create a task</h3>
                  <p className="text-gray-400 leading-relaxed text-[14px] font-light">Set a deadline and define what "done" looks like. Be specific.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-11 h-11 bg-white/[0.03] rounded-xl flex items-center justify-center text-white/60 font-light text-base border border-white/[0.06] group-hover:border-white/[0.12] transition-all duration-300">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[17px] font-normal text-white mb-2">Put money on the line</h3>
                  <p className="text-gray-400 leading-relaxed text-[14px] font-light">Choose how much you'll lose if you don't complete it. Make it hurt enough to matter.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-11 h-11 bg-white/[0.03] rounded-xl flex items-center justify-center text-white/60 font-light text-base border border-white/[0.06] group-hover:border-white/[0.12] transition-all duration-300">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[17px] font-normal text-white mb-2">Submit proof</h3>
                  <p className="text-gray-400 leading-relaxed text-[14px] font-light">Upload screenshots, photos, or documents as evidence when you're done.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-11 h-11 bg-white/[0.03] rounded-xl flex items-center justify-center text-white/60 font-light text-base border border-white/[0.06] group-hover:border-white/[0.12] transition-all duration-300">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[17px] font-normal text-white mb-2">AI verifies proof</h3>
                  <p className="text-gray-400 leading-relaxed text-[14px] font-light">Pass → you keep your money. Fail → try again.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-11 h-11 bg-white/[0.03] rounded-xl flex items-center justify-center text-white/60 font-light text-base border border-white/[0.06] group-hover:border-white/[0.12] transition-all duration-300">
                  5
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[17px] font-normal text-white mb-2">Deadline passes</h3>
                  <p className="text-gray-400 leading-relaxed text-[14px] font-light">No sufficient proof? You're automatically charged.</p>
                </div>
              </div>

              <InteractiveGradientBox
                className="mt-14 p-6 border border-white/[0.06] rounded-2xl relative overflow-hidden transition-all duration-200"
                gradientColors={['rgba(59, 130, 246, 0.15)', 'rgba(147, 51, 234, 0.1)', 'rgba(0, 0, 0, 0.015)']}
              >
                <p className="text-white/90 text-center text-[15px] font-light relative z-10">
                  No excuses. No loopholes. Just follow-through.
                </p>
              </InteractiveGradientBox>
            </div>
          </div>
        </div>

        {/* Stakes Section */}
        <div className="max-w-[1280px] mx-auto px-6 py-28">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-light text-white mb-4 text-center tracking-[-0.01em]">
              Why It Actually Works
            </h2>
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-10 backdrop-blur-sm">
              <p className="text-[15px] text-gray-300 mb-10 leading-relaxed text-center font-light">
                Enfora works because it uses <span className="text-white font-normal">loss aversion</span>: the same principle
                that makes people hate losing money more than they enjoy gaining it.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚡</div>
                  <p className="text-white font-normal mb-1 text-[15px]">Real consequences</p>
                  <p className="text-[13px] text-gray-500 font-light">create real urgency</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">⏰</div>
                  <p className="text-white font-normal mb-1 text-[15px]">Deadlines</p>
                  <p className="text-[13px] text-gray-500 font-light">become unavoidable</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🎯</div>
                  <p className="text-white font-normal mb-1 text-[15px]">Goals</p>
                  <p className="text-[13px] text-gray-500 font-light">become serious</p>
                </div>
              </div>
              <p className="text-[16px] text-white text-center font-light">
                When failure has an immediate cost, success becomes non-negotiable.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="max-w-[1280px] mx-auto px-6 py-28">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-light text-white mb-3 text-center tracking-[-0.01em]">
              Who Enfora Is For
            </h2>
            <p className="text-[15px] text-gray-400 mb-14 text-center max-w-2xl mx-auto font-light">
              Enfora is <span className="text-white font-normal">not</span> for everyone. It is a system of brute-force accountability, transparency, and competition.
              Designed for those who are willing to take drastic action to see self improvement.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.025] hover:border-white/[0.09] transition-all duration-300 backdrop-blur-sm">
                <div className="text-2xl mb-3">📚</div>
                <h3 className="text-[16px] font-normal text-white mb-2">Students</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">Studying, assignments, applications</p>
              </div>

              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.025] hover:border-white/[0.09] transition-all duration-300 backdrop-blur-sm">
                <div className="text-2xl mb-3">🚀</div>
                <h3 className="text-[16px] font-normal text-white mb-2">Builders & Founders</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">Shipping features, launches</p>
              </div>

              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.025] hover:border-white/[0.09] transition-all duration-300 backdrop-blur-sm">
                <div className="text-2xl mb-3">💪</div>
                <h3 className="text-[16px] font-normal text-white mb-2">Fitness & Health</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">Workouts, habits, routines</p>
              </div>

              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.025] hover:border-white/[0.09] transition-all duration-300 backdrop-blur-sm">
                <div className="text-2xl mb-3">💼</div>
                <h3 className="text-[16px] font-normal text-white mb-2">Professionals</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">Deadlines, certifications, side projects</p>
              </div>

              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.025] hover:border-white/[0.09] transition-all duration-300 backdrop-blur-sm md:col-span-2 lg:col-span-2">
                <div className="text-2xl mb-3">🎯</div>
                <h3 className="text-[16px] font-normal text-white mb-2">Anyone tired of quitting on themselves</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">If you've made promises that you haven't lived up to and want to change. Enfora is for you.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="max-w-[1280px] mx-auto px-6 py-28">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-light text-white mb-3 text-center tracking-[-0.01em]">
              Track Your Discipline
            </h2>
            <p className="text-[15px] text-gray-400 mb-14 text-center font-light">
              Enfora doesn't just enforce action, it shows you how reliable you actually are.
            </p>
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-9 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-normal text-[15px] mb-0.5">Reliability Score</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-light">Your most critical metric: compete on the leaderboard</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-normal text-[15px] mb-0.5">Completion Rate</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-light">Track your success percentage over time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-normal text-[15px] mb-0.5">Active Streaks</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-light">Build momentum with consistent follow-through</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-normal text-[15px] mb-0.5">Stakes at Risk</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-light">See how much you have on the line</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-normal text-[15px] mb-0.5">Money Saved</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-light">Every completed task is money you didn't lose</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-white font-normal text-[15px] mb-0.5">Task History</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-light">Full analytics on your performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust and Safety Section */}
        <div className="max-w-[1280px] mx-auto px-6 py-28 pb-40">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-light text-white mb-3 text-center tracking-[-0.01em]">
              Built on Trust
            </h2>
            <p className="text-[15px] text-gray-400 mb-14 text-center font-light">
              You're always in control. We're just here to hold you accountable.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 backdrop-blur-sm hover:bg-white/[0.025] transition-all duration-300">
                <div className="w-10 h-10 bg-green-500/[0.08] rounded-xl flex items-center justify-center mb-4 border border-green-500/[0.15]">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-normal text-white mb-2">Secure Payments and 2FA</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">Bank-level encryption for all transactions and accounts shielded by two-factor authentication.</p>
              </div>

              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 backdrop-blur-sm hover:bg-white/[0.025] transition-all duration-300">
                <div className="w-10 h-10 bg-blue-500/[0.08] rounded-xl flex items-center justify-center mb-4 border border-blue-500/[0.15]">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-normal text-white mb-2">No Hidden Fees</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">What you stake is what you risk. Nothing more.</p>
              </div>

              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 backdrop-blur-sm hover:bg-white/[0.025] transition-all duration-300">
                <div className="w-10 h-10 bg-purple-500/[0.08] rounded-xl flex items-center justify-center mb-4 border border-purple-500/[0.15]">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-normal text-white mb-2">Funds Only Charged on Failure</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">Complete your task and you never pay anything.</p>
              </div>

              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-7 backdrop-blur-sm hover:bg-white/[0.025] transition-all duration-300">
                <div className="w-10 h-10 bg-orange-500/[0.08] rounded-xl flex items-center justify-center mb-4 border border-orange-500/[0.15]">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-normal text-white mb-2">Transparent & Fair System</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed font-light">Clear enforcement rules and fair evidence review powered by AI and human review panels.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] opacity-[0.15]"></div>
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-purple-600 rounded-full blur-[120px] opacity-[0.1]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-blue-500 rounded-full blur-[140px] opacity-[0.12]"></div>
        </div>
      </div>
    </div>
  );
}
