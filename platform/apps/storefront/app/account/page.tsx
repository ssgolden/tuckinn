"use client";

import { useState, useEffect } from "react";
import { useCustomerAuth } from "../../lib/customer-auth";
import Link from "next/link";

export default function AccountPage() {
  const { session, isLoading, login, register, logout } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>
        {/* Clean Header */}
        <header style={{ backgroundColor: '#0f0f0f', borderBottom: '1px solid #27272a' }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#dc2626' }}>
                T
              </div>
              <span className="font-semibold text-base tracking-tight">Tuckinn Proper</span>
            </Link>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
              ← Back to menu
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-12">
          <div className="max-w-md mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-1 tracking-tight">
                {activeTab === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                {activeTab === "login" ? "Sign in to access your orders" : "Join Tuckinn Proper today"}
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#141414', border: '1px solid #27272a' }}>
              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ backgroundColor: '#1a1a1a' }}>
                <button
                  onClick={() => setActiveTab("login")}
                  className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: activeTab === "login" ? '#dc2626' : 'transparent',
                    color: activeTab === "login" ? 'white' : '#71717a'
                  }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: activeTab === "register" ? '#dc2626' : 'transparent',
                    color: activeTab === "register" ? 'white' : '#71717a'
                  }}
                >
                  Sign up
                </button>
              </div>

              {activeTab === "login" ? (
                <LoginForm onLogin={login} />
              ) : (
                <RegisterForm onRegister={register} />
              )}
            </div>

            <p className="text-center text-xs mt-6" style={{ color: '#52525b' }}>
              By continuing, you agree to our Terms and Privacy Policy
            </p>
          </div>
        </main>
      </div>
    );
  }

  return <AccountDashboard session={session} onLogout={logout} />;
}

function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: '#7f1d1d', color: '#fca5a5' }}>
          <span>⚠</span> {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #27272a', color: 'white' }}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #27272a', color: 'white' }}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
        style={{ backgroundColor: '#dc2626', color: 'white' }}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

function RegisterForm({ onRegister }: { onRegister: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: '#7f1d1d', color: '#fca5a5' }}>
          <span>⚠</span> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>First name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #27272a', color: 'white' }}
            placeholder="John"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Last name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #27272a', color: 'white' }}
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #27272a', color: 'white' }}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #27272a', color: 'white' }}
          placeholder="••••••••"
          required
        />
        <p className="text-xs mt-1" style={{ color: '#71717a' }}>At least 8 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Confirm password</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #27272a', color: 'white' }}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 mt-2"
        style={{ backgroundColor: '#dc2626', color: 'white' }}
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

function AccountDashboard({ session, onLogout }: { session: any; onLogout: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = session.accessToken;
      const res = await fetch("/api/orders/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: 'white' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#0f0f0f', borderBottom: '1px solid #27272a' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#dc2626' }}>
              T
            </div>
            <span className="font-semibold text-base tracking-tight">Tuckinn Proper</span>
          </Link>
          <button 
            onClick={onLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{ borderColor: '#27272a' }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {session.user.firstName}</h1>
          <p className="text-sm" style={{ color: '#a1a1aa' }}>Manage your orders and account</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-lg inline-flex" style={{ backgroundColor: '#141414' }}>
          <button
            onClick={() => setActiveTab("orders")}
            className="px-5 py-2.5 rounded-md text-sm font-medium transition-all"
            style={{ 
              backgroundColor: activeTab === "orders" ? '#dc2626' : 'transparent',
              color: activeTab === "orders" ? 'white' : '#71717a'
            }}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className="px-5 py-2.5 rounded-md text-sm font-medium transition-all"
            style={{ 
              backgroundColor: activeTab === "profile" ? '#dc2626' : 'transparent',
              color: activeTab === "profile" ? 'white' : '#71717a'
            }}
          >
            Profile
          </button>
        </div>

        {activeTab === "orders" ? (
          ordersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: '#27272a', borderTopColor: '#dc2626' }}></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: '#141414', borderColor: '#27272a' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
                <span style={{ color: '#52525b' }}>🛒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-sm mb-6" style={{ color: '#71717a' }}>Place your first order to see it here</p>
              <Link
                href="/"
                className="inline-flex px-6 py-2.5 rounded-lg font-medium text-sm"
                style={{ backgroundColor: '#dc2626', color: 'white' }}
              >
                Browse menu
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div key={order.id} className="p-5 rounded-xl border" style={{ backgroundColor: '#141414', borderColor: '#27272a' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">€{order.totalAmount}</p>
                      <span 
                        className="text-xs px-2 py-1 rounded-full mt-1 inline-block"
                        style={{ 
                          backgroundColor: order.status === 'completed' ? '#14532d' : order.status === 'pending' ? '#713f12' : '#7f1d1d',
                          color: order.status === 'completed' ? '#86efac' : order.status === 'pending' ? '#fde047' : '#fca5a5'
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#141414', borderColor: '#27272a' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#dc2626' }}>
                {session.user.firstName[0]}{session.user.lastName[0]}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{session.user.firstName} {session.user.lastName}</h2>
                <p className="text-sm" style={{ color: '#71717a' }}>{session.user.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                <p className="text-xs mb-1" style={{ color: '#71717a' }}>Name</p>
                <p className="font-medium">{session.user.firstName} {session.user.lastName}</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                <p className="text-xs mb-1" style={{ color: '#71717a' }}>Email</p>
                <p className="font-medium">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
