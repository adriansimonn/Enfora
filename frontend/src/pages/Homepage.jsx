import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import homepageLogoAnimation from '../assets/logos/HomepageLogoAnimation.mov';
import createTaskImg from '../assets/homepageImages/1-CreateTask.png';
import setStakeImg from '../assets/homepageImages/2-SetStake.png';
import uploadEvidenceImg from '../assets/homepageImages/3-UploadEvidence.png';
import taskCompletedImg from '../assets/homepageImages/4-TaskCompleted.png';
import taskFailedImg from '../assets/homepageImages/5-TaskFailed.png';

const MOTTOS = [
  'Enforce Your Goals.',
  'Enforce Your Progress.',
  'Enforce Your Success.'
];

export default function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [motto, setMotto] = useState('');
  const [hoveredStep, setHoveredStep] = useState(1);

  useEffect(() => {
    // Set page title
    document.title = 'Enfora';

    // Pick a random motto on component mount
    const randomMotto = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];
    setMotto(randomMotto);
  }, []);

  const steps = [
    {
      number: 1,
      title: 'Create a task',
      description: 'Set a deadline and define what "done" looks like. Be specific.',
      image: createTaskImg
    },
    {
      number: 2,
      title: 'Put money on the line',
      description: "Choose how much you'll lose if you don't complete it. Make it hurt enough to matter.",
      image: setStakeImg
    },
    {
      number: 3,
      title: 'Submit proof',
      description: "Upload screenshots, photos, or documents as evidence when you're done.",
      image: uploadEvidenceImg
    },
    {
      number: 4,
      title: 'AI verifies proof',
      description: 'Pass - you keep your money. Fail - try again.',
      image: taskCompletedImg
    },
    {
      number: 5,
      title: 'Deadline passes',
      description: "No sufficient proof? You're automatically charged.",
      image: taskFailedImg
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      {/* Hero Section - black */}
      <section className="relative grid lg:grid-cols-2 items-center lg:min-h-screen bg-black">
        {/* Left - Text & CTA */}
        <div className="px-6 lg:pl-16 xl:pl-24 pt-32 pb-16 lg:py-32 text-center lg:text-left">
          <h1 className="text-5xl lg:text-6xl font-light text-white mb-6 tracking-[-0.02em] leading-[1.1]">
            {motto}
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 font-light leading-[1.6]">
            Enfora is a productivity platform that actually holds you accountable.
            Failure to complete your tasks in time results in an automatic charge.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center lg:justify-start gap-3">
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

        {/* Right - Logo Animation */}
        <div className="relative h-[60vh] lg:h-screen">
          <video
            src={homepageLogoAnimation}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          ></video>
        </div>
      </section>

      {/* How To Use - black */}
      <section className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <h2 className="text-3xl font-light mb-16 text-center tracking-[-0.01em]">
            How To Use Enfora
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left side - Steps */}
            <div>
              <div className="divide-y divide-white/[0.08]">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-8 items-baseline py-6 group cursor-pointer"
                    onMouseEnter={() => setHoveredStep(step.number)}
                  >
                    <span className="flex-shrink-0 text-white/30 font-light text-xl tabular-nums group-hover:text-white/70 transition-colors duration-300">
                      0{step.number}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-[17px] font-normal mb-2">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed text-[14px] font-light">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Image display */}
            <div className="lg:self-center">
              <div className="relative aspect-[4/3]">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      hoveredStep === step.number ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Actually Works - white */}
      <section className="bg-white text-black">
        <div className="max-w-4xl mx-auto px-6 py-28">
          <h2 className="text-3xl font-light mb-4 text-center tracking-[-0.01em]">
            Why It Actually Works
          </h2>
          <p className="text-[15px] text-gray-600 mb-16 text-center max-w-2xl mx-auto font-light leading-relaxed">
            Enfora is built on <span className="text-black font-normal">loss aversion</span>, the
            principle that losing money hurts far more than gaining it feels good. That asymmetry
            is what turns your intentions into obligations.
          </p>
          <div className="grid md:grid-cols-3 gap-x-10 gap-y-12">
            <div className="border-t border-black/[0.15] pt-6">
              <p className="font-normal mb-2 text-[15px]">Consequences create urgency</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">
                When skipping a task costs you money, "later" stops being an option.
              </p>
            </div>
            <div className="border-t border-black/[0.15] pt-6">
              <p className="font-normal mb-2 text-[15px]">Deadlines become real</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">
                Enforcement is automatic. There is no snoozing, renegotiating, or quietly letting it slide.
              </p>
            </div>
            <div className="border-t border-black/[0.15] pt-6">
              <p className="font-normal mb-2 text-[15px]">Goals carry weight</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">
                Backing a goal with your own money forces you to commit to it seriously.
              </p>
            </div>
          </div>
          <p className="text-[16px] text-center font-light mt-16">
            When failure has an immediate cost, success becomes non-negotiable.
          </p>
        </div>
      </section>

      {/* Who Enfora Is For - black */}
      <section className="bg-black text-white">
        <div className="max-w-5xl mx-auto px-6 py-28">
          <h2 className="text-3xl font-light mb-3 text-center tracking-[-0.01em]">
            Who Enfora Is For
          </h2>
          <p className="text-[15px] text-gray-400 mb-16 text-center max-w-2xl mx-auto font-light leading-relaxed">
            Enfora is <span className="text-white font-normal">not</span> for everyone.
            It is brute-force accountability, built for people willing to put real money
            behind their word.
          </p>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 max-w-3xl mx-auto">
            <div className="border-l border-white/[0.15] pl-6">
              <h3 className="text-[16px] font-normal mb-1.5">Students</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">Exams to study for, assignments to finish, applications to submit on time.</p>
            </div>

            <div className="border-l border-white/[0.15] pl-6">
              <h3 className="text-[16px] font-normal mb-1.5">Builders & Founders</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">Features to ship and launches that can't keep slipping another week.</p>
            </div>

            <div className="border-l border-white/[0.15] pl-6">
              <h3 className="text-[16px] font-normal mb-1.5">Fitness & Health</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">Workouts, routines, and habits that survive past the first two weeks.</p>
            </div>

            <div className="border-l border-white/[0.15] pl-6">
              <h3 className="text-[16px] font-normal mb-1.5">Professionals</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">Deadlines, certifications, and side projects that keep getting deferred.</p>
            </div>

            <div className="border-l border-white/[0.15] pl-6 md:col-span-2">
              <h3 className="text-[16px] font-normal mb-1.5">Anyone tired of quitting on themselves</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">If you keep making promises to yourself and breaking them, Enfora is for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Track Your Discipline - white */}
      <section className="bg-white text-black">
        <div className="max-w-4xl mx-auto px-6 py-28">
          <h2 className="text-3xl font-light mb-3 text-center tracking-[-0.01em]">
            Track Your Discipline
          </h2>
          <p className="text-[15px] text-gray-600 mb-16 text-center font-light">
            Enfora doesn't just enforce action, it shows you how reliable you actually are.
          </p>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
            <div className="border-t border-black/[0.15] pt-5">
              <p className="font-normal text-[15px] mb-1">Reliability Score</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">Your most critical metric: compete on the leaderboard</p>
            </div>
            <div className="border-t border-black/[0.15] pt-5">
              <p className="font-normal text-[15px] mb-1">Stakes at Risk</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">See how much you have on the line</p>
            </div>
            <div className="border-t border-black/[0.15] pt-5">
              <p className="font-normal text-[15px] mb-1">Completion Rate</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">Track your success percentage over time</p>
            </div>
            <div className="border-t border-black/[0.15] pt-5">
              <p className="font-normal text-[15px] mb-1">Money Saved</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">Every completed task is money you didn't lose</p>
            </div>
            <div className="border-t border-black/[0.15] pt-5">
              <p className="font-normal text-[15px] mb-1">Active Streaks</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">Build momentum with consistent follow-through</p>
            </div>
            <div className="border-t border-black/[0.15] pt-5">
              <p className="font-normal text-[15px] mb-1">Task History</p>
              <p className="text-[13px] text-gray-600 leading-relaxed font-light">Full analytics on your performance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Built on Trust - black */}
      <section className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-28 pb-40">
          <h2 className="text-3xl font-light mb-3 text-center tracking-[-0.01em]">
            Built on Trust
          </h2>
          <p className="text-[15px] text-gray-400 mb-16 text-center font-light">
            You're always in control. We're just here to hold you accountable.
          </p>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            <div className="border-t border-white/[0.15] pt-6">
              <h3 className="text-[16px] font-normal mb-2">Secure Payments and 2FA</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">Bank-level encryption for all transactions and accounts shielded by two-factor authentication.</p>
            </div>

            <div className="border-t border-white/[0.15] pt-6">
              <h3 className="text-[16px] font-normal mb-2">No Hidden Fees</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">What you stake is what you risk. Nothing more.</p>
            </div>

            <div className="border-t border-white/[0.15] pt-6">
              <h3 className="text-[16px] font-normal mb-2">Funds Only Charged on Failure</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">Complete your task and you never pay anything.</p>
            </div>

            <div className="border-t border-white/[0.15] pt-6">
              <h3 className="text-[16px] font-normal mb-2">Transparent & Fair System</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed font-light">Clear enforcement rules and fair evidence review powered by AI and human review panels.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
