import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (value.length > 1) value = value.slice(0, 1); // Only allow one char
    if (!/^\d*$/.test(value)) return; // Only numbers
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.join('').length !== 6) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/admin'); // Or appropriate dashboard
    }, 1500);
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-5"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <div className="glass-card p-8 md:p-10 border-t-4 border-primary">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.4)] mb-4 border border-blue-500/30">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
            <p className="text-slate-400 text-sm">
              Enter the 6-digit verification code sent to your registered device.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-2 md:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold text-white bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || code.join('').length !== 6}
              className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all ${(isLoading || code.join('').length !== 6) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
            
            <div className="text-center mt-6">
              <span className="text-sm text-slate-400">Didn't receive code? </span>
              <button type="button" className="text-sm font-medium text-primary hover:text-blue-400 transition-colors">
                Resend SMS
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorAuth;
