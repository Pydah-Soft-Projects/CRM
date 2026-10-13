import { motion } from 'framer-motion';
import CloudIllustrations from './CloudIllustrations';

const FeaturesSection = () => {
    return (
        <section id="features" className="relative bg-gradient-to-b from-white to-slate-50" style={{
            paddingTop: 'clamp(2rem, 8vw, 6rem)',
            paddingBottom: 'clamp(2rem, 8vw, 6rem)',
            overflowX: 'hidden'
        }}>
            <div className="section-container">
                {/* Header Text */}
                <div className="text-center" style={{
                    marginBottom: 'clamp(1rem, 5vw, 4rem)'
                }}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-extrabold tracking-tight text-center"
                        style={{
                            fontSize: 'clamp(1.4rem, 4.5vw, 3.25rem)',
                            lineHeight: '1.2',
                            marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
                        }}
                    >
                        <span className="block text-slate-900">An Integrated</span>
                        <span className="block text-indigo-600">Institutional Core.</span>
                    </motion.h2>
                    <p
                        className="leading-relaxed text-slate-600 text-xs sm:text-sm md:text-lg max-w-[340px] sm:max-w-[540px] md:max-w-[700px] mx-auto text-center"
                        style={{
                            lineHeight: '1.6'
                        }}
                    >
                        Experience the power of a fully connected campus where every module—from admissions to examinations—talks to the central nervous system.
                        <span className="block mt-1 sm:mt-2 font-medium text-indigo-500">
                            One Source of Truth. Infinite Possibilities.
                        </span>
                    </p>
                </div>

                {/* Diagram Container */}
                <div className="relative w-full">
                    {/* The Diagram Component - Self-responsive now */}
                    <CloudIllustrations />
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
