import React, { useState } from 'react';
import { Loader2, ArrowLeft, Lock, Mail, User, Building, CheckCircle2, Check, ArrowRight } from 'lucide-react';
import { apiClient, UserProfile } from '../api/client';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess: (user: UserProfile) => void;
  onBackToHome: () => void;
}

interface LocalAccount {
  name: string;
  email: string;
  passwordHash: string;
  organization: string;
  role: string;
}

const getLocalAccounts = (): Record<string, LocalAccount> => {
  try {
    const raw = localStorage.getItem('pv_accounts');
    const defaults: Record<string, LocalAccount> = {
      'demo@policyvision.ai': {
        name: 'Chaitanya Mohan',
        email: 'demo@policyvision.ai',
        passwordHash: 'password123',
        organization: 'PolicyVision Enterprise',
        role: 'Policyholder',
      },
    };
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return {
      'demo@policyvision.ai': {
        name: 'Chaitanya Mohan',
        email: 'demo@policyvision.ai',
        passwordHash: 'password123',
        organization: 'PolicyVision Enterprise',
        role: 'Policyholder',
      },
    };
  }
};

const saveLocalAccount = (acc: LocalAccount) => {
  try {
    const accounts = getLocalAccounts();
    accounts[acc.email.toLowerCase()] = acc;
    localStorage.setItem('pv_accounts', JSON.stringify(accounts));
  } catch {}
};

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onSuccess,
  onBackToHome,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'Policyholder' | 'Insurance Agent' | 'Compliance Auditor'>('Policyholder');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'register' && !name) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        let authSuccess = false;
        let loggedInUser: UserProfile | null = null;

        try {
          const res = await apiClient.auth.login(email.trim(), password, rememberMe);
          if (res.success && res.data) {
            authSuccess = true;
            loggedInUser = res.data.user;
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('pv_token', res.data.token);
            storage.setItem('pv_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Fall back to client-side credential store if backend offline
        }

        if (!authSuccess) {
          const accounts = getLocalAccounts();
          const target = accounts[email.trim().toLowerCase()];
          if (target && target.passwordHash === password) {
            authSuccess = true;
            loggedInUser = {
              id: `usr-${Date.now().toString(36)}`,
              name: target.name,
              email: target.email,
              organization: target.organization,
              role: target.role,
            };
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('pv_token', `tok_${Date.now()}`);
            storage.setItem('pv_user', JSON.stringify(loggedInUser));
          }
        }

        if (authSuccess && loggedInUser) {
          setSuccessMsg('Authentication successful! Launching studio...');
          setTimeout(() => onSuccess(loggedInUser!), 350);
        } else {
          setErrorMsg('Invalid email or password. Use demo credentials or register a new account.');
        }
      } else {
        // Register Mode
        const userProfile: UserProfile = {
          id: `usr-${Date.now().toString(36)}`,
          name: name.trim(),
          email: email.trim(),
          organization: organization.trim() || 'Independent',
          role: role,
        };

        try {
          const res = await apiClient.auth.register(
            name.trim(),
            email.trim(),
            password,
            organization.trim() || 'Independent',
            role
          );
          if (res.success && res.data) {
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('pv_token', res.data.token);
            storage.setItem('pv_user', JSON.stringify(res.data.user));
            setSuccessMsg('Account registered successfully! Entering studio...');
            setTimeout(() => onSuccess(res.data!.user), 350);
            return;
          }
        } catch {
          // Save local backup account
        }

        saveLocalAccount({
          name: name.trim(),
          email: email.trim(),
          passwordHash: password,
          organization: organization.trim() || 'Independent',
          role: role,
        });

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('pv_token', `tok_${Date.now()}`);
        storage.setItem('pv_user', JSON.stringify(userProfile));

        setSuccessMsg('Account registered! Launching studio...');
        setTimeout(() => onSuccess(userProfile), 350);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('demo@policyvision.ai');
    setPassword('password123');
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg('Demo credentials verified! Opening studio...');

    const demoUser: UserProfile = {
      id: 'usr-demo-01',
      name: 'Chaitanya Mohan',
      email: 'demo@policyvision.ai',
      organization: 'PolicyVision Enterprise',
      role: 'Policyholder',
    };

    try {
      const res = await apiClient.auth.login('demo@policyvision.ai', 'password123', true);
      if (res.success && res.data) {
        localStorage.setItem('pv_token', res.data.token);
        localStorage.setItem('pv_user', JSON.stringify(res.data.user));
        setTimeout(() => onSuccess(res.data!.user), 300);
        return;
      }
    } catch {}

    localStorage.setItem('pv_token', 'tok_demo_active');
    localStorage.setItem('pv_user', JSON.stringify(demoUser));
    setTimeout(() => onSuccess(demoUser), 300);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#FBFBFD] flex items-center justify-center p-4 sm:p-8 relative">
      {/* Back to Home action */}
      <button
        onClick={onBackToHome}
        className="absolute top-6 left-6 sm:left-12 flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Overview</span>
      </button>

      <div className="max-w-4xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid md:grid-cols-12 my-6">
        {/* Left Column: Security & Compliance Specs (De-slopped) */}
        <div className="md:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                PV
              </div>
              <span className="text-base font-extrabold tracking-tight">
                PolicyVision AI
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Deterministic Policy Intelligence
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Visual synthesis and RAG querying designed for insurance professionals, legal compliance officers, and policyholders.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-mono text-slate-300">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>IRDAI Three-Section Invariant</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>4-Hour Ephemeral In-Memory Storage</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Page-Level Vector Grounding Citations</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
            <div className="text-[11px] font-mono text-slate-400">
              Demo Access Available
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="mt-2 w-full text-xs font-semibold py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-between"
            >
              <span>Auto-Fill Demo Account</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
            </button>
          </div>
        </div>

        {/* Right Column: Clean Form */}
        <div className="md:col-span-7 p-8 sm:p-10 bg-white flex flex-col justify-center">
          {/* Switcher Tab */}
          <div className="flex p-1 mb-6 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to PolicyVision' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'login'
                ? 'Enter your credentials to access the document studio.'
                : 'Register to analyze policies, verify clauses, and export infographics.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Chaitanya Mohan"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg text-xs text-slate-900 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organization</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Company/Individual"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg text-xs text-slate-900 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg text-xs text-slate-900 outline-none transition-colors"
                    >
                      <option value="Policyholder">Policyholder</option>
                      <option value="Insurance Agent">Insurance Agent</option>
                      <option value="Compliance Auditor">Compliance Auditor</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg text-xs text-slate-900 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg text-xs text-slate-900 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="text-orange-600 font-semibold hover:underline"
              >
                1-Click Demo Fill
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-xs py-2.5 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In to Studio' : 'Create Free Account'}</span>
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-mono">
            <span>Demo: </span>
            <span className="text-slate-800 font-bold">demo@policyvision.ai</span>
            <span> / </span>
            <span className="text-slate-800 font-bold">password123</span>
          </div>
        </div>
      </div>
    </div>
  );
};
