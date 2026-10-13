import { motion } from 'framer-motion';

const Hero = ({ onNavigate }) => {
    return (
        <section className="min-h-screen flex items-center relative" style={{
            paddingTop: 'clamp(80px, 15vw, 100px)',
            paddingBottom: 'clamp(2rem, 4vw, 3rem)',
            overflowX: 'hidden',
            backgroundImage: 'url(/Modern_CRM_Platform_Background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat'
        }}>
            <div className="section-container grid grid-cols-1 md:grid-cols-[1fr_1.3fr] items-center w-full" style={{
                gap: 'clamp(3rem, 6vw, 8rem)',
                paddingTop: 'clamp(1rem, 3vw, 2.5rem)',
                paddingBottom: 'clamp(1rem, 3vw, 2.5rem)'
            }}>
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="order-1 md:order-1"
                >
                    <h1 className="text-[clamp(1.75rem,5vw,3.5rem)] leading-[1.1] font-extrabold tracking-tight text-center md:text-left" style={{
                        color: 'var(--color-text-main)',
                        marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)'
                    }}>
                        The Official <br />
                        <span className="bg-gradient-to-r bg-clip-text text-transparent animate-text-gradient" style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-primary) 100%)' }}>
                            CRM Platform
                        </span> <br />
                        for Pydah Organization.
                    </h1>
                    <p className="text-[clamp(1rem,1.8vw,1.05rem)] max-w-[500px] mx-auto md:mx-0 text-center md:text-left" style={{
                        color: 'var(--color-text-muted)',
                        marginBottom: 'clamp(1.5rem, 3.5vw, 2rem)',
                        lineHeight: '1.6'
                    }}>
                        Experience the smoothness of high-performance management.
                        Automate student portals, hostels, HRMS, fees, and transport in one elegant interface.
                    </p>
                    <div className="flex justify-center md:justify-start flex-wrap" style={{
                        gap: 'clamp(0.875rem, 2vw, 1rem)'
                    }}>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="text-white rounded-md font-bold whitespace-nowrap transition-all duration-200"
                            style={{
                                backgroundColor: 'var(--color-primary)',
                                boxShadow: 'var(--shadow-soft)',
                                paddingLeft: 'clamp(1.5rem, 3.5vw, 2rem)',
                                paddingRight: 'clamp(1.5rem, 3.5vw, 2rem)',
                                paddingTop: 'clamp(0.875rem, 2vw, 1rem)',
                                paddingBottom: 'clamp(0.875rem, 2vw, 1rem)',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
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
                            className="rounded-md font-semibold bg-white whitespace-nowrap transition-all duration-200"
                            style={{
                                border: '1px solid var(--color-border-soft)',
                                color: 'var(--color-text-main)',
                                paddingLeft: 'clamp(1.5rem, 3.5vw, 2rem)',
                                paddingRight: 'clamp(1.5rem, 3.5vw, 2rem)',
                                paddingTop: 'clamp(0.875rem, 2vw, 1rem)',
                                paddingBottom: 'clamp(0.875rem, 2vw, 1rem)',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
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
            </div>
        </section>
    );
};

export default Hero;
