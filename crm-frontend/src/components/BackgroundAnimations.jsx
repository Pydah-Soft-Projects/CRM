import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Bus,
    Home, UserRound, Box, GraduationCap,
    Brain, Activity, Landmark, Award, Library
} from 'lucide-react';

const BackgroundAnimations = ({ portalId, color }) => {
    // Shared container styles - Removed global opacity for full control
    const containerClasses = "absolute inset-0 pointer-events-none overflow-hidden";

    // Helper to get visibility based on distance from center/heading area
    const getVisibilityFactor = (x, y) => {
        // Center shifted slightly up (42%) to clear the top heading specifically
        const dx = (x - 50) * 0.8; // Wider horizontal clear
        const dy = (y - 42);
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Larger clearing radius (20 units) with steeper falloff
        return Math.min(1, Math.max(0.01, (dist - 20) / 30));
    };

    // 1. ADMISSIONS: Connecting Lead Network
    const AdmissionsAnimation = () => (
        <div className={containerClasses}>
            {[...Array(40)].map((_, i) => {
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const v = getVisibilityFactor(x, y);
                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: Math.random() * 8 + 4,
                            height: Math.random() * 8 + 4,
                            backgroundColor: color,
                            left: `${x}%`,
                            top: `${y}%`,
                            boxShadow: `0 0 15px ${color}80`
                        }}
                        animate={{
                            x: [0, Math.random() * 300 - 150, 0],
                            y: [0, Math.random() * 300 - 150, 0],
                            opacity: [0.4 * v, v, 0.4 * v],
                            scale: [1, 1.8, 1]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                );
            })}
            <svg className="w-full h-full opacity-40">
                <defs>
                    <radialGradient id={`grad-${portalId}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="50%" cy="50%" r="50%" fill={`url(#grad-${portalId})`} />
            </svg>
        </div>
    );

    // 2. STUDENT PORTAL: Floating Knowledge Icons
    const StudentAnimation = () => {
        const icons = [BookOpen, GraduationCap, Brain, Activity];
        return (
            <div className={containerClasses}>
                {[...Array(15)].map((_, i) => {
                    const x = Math.random() * 100;
                    const y = Math.random() * 100;
                    const v = getVisibilityFactor(x, y);
                    const Icon = icons[i % icons.length];
                    return (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                color: color,
                                filter: `drop-shadow(0 0 10px ${color}60)`
                            }}
                            animate={{
                                y: [0, -50, 0],
                                rotate: [0, 20, -20, 0],
                                opacity: [0.3 * v, 0.9 * v, 0.3 * v],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{
                                duration: Math.random() * 6 + 6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Icon size={Math.random() * 50 + 30} strokeWidth={1} />
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    // 3. FEE MANAGEMENT: Financial Pulse / Bars
    const FeeAnimation = () => (
        <div className={containerClasses + " flex items-end justify-around px-10"}>
            {[...Array(20)].map((_, i) => {
                const xPos = (i / 19) * 100;
                const v = Math.min(1, Math.max(0.1, Math.abs(xPos - 50) / 30));
                return (
                    <motion.div
                        key={i}
                        className="w-10 rounded-t-3xl"
                        style={{
                            backgroundColor: color,
                            height: '25%',
                            boxShadow: `0 0 20px ${color}40`,
                        }}
                        animate={{
                            height: [`${25 + Math.random() * 50}%`, `${15 + Math.random() * 30}%`, `${40 + Math.random() * 60}%`],
                            opacity: [0.2 * v, 0.6 * v, 0.2 * v]
                        }}
                        transition={{
                            duration: Math.random() * 4 + 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                );
            })}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                <Landmark size={500} strokeWidth={0.5} color={color} style={{ filter: `drop-shadow(0 0 30px ${color})` }} />
            </div>
        </div>
    );

    // 4. TRANSPORT: Light Streaks & Moving Bus
    const TransportAnimation = () => (
        <div className={containerClasses}>
            {/* Full Width Subtle "Lanes" - Made Lighter and Full Width */}
            {[...Array(25)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-full h-[1px]"
                    style={{
                        top: `${5 + i * 3.8}%`,
                        backgroundColor: `${color}10`, // Very subtle base lines
                    }}
                />
            ))}

            {/* Fast Moving Full-Width Light Rays */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={`ray-${i}`}
                    className="absolute w-full h-[1px]"
                    style={{
                        top: `${10 + i * 11}%`,
                        background: `linear-gradient(to right, transparent, ${color}, white, ${color}, transparent)`,
                        boxShadow: `0 0 10px ${color}40`,
                    }}
                    animate={{
                        x: ['-100%', '100%'],
                        opacity: [0.05, 0.2, 0.05] // Keeping it light
                    }}
                    transition={{
                        duration: Math.random() * 2 + 1.5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 5
                    }}
                />
            ))}

            {/* Bus 1: Right to Left (Moving Left, Facing Left) */}
            {/* Bus 1: Right to Left (Moving Left, Facing Left) */}
            <motion.div
                className="absolute top-[68%] z-10"
                animate={{ x: ['120vw', '-30vw'] }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 1 }}
            >
                <div className="relative">
                    {/* Flipped to face LEFT to match movement direction */}
                    <Bus size={280} strokeWidth={0.5} color={color} className="-scale-x-100 opacity-40" />

                    {/* Headlights (Front - Left side) */}
                    <div className="absolute top-[55%] -left-10 w-48 h-24 bg-gradient-to-l from-white/30 to-transparent blur-2xl rounded-full rotate-[5deg]" />

                    {/* Tail lights (Back - Right side) */}
                    <div className="absolute top-[65%] right-2 w-4 h-8 bg-red-500/40 blur-md rounded-full" />
                </div>
            </motion.div>

            {/* Bus 2: Left to Right (Moving Right, Facing Right) */}
            {/* Bus 2: Left to Right (Moving Right, Facing Right) */}
            <motion.div
                className="absolute top-[32%] z-10"
                animate={{ x: ['-30vw', '120vw'] }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear", delay: 5 }}
            >
                <div className="relative">
                    {/* Default orientation faces RIGHT to match movement direction */}
                    <Bus size={190} strokeWidth={0.5} color={color} className="opacity-30" />

                    {/* Headlights (Front - Right side) */}
                    <div className="absolute top-[55%] -right-10 w-32 h-16 bg-gradient-to-r from-white/20 to-transparent blur-xl rounded-full rotate-[-5deg]" />

                    {/* Tail lights (Back - Left side) */}
                    <div className="absolute top-[65%] left-2 w-3 h-6 bg-red-500/30 blur-sm rounded-full" />
                </div>
            </motion.div>

            {/* Background speed pulse */}
            <motion.div
                className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-10"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </div>
    );

    // 5. HOSTEL: Safe Concentric Pulses
    const HostelAnimation = () => (
        <div className={containerClasses + " flex items-center justify-center"}>
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full border-[3px]"
                    style={{ borderColor: color, boxShadow: `inset 0 0 20px ${color}, 0 0 20px ${color}` }}
                    animate={{
                        width: ['0%', '180%'],
                        height: ['0%', '180%'],
                        opacity: [0.8, 0],
                        borderWidth: ['6px', '1px']
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        delay: i * 2,
                        ease: "easeOut"
                    }}
                />
            ))}
            <Home size={400} color={color} strokeWidth={0.5} className="opacity-15" />
        </div>
    );

    // 6. HRMS: Network Nodes - Now Randomized
    const HRMSAnimation = () => (
        <div className={containerClasses}>
            {[...Array(20)].map((_, i) => {
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const v = getVisibilityFactor(x, y);
                return (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${x}%`,
                            top: `${y}%`
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4 * v, 1 * v, 0.4 * v] }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 0.25 }}
                            className="rounded-full w-6 h-6"
                            style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}` }}
                        />
                        <UserRound size={60} color={color} strokeWidth={1} className="mt-3" style={{ opacity: 0.2 * v }} />
                    </motion.div>
                );
            })}
        </div>
    );

    // 7. PHARMACY: Molecule / Hexagon Grid - Now Randomized
    const PharmacyAnimation = () => (
        <div className={containerClasses}>
            {[...Array(25)].map((_, i) => {
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const v = getVisibilityFactor(x, y);
                return (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${x}%`,
                            top: `${y}%`
                        }}
                        animate={{
                            rotate: 360,
                            opacity: [0.2 * v, 0.6 * v, 0.2 * v],
                            scale: [0.9, 1.1, 0.9],
                            y: [0, -20, 0]
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <Box size={100} color={color} strokeWidth={0.5} style={{ filter: `drop-shadow(0 0 15px ${color})` }} />
                    </motion.div>
                );
            })}
        </div>
    );

    // 8. ACADEMIC PORTAL: Scholarly constellations, diplomas, graduation caps, library
    const AcademicAnimation = () => {
        const academicIcons = [GraduationCap, BookOpen, Award, Library];
        return (
            <div className={containerClasses}>
                {[...Array(18)].map((_, i) => {
                    const x = Math.random() * 100;
                    const y = Math.random() * 100;
                    const v = getVisibilityFactor(x, y);
                    const Icon = academicIcons[i % academicIcons.length];
                    return (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                color: color,
                                filter: `drop-shadow(0 0 12px ${color}80)`
                            }}
                            animate={{
                                y: [0, -35, 0],
                                rotate: [0, 15, -15, 0],
                                opacity: [0.25 * v, 0.85 * v, 0.25 * v],
                                scale: [1, 1.25, 1]
                            }}
                            transition={{
                                duration: Math.random() * 8 + 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.3
                            }}
                        >
                            <Icon size={Math.random() * 45 + 32} strokeWidth={1.2} />
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    // Default Fallback
    const DefaultAnimation = () => (
        <div className={containerClasses}>
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="w-full h-full rounded-full blur-[150px]"
                style={{ backgroundColor: color }}
            />
        </div>
    );

    const renderAnimation = () => {
        switch (portalId) {
            case 'admissions-crm': return <AdmissionsAnimation />;
            case 'student-portal': return <StudentAnimation />;
            case 'fee-management': return <FeeAnimation />;
            case 'transport-management': return <TransportAnimation />;
            case 'hostel-automation': return <HostelAnimation />;
            case 'hrms': return <HRMSAnimation />;
            case 'academic-portal': return <AcademicAnimation />;
            case 'examination-portal': return <StudentAnimation />;
            default: return <DefaultAnimation />;
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={portalId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
                style={{
                    // Creates a clear "hole" specifically around the heading area (approx 40% from top)
                    maskImage: 'radial-gradient(ellipse at 50% 40%, transparent 10%, black 45%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, transparent 10%, black 45%)'
                }}
            >
                {renderAnimation()}
            </motion.div>
        </AnimatePresence>
    );
};

export default BackgroundAnimations;
