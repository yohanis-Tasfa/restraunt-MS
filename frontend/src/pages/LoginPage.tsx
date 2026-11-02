import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Mail,
  X,
  CheckCircle2,
  Loader2,
  Lock,
  User,
  ArrowLeft,
  LogIn,
  KeyRound,
} from 'lucide-react';
import restaurantBanner from '../assets/reartaunt image.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const saved = localStorage.getItem('rms_remembered_email');
    if (saved) {
      setEmail(saved);
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (rememberMe && email) {
        localStorage.setItem('rms_remembered_email', email.trim());
      } else {
        localStorage.removeItem('rms_remembered_email');
      }
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
      toast.error('Please enter username/email and password');
      return;
    }
    loginMutation.mutate({ email: email.trim(), password: password.trim() });
  };

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
      toast.success(res?.message || 'Password reset link dispatched!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden antialiased bg-[#030a07] text-white selection:bg-[#00e676] selection:text-black">
      {/* ================= BACKGROUND RESTAURANT IMAGE & COMPOSITE OVERLAYS ================= */}
      <img
        src={restaurantBanner}
        alt="Yoni Restaurant"
        className="fixed inset-0 w-full h-full object-cover object-left lg:object-center select-none pointer-events-none"
      />

      {/* Dark gradient & atmospheric tint to match reference design */}
      <div className="fixed inset-0 bg-gradient-to-r from-black/60 via-black/80 to-[#020b08]/95 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,230,118,0.12),transparent_60%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,230,118,0.15),transparent_50%)] pointer-events-none" />

      {/* Glowing neon green aesthetic curved waves dividing the screen */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none hidden lg:block overflow-visible z-0 opacity-80"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer subtle glow curve */}
        <path
          d="M860 -50 C760 220, 680 420, 720 620 C760 800, 890 880, 1020 950"
          fill="none"
          stroke="#00e676"
          strokeWidth="1.5"
          opacity="0.35"
        />
        {/* Main sharp neon wave curve */}
        <path
          d="M890 -50 C800 200, 730 400, 760 600 C790 760, 910 850, 1060 950"
          fill="none"
          stroke="#00e676"
          strokeWidth="2.5"
          filter="url(#neon-glow)"
        />
      </svg>

      {/* Decorative leaf silhouettes on the right perimeter */}
      <div className="fixed -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-emerald-600/20 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="fixed -bottom-16 -right-16 w-80 h-80 bg-gradient-to-tl from-emerald-500/25 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ================= TOP NAVIGATION BAR ================= */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-end">
          {/* Back to Website Pill Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full border border-white/20 bg-black/40 hover:bg-white/10 text-white text-xs sm:text-sm font-medium backdrop-blur-md transition duration-200 shadow-lg hover:border-white/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Website</span>
          </Link>
        </header>

        {/* ================= MAIN SPLIT CONTENT ================= */}
        <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12 my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* LEFT COLUMN: HERO TYPOGRAPHY & BRAND PROMISE */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-5 text-left">
            {/* Cursive "Welcome Back!" */}
            <p className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-[#00e676] font-semibold tracking-wide drop-shadow-[0_0_15px_rgba(0,230,118,0.4)]">
              Welcome Back!
            </p>

            {/* Main title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Yoni <span className="text-[#00e676] drop-shadow-[0_0_25px_rgba(0,230,118,0.5)]">Restaurant</span>
            </h1>

            {/* Tagline with green accent bar */}
            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-wide">
                Good Food. Great Service. Always.
              </h2>
              <div className="w-20 sm:w-24 h-1 bg-[#00e676] rounded-full mt-2.5 shadow-[0_0_12px_#00e676]" />
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-300 max-w-md leading-relaxed pt-1 drop-shadow-sm">
              Manage orders, serve with excellence, and be part of our great team.
            </p>
          </div>

          {/* RIGHT COLUMN: STAFF LOGIN CARD */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[430px] rounded-[32px] sm:rounded-[36px] bg-[#081510]/85 backdrop-blur-2xl border-2 border-[#00e676]/70 shadow-[0_0_40px_rgba(0,230,118,0.25),inset_0_0_20px_rgba(0,230,118,0.06)] p-7 sm:p-9 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Ambient inner green top corner highlights */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00e676]/15 rounded-full blur-2xl pointer-events-none" />

              {/* Chef Avatar Badge with glowing neon green ring */}
              <div className="text-center">
                <div className="relative w-20 h-20 rounded-full mx-auto bg-[#031d13] border-2 border-[#00e676] shadow-[0_0_25px_#00e676,inset_0_0_15px_rgba(0,230,118,0.35)] flex items-center justify-center">
                  {/* Custom Chef Line-Art SVG matching the reference design */}
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12 text-white"
                  >
                    {/* Puffy Chef Hat */}
                    <path
                      d="M20 28C17 28 15 25 16 22C17 19 20 18 22 19C23 15 27 13 32 13C37 13 41 15 42 19C44 18 47 19 48 22C49 25 47 28 44 28"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 28H44V32C44 33 43 34 42 34H22C21 34 20 33 20 32V28Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Face outline */}
                    <path
                      d="M24 34V37C24 41.4 27.6 45 32 45C36.4 45 40 41.4 40 37V34"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Eyes & Mustache */}
                    <circle cx="28" cy="37.5" r="1.3" fill="currentColor" />
                    <circle cx="36" cy="37.5" r="1.3" fill="currentColor" />
                    <path
                      d="M28 41.5C30 42.5 32 40.5 32 40.5C32 40.5 34 42.5 36 41.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Uniform / Shoulders */}
                    <path
                      d="M17 52C17 46 22 45 26 45L32 48L38 45C42 45 47 46 47 52"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Neon Buttons */}
                    <circle cx="32" cy="51" r="1.2" fill="#00e676" />
                    <circle cx="32" cy="55" r="1.2" fill="#00e676" />
                  </svg>
                </div>

                {/* Title: Staff Login */}
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-3.5 tracking-tight">
                  Staff <span className="text-[#00e676] drop-shadow-[0_0_12px_rgba(0,230,118,0.5)]">Login</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-300/80 mt-1 font-normal">
                  Enter your credentials to access the system
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                {/* Username Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Username or Staff Email"
                    className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base bg-[#0f2119]/85 border border-[#1b3d2e] focus:border-[#00e676] rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 transition shadow-inner"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3.5 text-sm sm:text-base bg-[#0f2119]/85 border border-[#1b3d2e] focus:border-[#00e676] rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 transition shadow-inner font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white cursor-pointer transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Remember me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5 px-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-[#0f2119] text-[#00e676] focus:ring-[#00e676]/40 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(email || '');
                      setForgotSent(false);
                      setShowForgotModal(true);
                    }}
                    className="text-xs sm:text-sm font-semibold text-[#00e676] hover:text-[#69f0ae] transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full py-3.5 px-4 bg-[#00e676] hover:bg-[#00c853] active:scale-[0.99] text-[#032314] font-bold text-base rounded-2xl shadow-[0_0_30px_rgba(0,230,118,0.45)] hover:shadow-[0_0_40px_rgba(0,230,118,0.65)] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#032314]" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Login</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* Subtle bottom padding */}
        <div className="relative z-10 pb-4 text-center text-[11px] text-gray-500">
          &bull; Yoni Restaurant Management System &bull;
        </div>

        {/* ================= MODAL: STANDARD FORGOT PASSWORD ================= */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative bg-[#091712] rounded-3xl max-w-md w-full shadow-2xl border-2 border-[#00e676]/60 p-6 sm:p-7 space-y-4 text-white animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e676] to-transparent shadow-[0_0_10px_#00e676]" />

              <div className="flex items-center justify-between border-b border-[#1b3d2e] pb-3.5">
                <div className="flex items-center gap-2.5 text-[#00e676]">
                  <KeyRound className="w-5 h-5" />
                  <h3 className="text-base sm:text-lg font-bold text-white">Forgot Your Password?</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="text-gray-400 hover:text-white p-1 cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {forgotSent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#00e676]/20 text-[#00e676] mx-auto flex items-center justify-center border border-[#00e676]/40 shadow-[0_0_20px_rgba(0,230,118,0.3)]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Reset Email Dispatched!</h4>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    We've sent a 15-minute secure password reset link to{' '}
                    <strong className="text-white">{forgotIdentifier}</strong>.
                    Please check your inbox (and spam folder) to set your new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSent(false);
                    }}
                    className="mt-2 w-full py-3 bg-[#00e676] hover:bg-[#00c853] text-[#032314] text-xs sm:text-sm font-bold rounded-2xl cursor-pointer transition shadow-lg shadow-[#00e676]/30"
                  >
                    Got It, Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                      Staff Email or Username
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. yohanistesfa457@gmail.com or jo"
                      className="w-full px-4 py-3 text-sm text-white bg-[#0f2119] border border-[#1b3d2e] focus:border-[#00e676] rounded-2xl focus:ring-2 focus:ring-[#00e676]/30 outline-none placeholder-gray-400 transition"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white rounded-xl cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-[#00e676] hover:bg-[#00c853] text-[#032314] rounded-2xl shadow-lg shadow-[#00e676]/30 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#032314]" />
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-[#032314]" />
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
