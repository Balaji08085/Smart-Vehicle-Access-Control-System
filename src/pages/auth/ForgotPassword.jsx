import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 opacity-5"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full blur-[150px] opacity-20 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <div className="glass-card p-8 md:p-10">
          
          <Link to="/login/admin" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>

          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg mb-4 border border-white/10">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-slate-400">Enter your email or register number to receive reset instructions.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address / Register Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="e.g. admin@mccmrf.edu"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all ${isLoading ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="inline-flex p-4 rounded-2xl bg-emerald-500/20 mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Email Sent</h3>
              <p className="text-slate-400 mb-8">
                We've sent password reset instructions to your registered email address.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary hover:text-blue-400 text-sm font-medium transition-colors"
              >
                Try another email
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
