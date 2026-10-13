import { motion } from 'framer-motion';
import {
    Facebook, Twitter, Instagram, Linkedin,
    Mail, Phone, MapPin
} from 'lucide-react';

const Footer = () => {
    const quickLinks = [
        { name: 'Home', href: '#home' },
        { name: 'About Us', href: '#about' },
        { name: 'Portals', href: '#portals' },
        { name: 'Features', href: '#features' },
        { name: 'Contact', href: '#contact' },
    ];

    const portalLinks = [
        { name: 'Admission Portal', id: 'admissions-crm' },
        { name: 'Student Portal', id: 'student-portal' },
        { name: 'Fee Management', id: 'fee-management' },
        { name: 'Transport Hub', id: 'transport-management' },
        { name: 'HRMS & Payroll', id: 'hrms' },
        { name: 'Hostel Automation', id: 'hostel-automation' }
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Twitter, href: '#', label: 'Twitter' }
    ];

    return (
        <footer className="w-full relative bg-[#07090E] text-white pt-20 pb-10 border-t-[4px] border-indigo-500 overflow-hidden">
            <div className="w-full px-6 sm:px-12 lg:px-20 flex flex-col justify-between">
                
                {/* Top Section: 4 Columns (2 cols on mobile for Quick Links & Cloud Portals side-by-side) */}
                <div className="w-full grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-10 lg:gap-14 pt-4 pb-12">

                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1 lg:col-span-1 space-y-5">
                        <div>
                            <h3 className="text-2xl font-bold tracking-wider text-white">
                                PYDAH<span className="text-indigo-400">SOFT</span>
                            </h3>
                            <p className="text-[11px] font-bold tracking-[0.25em] text-indigo-400 uppercase mt-1">
                                Organization
                            </p>
                        </div>
                        <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                            Building future-ready digital solutions that drive innovation and institutional excellence.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            {socialLinks.map((social, idx) => (
                                <motion.a
                                    key={idx}
                                    href={social.href}
                                    whileHover={{ y: -2, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-indigo-400 hover:border-indigo-400/60 hover:bg-indigo-500/10 transition-all duration-200"
                                    aria-label={social.label}
                                >
                                    <social.icon size={15} />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links Column */}
                    <div className="col-span-1">
                        <h4 className="text-base font-semibold text-white mb-4 sm:mb-6 tracking-wide">
                            Quick Links
                        </h4>
                        <ul className="space-y-3 sm:space-y-4">
                            {quickLinks.map((link, idx) => (
                                <li key={idx}>
                                    <a
                                        href={link.href}
                                        className="text-slate-300 hover:text-indigo-400 transition-colors duration-200 text-sm block"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Cloud Portals Column - placed on the right side of Quick Links on mobile */}
                    <div className="col-span-1">
                        <h4 className="text-base font-semibold text-white mb-4 sm:mb-6 tracking-wide">
                            Cloud Portals
                        </h4>
                        <ul className="space-y-3 sm:space-y-4">
                            {portalLinks.map((link, idx) => (
                                <li key={idx}>
                                    <button
                                        className="text-slate-300 hover:text-indigo-400 transition-colors duration-200 text-sm block text-left"
                                    >
                                        {link.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Us Column */}
                    <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <h4 className="text-base font-semibold text-white mb-4 sm:mb-6 tracking-wide">
                            Contact Us
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3 items-start">
                                <MapPin size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                                <span className="text-slate-300 leading-relaxed text-sm">
                                    Kakinada – Yanam Road, Patavala, Tallarevu (M), Kakinada District, Andhra Pradesh, India Pincode 533461
                                </span>
                            </li>
                            <li className="flex gap-3 items-center">
                                <Phone size={18} className="text-indigo-400 shrink-0" />
                                <span className="text-slate-300 text-sm">+91 9951354444</span>
                            </li>
                            <li className="flex gap-3 items-center">
                                <Mail size={18} className="text-indigo-400 shrink-0" />
                                <a
                                    href="mailto:team@pydahsoft.in"
                                    className="text-slate-300 hover:text-indigo-400 transition-colors duration-200 text-sm"
                                >
                                    team@pydahsoft.in
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Massive Brand Name Display (Antigravity Style) */}
                <div className="w-full text-center select-none overflow-hidden my-6 md:my-10">
                    <h2 className="text-[13vw] font-black tracking-tighter leading-none text-white whitespace-nowrap block">
                        PYDAH<span className="text-indigo-500">SOFT</span>
                    </h2>
                </div>

                {/* Bottom Bar: Divider, Copyright & Legal Links */}
                <div className="w-full pt-8 pb-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400 font-medium">
                    <p>
                        © {new Date().getFullYear()} PYDAH SOFT. All Rights Reserved.
                    </p>
                    <div className="flex gap-6 sm:gap-8 items-center">
                        <a href="#" className="hover:text-indigo-400 transition-colors duration-200">Terms of Service</a>
                        <a href="#" className="hover:text-indigo-400 transition-colors duration-200">Privacy Policy</a>
                        <a href="#" className="hover:text-indigo-400 transition-colors duration-200">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
