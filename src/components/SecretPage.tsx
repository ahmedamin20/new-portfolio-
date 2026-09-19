import React, { useState, useEffect } from 'react';
import { Lock, User } from 'lucide-react';

type SecretNavigate = (section: 'home' | 'stack' | 'projects' | 'secret' | 'dashboard' | 'view_link') => void;

interface SecretPageProps {
    onNavigate?: SecretNavigate;
}

const SecretPage = ({ onNavigate }: SecretPageProps) => {
    const [isDark, setIsDark] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profile, setProfile] = useState<{ imageUrl?: string; name?: string; title?: string }>({
        imageUrl: '',
        name: 'Action Center',
        title: 'Authorized Amin Only'
    });

    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        fetch('/api/settings/account')
            .then(res => res.json())
            .then(body => {
                const data = body.data;
                if (data) {
                    setProfile({
                        imageUrl: data.imageUrl || '',
                        name: data.name || 'Action Center',
                        title: data.title || 'Authorized Amin Only'
                    });
                }
            })
            .catch(err => console.warn('Failed to load account profile', err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const body = await res.json().catch(() => null);

            if (!res.ok) {
                setError(body?.message || 'Wrong Shot.');
                return;
            }

            if (onNavigate) {
                onNavigate('dashboard');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center p-5">
            <div className="glass-panel p-10 w-full max-w-md flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative w-30 h-30 rounded-full overflow-hidden mb-2" style={{
                    boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.2)',
                    border: `4px solid ${isDark ? '#ffffff20' : '#ffffff80'}`
                }}>
                    {profile.imageUrl ? (
                        <img
                            src={profile.imageUrl}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
                            <User size={48} className="text-zinc-500/30" />
                        </div>
                    )}
                </div>

                <div className="text-center flex flex-col gap-1.5">
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">
                        Identity Verification
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">
                        Encrypted Data Protocol
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-2">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <input
                        type="email"
                        required
                        autoComplete="username"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field w-full"
                    />

                    <input
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field w-full"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn btn-primary w-full flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        <Lock size={18} />
                        {loading ? 'Authorizing...' : 'Authorize Access'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SecretPage;
