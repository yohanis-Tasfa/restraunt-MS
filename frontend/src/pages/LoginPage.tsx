import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, Mail, X, CheckCircle2, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Manager', email: 'manager@rms.com', password: 'manager123', badge: 'Operations' },
  { label: 'Admin', email: 'admin@rms.com', password: 'admin123', badge: 'Full Access' },
  { label: 'Cashier', email: 'cashier@rms.com', password: 'cashier123', badge: 'POS & Billing' },
  { label: 'Waiter', email: 'waiter@rms.com', password: 'waiter123', badge: 'Floors & Orders' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      toast.error('Please enter your staff email or username');
      return;
    }

    try {
      setForgotLoading(true);
      const res: any = await authApi.forgotPassword(forgotIdentifier.trim());
      setForgotSent(true);
      toast.success(res?.message || 'Password reset link sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      console.log('Login success:', data);
      setAuth(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.firstName || data.user.username}!`);
      navigate('/');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email/username and password');
      return;
    }
    loginMutation.mutate({ email: email.trim(), password: password.trim() });
  };

  const autofill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    toast.success(`Filled ${acc.label} credentials! Click 'Sign In'.`, { id: 'autofill-toast' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-orange-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white mb-3 shadow-md shadow-green-600/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Yoni Restaurant</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Restaurant Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Email Address or Username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder-gray-400"
                placeholder="manager@rms.com or manager"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(email || '');
                    setForgotSent(false);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition placeholder-gray-400"
                  placeholder="manager123"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 px-4 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Autofill section */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2.5 text-center uppercase tracking-wider">
              Quick Autofill Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => autofill(acc)}
                  className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-emerald-50 hover:border-emerald-300 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">{acc.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-gray-500 border border-gray-200 group-hover:border-emerald-200 group-hover:text-emerald-700 font-medium">
                      {acc.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">{acc.email}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">pwd: {acc.password}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: FORGOT PASSWORD ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <Mail className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Forgot Your Password?</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Reset Email Dispatched!</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We've sent a 15-minute secure password reset link to{' '}
                  <strong className="text-gray-900">{forgotIdentifier}</strong>.
                  Please check your inbox (and spam folder) to set your new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Got It, Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enter your registered staff email address or username. We'll send you an instant reset link to create a new password.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Staff Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. yohanistesfa457@gmail.com or jo"
                    className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
