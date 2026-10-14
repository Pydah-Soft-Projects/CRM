import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Hero = ({ onNavigate }) => {
    // Typewriter animation texts
    const fullLine1 = "The Official";
    const fullHighlight = "CRM Platform";
    const fullLine2 = "for Pydah Organization.";
    const totalChars = fullLine1.length + fullHighlight.length + fullLine2.length;

    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        let timeoutId;
        if (charIndex < totalChars) {
            timeoutId = setTimeout(() => {
                setCharIndex(prev => prev + 1);
            }, 45);
        } else {
            // Once all letters are typed, pause for some seconds, then restart typing
            timeoutId = setTimeout(() => {
                setCharIndex(0);
            }, 3500);
        }
        return () => clearTimeout(timeoutId);
    }, [charIndex, totalChars]);

    const displayedLine1 = fullLine1.slice(0, Math.min(charIndex, fullLine1.length));
    const isHighlightPhase = charIndex > fullLine1.length && charIndex <= fullLine1.length + fullHighlight.length;
    const isLine2Phase = charIndex > fullLine1.length + fullHighlight.length;

    const displayedHighlight = charIndex > fullLine1.length
        ? fullHighlight.slice(0, Math.min(charIndex - fullLine1.length, fullHighlight.length))
        : '';

    const displayedLine2 = charIndex > fullLine1.length + fullHighlight.length
        ? fullLine2.slice(0, charIndex - fullLine1.length - fullHighlight.length)
        : '';

    return (
        <section
            className="min-h-screen flex flex-col justify-between md:flex-row md:items-center relative overflow-x-hidden bg-[#F8FAFD] md:bg-[url('/Modern_CRM_Platform_Background.png')] md:bg-cover md:bg-[position:right_center] md:bg-no-repeat pt-[98px] md:pt-[100px] pb-0 md:pb-12"
        >
            <div
                className="section-container flex-1 flex flex-col justify-between md:grid md:grid-cols-[1fr_1.3fr] items-center w-full pt-2 md:pt-8 pb-0 md:pb-8"
                style={{
                    gap: 'clamp(1rem, 4vw, 8rem)',
                }}
            >
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="order-1 pt-3 sm:pt-4 md:pt-0 relative z-10"
                >
                    <h1
                        className="text-[clamp(1.6rem,6.2vw,2.15rem)] md:text-[clamp(2.4rem,5.5vw,4.1rem)] leading-[1.15] md:leading-[1.1] font-extrabold tracking-tight text-center md:text-left min-h-[5.5rem] sm:min-h-[6rem] md:min-h-[8.5rem]"
                        style={{
                            color: 'var(--color-text-main)',
                            marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)'
                        }}
                    >
                        <span>
                            {displayedLine1}
                            {!isHighlightPhase && !isLine2Phase && (
                                <span className="inline-block w-[2px] md:w-[3px] h-[0.85em] bg-indigo-500 ml-1 align-middle animate-pulse" />
                            )}
                        </span>
                        <br className="hidden md:block" />
                        {displayedHighlight && (
                            <>
                                {' '}
                                <span
                                    className="bg-gradient-to-r bg-clip-text text-transparent animate-text-gradient inline-block"
                                    style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-primary) 100%)' }}
                                >
                                    {displayedHighlight}
                                </span>
                                {isHighlightPhase && (
                                    <span className="inline-block w-[2px] md:w-[3px] h-[0.85em] bg-indigo-500 ml-1 align-middle animate-pulse" />
                                )}
                            </>
                        )}
                        {(displayedLine2 || isLine2Phase) && (
                            <>
                                <br />
                                <span>
                                    {displayedLine2}
                                    {isLine2Phase && (
                                        <span className="inline-block w-[2px] md:w-[3px] h-[0.85em] bg-indigo-500 ml-1 align-middle animate-pulse" />
                                    )}
                                </span>
                            </>
                        )}
                    </h1>
                    <p
                        className="hidden md:block text-[clamp(1rem,1.8vw,1.05rem)] max-w-[500px] mx-auto md:mx-0 text-center md:text-left"
                        style={{
                            color: 'var(--color-text-muted)',
                            marginBottom: 'clamp(1.5rem, 3.5vw, 2rem)',
                            lineHeight: '1.6'
                        }}
                    >
                        Experience the smoothness of high-performance management.
                        Automate student portals, hostels, HRMS, fees, and transport in one elegant interface.
                    </p>
                    {/* Smarter Management Feature Card (Mobile screens only - shifted above buttons on mobile) */}
                    <div
                        className="block md:hidden relative mx-auto max-w-[560px]"
                        style={{
                            marginBottom: 'clamp(2.5rem, 8vw, 3.5rem)'
                        }}
                    >
                        {/* Top-Left Corner Accent Line */}
                        <svg
                            className="absolute -top-2 -left-2 w-7 h-7 text-blue-500 pointer-events-none"
                            viewBox="0 0 28 28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <path d="M 4 18 L 4 9 C 4 6 6 4 9 4 L 18 4" />
                        </svg>

                        {/* Bottom-Right Corner Accent Line (Opposite Corner) */}
                        <svg
                            className="absolute -bottom-2 -right-2 w-7 h-7 text-blue-500 pointer-events-none"
                            viewBox="0 0 28 28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <path d="M 10 24 L 19 24 C 22 24 24 22 24 19 L 24 10" />
                        </svg>

                        <div className="bg-[#F0F6FE]/90 backdrop-blur-sm border border-[#DCE8F8] rounded-2xl p-3 sm:p-4 md:p-4.5 shadow-[0_4px_16px_-4px_rgba(59,130,246,0.06)] text-left">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg leading-tight tracking-tight">
                                    Smarter Management.
                                </span>
                                <span className="font-extrabold text-blue-600 text-sm sm:text-base md:text-lg leading-tight tracking-tight">
                                    Better Tomorrow.
                                </span>
                            </div>
                            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-1 sm:mt-1.5">
                                Pydah CRM helps you connect, organize and grow — all in one place.
                            </p>
                        </div>
                    </div>

                    <div
                        className="flex flex-row items-center justify-center md:justify-start gap-3.5 sm:gap-4 flex-nowrap mt-2 md:mt-0 relative z-30"
                        style={{
                            marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)'
                        }}
                    >
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="text-white rounded-md font-bold whitespace-nowrap transition-all duration-200 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 text-xs sm:text-sm md:text-base cursor-pointer relative z-30"
                            style={{
                                backgroundColor: 'var(--color-primary)',
                                boxShadow: 'var(--shadow-soft)',
                                lineHeight: '1.5'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.boxShadow = '0 15px 30px -5px rgba(99, 102, 241, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.boxShadow = 'var(--shadow-soft)';
                            }}
                            onClick={() => {
                                if (typeof onNavigate === 'function') {
                                    onNavigate('portals');
                                }
                            }}
                        >
                            Get Started
                        </motion.button>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-md font-semibold bg-white whitespace-nowrap transition-all duration-200 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 text-xs sm:text-sm md:text-base cursor-pointer relative z-30"
                            style={{
                                border: '1px solid var(--color-border-soft)',
                                color: 'var(--color-text-main)',
                                lineHeight: '1.5'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
                                e.target.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = 'var(--color-border-soft)';
                            }}
                            onClick={() => {
                                if (typeof onNavigate === 'function') {
                                    onNavigate('portals');
                                }
                            }}
                        >
                            Explore Portals
                        </motion.button>
                    </div>
                </motion.div>

                {/* Mobile Illustration - full width edge-to-edge, anchored at bottom */}
                <div className="block md:hidden order-2 mt-auto w-screen relative left-1/2 -translate-x-1/2 overflow-hidden -translate-y-20 sm:-translate-y-24 pointer-events-none z-0">
                    <img
                        src="/Pastel Productivity Dashboard Hero Scene.png"
                        alt="Pydah CRM Platform Preview"
                        className="w-full h-auto block select-none pointer-events-none"
                    />
                </div>
            </div>
        </section>
    );
};

export default Hero;
