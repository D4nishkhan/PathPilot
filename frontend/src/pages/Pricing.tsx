import { Link } from 'react-router-dom';
import { CheckCircle, X, Zap, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Get started with the basics',
    features: [
      { text: '1 AI Roadmap', included: true },
      { text: '3 Learning Tracks', included: true },
      { text: '10 AI Tutor messages/day', included: true },
      { text: 'Basic Analytics', included: true },
      { text: 'All Learning Tracks', included: false },
      { text: 'Unlimited AI Tutor', included: false },
      { text: 'Mock Interviews', included: false },
      { text: 'Advanced Analytics', included: false },
      { text: 'Unlimited Roadmaps', included: false },
    ],
    cta: 'Get Started',
    ctaTo: '/signup',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '₹499',
    period: '/month',
    description: 'Everything you need to get hired',
    features: [
      { text: 'Unlimited AI Roadmaps', included: true },
      { text: 'All Learning Tracks', included: true },
      { text: 'Unlimited AI Tutor', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'Mock Interviews (5 modes)', included: true },
      { text: 'Interview Reports & Scoring', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Exclusive Premium Tracks', included: true },
      { text: 'Badge & Certification', included: true },
    ],
    cta: 'Start Premium',
    ctaTo: '/signup',
    highlighted: true,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#06070f] text-slate-200">
      {/* Navbar */}
      <nav className="glass border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">PathPilot</span>
        </Link>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ghost text-sm">Login</Link>
          <Link to="/signup" className="btn-primary text-sm">Sign Up Free</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="badge badge-primary mb-4 px-4 py-2">Simple Pricing</div>
          <h1 className="text-5xl font-extrabold mb-4">
            Choose Your <span className="gradient-text">Learning Plan</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Start free and upgrade when you need more power. No hidden fees, no commitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-7 relative ${
                plan.highlighted
                  ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-600/5 to-purple-600/5'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="badge badge-premium px-4 py-1.5 text-sm">✨ Most Popular</span>
                </div>
              )}

              <h2 className="text-2xl font-bold text-slate-100 mb-1">{plan.name}</h2>
              <p className="text-slate-500 text-sm mb-4">{plan.description}</p>

              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold text-slate-100">{plan.price}</span>
                <span className="text-slate-500 pb-1">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    {feature.included ? (
                      <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                    ) : (
                      <X size={16} className="text-slate-700 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.ctaTo}
                className={`w-full text-center block py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? 'btn-primary justify-center'
                    : 'btn-secondary justify-center'
                }`}
              >
                {plan.cta} <ArrowRight size={16} className="inline ml-1" />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes! You can cancel your premium subscription anytime. You\'ll retain access until the end of the billing period.' },
              { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, and net banking via Razorpay (India\'s trusted payment gateway).' },
              { q: 'Is there a student discount?', a: 'We offer special pricing for college students. Contact us with your college email for a 40% discount.' },
              { q: 'Can I get a refund?', a: 'Yes, within 7 days of purchase if you\'re not satisfied. Just email us.' },
            ].map((faq) => (
              <div key={faq.q} className="glass-card p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
