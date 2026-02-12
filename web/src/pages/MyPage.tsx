import { useEffect, useState } from 'react';
import { LayoutDashboard, History, LogOut, Copy, Download, HelpCircle, AlertTriangle, Key, Sun, Moon, Menu, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import LegalModal from '../components/LegalModal';
import SEO from '../components/SEO';

interface License {
    id: string;
    license_key: string;
    status: string;
    created_at: string;
    product_type: string;
}

const MyPage = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dash' | 'history'>('dash');
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const [legalModelType, setLegalModalType] = useState<'privacy' | 'terms' | 'contact'>('contact');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const logoSrc = theme === 'dark' ? '/VideoLighter_logo_white.svg' : '/VideoLighter_logo_black.svg';

    useEffect(() => {
        if (!user) {
            navigate('/');
        } else {
            fetchLicenses();
        }
    }, [user]);

    const fetchLicenses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching licenses:', error.message);
                return;
            }

            setLicenses(data || []);
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key);
        alert(t('dashboard.copy') + '!');
    };

    const openContact = () => {
        setLegalModalType('contact');
        setIsLegalModalOpen(true);
    };

    const handlePayment = () => {
        const checkoutUrl = import.meta.env.VITE_POLAR_CHECKOUT_URL;
        if (!checkoutUrl) {
            alert('Payment link is not configured. Please check VITE_POLAR_CHECKOUT_URL in .env');
            return;
        }
        const finalUrl = `${checkoutUrl}?customer_email=${encodeURIComponent(user?.email || '')}`;
        window.location.href = finalUrl;
    };

    const handleDownload = () => {
        alert('Windows Installer Download Starting...');
    };

    return (
        <div className="min-h-screen bg-transparent text-[var(--text-color)] font-sans flex overflow-hidden relative">
            <SEO title={`${t('dashboard.menu_dash')} | VideoLighter`} />
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden fixed top-6 left-6 z-[60] p-2 bg-indigo-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-indigo-500 transition-all active:scale-95"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            <aside className={`
                w-64 fixed h-full z-[80] border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] transition-all duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'left-0 shadow-2xl' : '-left-64 md:left-0 shadow-none'}
            `}>
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer">
                        <img src={logoSrc} alt="Logo" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold tracking-tight text-lg text-[var(--text-color)]">VideoLighter</span>
                    </Link>
                </div>

                <nav className="px-4 space-y-2 flex-1">
                    <button
                        onClick={() => { setActiveTab('dash'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'dash' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        {t('dashboard.menu_dash')}
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <History className="w-5 h-5" />
                        {t('dashboard.menu_history')}
                    </button>
                </nav>

                <div className="p-4 border-t border-[var(--card-border)]">
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                        {t('nav.logout')}
                    </button>
                </div>
            </aside>

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-[65] md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen">
                <header className="p-6 md:p-12 mb-4">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="pt-14 md:pt-0"
                        >
                            <h1 className="text-3xl md:text-4xl font-black mb-2">{t('dashboard.title')}</h1>
                            <p className="text-[var(--text-muted)] font-medium">{user?.email}</p>
                        </motion.div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleTheme} className="p-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-color)] transition-all cursor-pointer">
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <div className="flex border rounded-xl overflow-hidden p-1 bg-black/5 dark:bg-white/5 border-[var(--card-border)]">
                                <button onClick={() => changeLanguage('ko')} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${i18n.language === 'ko' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)]'}`}>KR</button>
                                <button onClick={() => changeLanguage('en')} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)]'}`}>EN</button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-12 pt-0 max-w-4xl mx-auto space-y-8">
                    {activeTab === 'dash' ? (
                        <>
                            {loading ? (
                                <div className="glass border-[var(--card-border)] rounded-[2rem] p-12 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : licenses.length > 0 ? (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border-[var(--card-border)] bg-[var(--card-bg)] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-sm">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] -mr-32 -mt-32"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                                                    <Key className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <span className="font-black uppercase tracking-widest text-[10px] text-indigo-600">{t('dashboard.license_status')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-500/20 text-xs font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                {t('dashboard.active')}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-2">{t('dashboard.active_license')}</h3>
                                                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t('dashboard.license_desc')}</p>
                                            </div>
                                            <div className="p-5 bg-black/5 dark:bg-black/40 border border-[var(--card-border)] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                                <code className="text-indigo-600 font-mono text-lg md:text-xl tracking-wider select-all">{licenses[0].license_key}</code>
                                                <button onClick={() => handleCopy(licenses[0].license_key)} className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                                                    <Copy className="w-4 h-4" />
                                                    {t('dashboard.copy')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border-[var(--card-border)] bg-[var(--card-bg)] rounded-[2rem] p-8 md:p-12 text-center shadow-sm">
                                    <h3 className="text-xl font-bold mb-2">{t('dashboard.no_license')}</h3>
                                    <p className="text-[var(--text-muted)] mb-8 text-sm">{t('dashboard.buy_product_desc')}</p>
                                    <button
                                        onClick={handlePayment}
                                        className="inline-block px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95"
                                    >
                                        {t('dashboard.buy_product')}
                                    </button>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {licenses.length > 0 && (
                                    <>
                                        <div className="p-8 rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm group">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-6 text-indigo-600"><Download className="w-6 h-6" /></div>
                                            <h4 className="text-lg font-bold mb-2">{t('hero.download')}</h4>
                                            <p className="text-[var(--text-muted)] text-sm mb-6">{t('dashboard.download_desc')}</p>
                                            <button onClick={handleDownload} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/10 mb-3 tracking-tight">
                                                {t('hero.download')}
                                            </button>
                                            <p className="text-[10px] text-center font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hero.macos_waiting')}</p>
                                        </div>
                                        <div className="p-8 rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm group">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-6 text-indigo-600"><ExternalLink className="w-6 h-6" /></div>
                                            <h4 className="text-lg font-bold mb-2">{t('dashboard.billing')}</h4>
                                            <p className="text-[var(--text-muted)] text-sm mb-8">{t('dashboard.billing_desc')}</p>
                                            <a
                                                href="https://polar.sh/customer-portal"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-4 text-center border border-[var(--card-border)] rounded-2xl font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer block transition-all"
                                            >
                                                {t('dashboard.billing')}
                                            </a>
                                        </div>
                                    </>
                                )}
                                <div className={`p-8 rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm ${licenses.length === 0 ? 'md:col-span-2' : ''}`}>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-6 text-indigo-600"><HelpCircle className="w-6 h-6" /></div>
                                    <h4 className="text-lg font-bold mb-2">{t('dashboard.support')}</h4>
                                    <p className="text-[var(--text-muted)] text-sm mb-8">{t('dashboard.support_desc')}</p>
                                    <button onClick={openContact} className="w-full py-4 border border-[var(--card-border)] rounded-2xl font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">{t('dashboard.contact_support')}</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border-[var(--card-border)] bg-[var(--card-bg)] rounded-[2rem] p-8 md:p-12 shadow-sm">
                            <h3 className="text-2xl font-bold mb-8">{t('dashboard.menu_history')}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)] text-sm uppercase tracking-widest">
                                            <th className="pb-4 font-black">{t('history.product', 'Product')}</th>
                                            <th className="pb-4 font-black">{t('history.date', 'Date')}</th>
                                            <th className="pb-4 font-black">{t('history.status', 'Status')}</th>
                                            <th className="pb-4 font-black text-right">{t('history.price', 'Price')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                        {licenses.length > 0 ? (
                                            licenses.map((item) => (
                                                <tr key={item.id} className="group">
                                                    <td className="py-6 min-w-[200px]">
                                                        <div className="font-bold">VideoLighter Pro License</div>
                                                        <div className="text-xs text-[var(--text-muted)] font-mono mt-1">{item.license_key}</div>
                                                    </td>
                                                    <td className="py-6 text-sm text-[var(--text-muted)]">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-6">
                                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold uppercase">{item.status}</span>
                                                    </td>
                                                    <td className="py-6 text-right font-black">$9.99</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-[var(--text-muted)]">{t('dashboard.no_license')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 flex justify-start">
                                <button onClick={openContact} className="text-[var(--text-muted)] hover:text-red-500 transition-colors flex items-center gap-2 cursor-pointer text-sm font-semibold">
                                    <AlertTriangle className="w-4 h-4" />
                                    {t('dashboard.refund')}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <div className="pt-8 border-t border-[var(--card-border)] flex justify-end items-center text-[var(--text-muted)] text-xs font-semibold">
                        <span>VideoLighter v1.0.0</span>
                    </div>
                </div>
            </main>

            <LegalModal
                isOpen={isLegalModalOpen}
                onClose={() => setIsLegalModalOpen(false)}
                type={legalModelType}
            />
        </div>
    );
};

export default MyPage;
