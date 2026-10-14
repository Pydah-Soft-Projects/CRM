import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const CTASection = ({ onNavigate }) => {
    return (
        <section className="relative overflow-hidden" style={{
            paddingTop: 'clamp(2rem, 8vw, 6rem)',
            paddingBottom: 'clamp(2rem, 8vw, 6rem)',
        }}>
            <div className="section-container relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                    className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] text-center"
                    style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
                        boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.5)'
                    }}
                >
                    {/* Dynamic Background Particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full bg-white opacity-10"
                                style={{
                                    width: Math.random() * 300 + 100,
                                    height: Math.random() * 300 + 100,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -50, 0],
                                    x: [0, 30, 0],
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 45, 0]
                                }}
                                transition={{
                                    duration: 15 + Math.random() * 10,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center" style={{
                        padding: 'clamp(1.5rem, 6vw, 5rem)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 text-white text-sm font-medium mb-8"
                        >
                            <Sparkles size={16} className="text-yellow-300" />
                            <span>Transform Your Campus Today</span>
                        </motion.div>

                        <motion.h2
                            className="font-extrabold text-white tracking-tight leading-tight"
                            style={{
                                fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
                                marginBottom: '1.5rem',
                                maxWidth: '1000px'
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Ready to elevate your institution<br className="hidden md:block" /> to the next level?
                        </motion.h2>

                        <motion.p
                            className="text-indigo-100/90 leading-relaxed mb-10"
                            style={{
                                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                maxWidth: '600px',
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Join the growing list of forward-thinking entities scaling their operations with Pydah's intelligent ecosystem.
                        </motion.p>

                        <InteractiveButton onClick={() => onNavigate('portals')} />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const InteractiveButton = ({ onClick }) => {
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center gap-3 bg-amber-400 text-amber-950 font-bold rounded-full overflow-hidden shadow-xl"
            style={{
                padding: '1rem 2rem', // Reduced padding
                fontSize: '1rem' // Slightly smaller font
            }}
            onClick={onClick}
        >
            <span className="relative z-10">Start Your Journey</span>
            <ArrowRight className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" size={20} />

            {/* Shiny Swipe Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out z-0" />
        </motion.button>
    );
};

export default CTASection;
