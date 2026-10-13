import { motion } from 'framer-motion';

const Hero = ({ onNavigate }) => {
    return (
        <section
            className="min-h-screen flex items-center relative overflow-x-hidden bg-[#F8FAFD] md:bg-[url('/Modern_CRM_Platform_Background.png')] md:bg-cover md:bg-[position:right_center] md:bg-no-repeat"
            style={{
                paddingTop: 'clamp(80px, 15vw, 100px)',
                paddingBottom: 'clamp(2rem, 4vw, 3rem)',
            }}
        >
            <div
                className="section-container grid grid-cols-1 md:grid-cols-[1fr_1.3fr] items-center w-full"
                style={{
                    gap: 'clamp(2rem, 6vw, 8rem)',
                    paddingTop: 'clamp(1rem, 3vw, 2.5rem)',
                    paddingBottom: 'clamp(1rem, 3vw, 2.5rem)'
                }}
            >
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="order-1"
                >
                    <h1
                        className="text-[clamp(1.35rem,5.5vw,1.75rem)] md:text-[clamp(2rem,5vw,3.5rem)] leading-[1.15] md:leading-[1.1] font-extrabold tracking-tight text-center md:text-left"
                        style={{
                            color: 'var(--color-text-main)',
                            marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)'
                        }}
                    >
                        The Official <br className="hidden md:block" />
                        <span
                            className="bg-gradient-to-r bg-clip-text text-transparent animate-text-gradient"
                            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-primary) 100%)' }}
                        >
                            CRM Platform
                        </span> <br />
                        for Pydah Organization.
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
                    <div
                        className="flex flex-row items-center justify-center md:justify-start gap-2.5 sm:gap-4 flex-nowrap"
                        style={{
                            marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)'
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="text-white rounded-md font-bold whitespace-nowrap transition-all duration-200 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 text-xs sm:text-sm md:text-base"
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
                            onClick={() => onNavigate('portals')}
                        >
                            Get Started
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-md font-semibold bg-white whitespace-nowrap transition-all duration-200 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 text-xs sm:text-sm md:text-base"
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
                            onClick={() => onNavigate('portals')}
                        >
                            Explore Portals
                        </motion.button>
                    </div>
                </motion.div>

                {/* Mobile Illustration - full width edge-to-edge, uses leftside space, hidden on desktop */}
                <div className="block md:hidden order-2 w-screen relative left-1/2 -translate-x-1/2 mt-4 overflow-hidden">
                    <img
                        src="/hero-mobile-illustration.png"
                        alt="Pydah CRM Platform Preview"
                        className="w-full h-auto block"
                    />
                </div>
            </div>
        </section>
    );
};

export default Hero;
