import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Search, RotateCcw, ChevronLeft, ChevronRight, LayoutDashboard, Package, CreditCard, PieChart } from 'lucide-react';

const tabs = [
    {
        id: 'student',
        name: 'Student Portal',
        displayUrl: 'https://sdms.pydah.edu.in/',
        redirectUrl: 'https://sdms.pydah.edu.in/',
        icon: LayoutDashboard,
        color: '#8B4513',
        bgColor: '#FAF3E0'
    },
    {
        id: 'hostel',
        name: 'Hostel CRM',
        displayUrl: 'hostel.pydah.edu.in',
        redirectUrl: 'https://hostel.pydah.edu.in',
        icon: Package,
        color: '#0ea5e9',
        bgColor: '#F0F9FF'
    },
    {
        id: 'hrms',
        name: 'Payroll & HRMS',
        displayUrl: 'li-hrms.vercel.app',
        redirectUrl: 'https://hrms.pydah.edu.in',
        icon: CreditCard,
        color: '#10b981',
        bgColor: '#F0FDF4'
    }
];

const BrowserMock = () => {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateState = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                const mobile = width < 640; // Mobile breakpoint
                setIsMobile(mobile);

                if (!mobile) {
                    // Desktop Simulation Logic
                    const simulatedWidth = 1280;
                    const newScale = width / simulatedWidth;
                    setScale(newScale);
                } else {
                    setScale(1);
                }
            }
        };

        updateState();
        const observer = new ResizeObserver(updateState);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [activeTab]);

    const handleNextTab = (e) => {
        e.stopPropagation();
        const currentIndex = tabs.findIndex(t => t.id === activeTab.id);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex]);
    };

    const handlePrevTab = (e) => {
        e.stopPropagation();
        const currentIndex = tabs.findIndex(t => t.id === activeTab.id);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[prevIndex]);
    };

    const renderContent = () => {
        return (
            <div ref={containerRef} className="w-full h-full bg-slate-50 relative group overflow-hidden">
                <iframe
                    src={activeTab.redirectUrl}
                    title={activeTab.name}
                    style={isMobile ? {
                        width: '100%',
                        height: '100%',
                        border: 0
                    } : {
                        width: '1280px',
                        height: `${100 / scale}%`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        border: 0,
                    }}
                    className="pointer-events-none bg-white"
                    loading="lazy"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />

                {/* Overlay to catch clicks and open link */}
                <div className="absolute inset-0 z-10 bg-transparent cursor-pointer" />
            </div>
        );
    };

    return (
        <div className="browser-mock w-full max-w-[900px] rounded-[clamp(12px,3vw,20px)] overflow-hidden relative mx-auto" style={{ boxShadow: 'var(--shadow-glass)', backgroundColor: 'var(--color-bg-white)', border: '1px solid var(--color-border-soft)' }}>
            {/* Window Controls & Tab Bar Merged */}
            <div className="bg-slate-100 flex items-center border-b relative" style={{
                borderColor: 'var(--color-border-soft)',
                paddingTop: 'clamp(0.5rem, 1.2vw, 0.75rem)',
                paddingBottom: 'clamp(0.25rem, 0.6vw, 0.25rem)',
                paddingLeft: 'clamp(0.75rem, 1.8vw, 1rem)',
                paddingRight: 'clamp(0.75rem, 1.8vw, 1rem)',
                gap: 'clamp(0.75rem, 1.5vw, 1rem)'
            }}>
                {/* Traffic Lights - Hidden on Mobile */}
                <div className="hidden sm:flex flex-shrink-0 mr-2" style={{ gap: 'clamp(0.375rem, 0.8vw, 0.5rem)' }}>
                    <div className="rounded-full bg-[#ff5f56] flex-shrink-0" style={{
                        width: 'clamp(10px, 2vw, 12px)',
                        height: 'clamp(10px, 2vw, 12px)'
                    }} />
                    <div className="rounded-full bg-[#ffbd2e] flex-shrink-0" style={{
                        width: 'clamp(10px, 2vw, 12px)',
                        height: 'clamp(10px, 2vw, 12px)'
                    }} />
                    <div className="rounded-full bg-[#27c93f] flex-shrink-0" style={{
                        width: 'clamp(10px, 2vw, 12px)',
                        height: 'clamp(10px, 2vw, 12px)'
                    }} />
                </div>

                {/* Scrollable Tabs */}
                <div className="flex overflow-x-auto scrollbar-none items-center flex-1 sm:px-0" style={{ gap: 'clamp(0.25rem, 0.6vw, 0.375rem)' }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab.id === tab.id;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    rounded-t-[10px] cursor-pointer flex items-center transition-all duration-200 flex-shrink-0 whitespace-nowrap -mb-px
                                    ${isActive ? 'bg-white font-bold border border-b-transparent' : 'bg-transparent font-medium border border-transparent'}
                                `}
                                style={{
                                    paddingTop: 'clamp(0.375rem, 0.9vw, 0.5rem)',
                                    paddingBottom: 'clamp(0.375rem, 0.9vw, 0.5rem)',
                                    paddingLeft: 'clamp(0.625rem, 1.5vw, 1rem)',
                                    paddingRight: 'clamp(0.625rem, 1.5vw, 1rem)',
                                    gap: 'clamp(0.375rem, 0.9vw, 0.5rem)',
                                    fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)',
                                    minWidth: 'clamp(100px, 20vw, 130px)',
                                    ...(isActive ? { color: 'var(--color-text-main)', borderColor: 'var(--color-border-soft)' } : { color: 'var(--color-text-muted)', borderColor: 'transparent' })
                                }}
                            >
                                <Icon size={14} color={tab.color} />
                                <span className="tab-name">{tab.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Address Bar */}
            <div className="bg-white flex items-center border-b flex-wrap" style={{
                borderColor: 'var(--color-border-soft)',
                paddingTop: 'clamp(0.5rem, 1.2vw, 0.625rem)',
                paddingBottom: 'clamp(0.5rem, 1.2vw, 0.625rem)',
                paddingLeft: 'clamp(0.75rem, 1.8vw, 1rem)',
                paddingRight: 'clamp(0.75rem, 1.8vw, 1rem)',
                gap: 'clamp(0.5rem, 1.2vw, 0.75rem)'
            }}>
                <div className="browser-controls flex" style={{
                    color: 'var(--color-text-muted)',
                    gap: 'clamp(0.375rem, 0.9vw, 0.5rem)'
                }}>
                    <ChevronLeft size={16} />
                    <ChevronRight size={16} />
                    <RotateCcw size={16} />
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg flex items-center border overflow-hidden" style={{
                    color: 'var(--color-text-muted)',
                    borderColor: 'var(--color-border-soft)',
                    minWidth: 'clamp(200px, 30vw, 250px)',
                    paddingTop: 'clamp(0.25rem, 0.6vw, 0.375rem)',
                    paddingBottom: 'clamp(0.25rem, 0.6vw, 0.375rem)',
                    paddingLeft: 'clamp(0.5rem, 1.2vw, 0.75rem)',
                    paddingRight: 'clamp(0.5rem, 1.2vw, 0.75rem)',
                    gap: 'clamp(0.375rem, 0.9vw, 0.5rem)',
                    fontSize: 'clamp(0.625rem, 1.2vw, 0.6875rem)'
                }}>
                    <Search size={12} />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {activeTab.displayUrl}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div
                className="browser-content h-[clamp(260px,65vw,400px)] sm:h-[clamp(400px,40vw,480px)] relative cursor-pointer overflow-hidden"
                onClick={() => {
                    window.open(activeTab.redirectUrl, '_blank');
                }}
            >
                {/* Mobile Nav Arrows (Overlay) */}
                <button
                    onClick={handlePrevTab}
                    className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/80 backdrop-blur shadow-lg border border-slate-100 rounded-full text-slate-700 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>

                <button
                    onClick={handleNextTab}
                    className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/80 backdrop-blur shadow-lg border border-slate-100 rounded-full text-slate-700 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronRight size={20} />
                </button>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab.id}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute w-full h-full"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <style>{`
                .browser-mock .tab-name {
                    display: inline;
                }
                @media (max-width: 480px) {
                    .browser-mock .tab-name {
                        display: none;
                    }
                    .browser-controls {
                        display: none !important;
                    }
                }
                .browser-mock::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-none {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default BrowserMock;
