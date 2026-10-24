import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    GraduationCap,
    Users,
    FileText,
    IndianRupee,
    Bed,
    UserCog,
    User,
    Package,
    Bus,
    HardHat,
    Briefcase,
    ArrowRight,
    Loader2
} from 'lucide-react';
import {
    Books3DIllustration,
    Admission3DIllustration,
    EMSExam3DIllustration,
    FeeCoins3DIllustration,
    HostelBed3DIllustration,
    HRMSBadge3DIllustration,
    StudentDiploma3DIllustration,
    Boxes3DIllustration,
    Bus3DIllustration,
    Recruitment3DIllustration,
    LabourScanner3DIllustration,
    FluidWaveGraphic
} from './PortalCardIllustrations';

/**
 * Utility to convert Hex color to RGBA with precise alpha.
 * Ensures 100% browser compatibility across all devices.
 */
export function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(99, 102, 241, ${alpha})`;
    let cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Maps portalId or type to matching Lucide Icon.
 */
export function getPortalIcon(portalId, size = 20) {
    switch (portalId) {
        case 'academic-portal':
            return <GraduationCap size={size} />;
        case 'admissions-crm':
            return <Users size={size} />;
        case 'examination-portal':
            return <FileText size={size} />;
        case 'fee-management':
            return <IndianRupee size={size} />;
        case 'hostel-automation':
            return <Bed size={size} />;
        case 'hrms':
            return <UserCog size={size} />;
        case 'student-portal':
            return <User size={size} />;
        case 'stationary-management':
            return <Package size={size} />;
        case 'transport-management':
            return <Bus size={size} />;
        case 'staff-recruitment':
            return <Briefcase size={size} />;
        case 'sams':
            return <HardHat size={size} />;
        default:
            return <Package size={size} />;
    }
}

/**
 * Renders the unique 3D vector illustration for each card with proportional sizing:
 * - XLARGE for tall cards (Academic & Stationary)
 * - LARGE for wide card (Admission)
 * - MEDIUM for medium cards (EMS, Transport, Staff Recruitment, Labour SAMS)
 * - SMALL for compact cards (Fee, Hostel, HRMS, Student)
 */
export function renderPortalIllustration(portalId) {
    switch (portalId) {
        case 'academic-portal':
            return <Books3DIllustration size="xlarge" />;
        case 'stationary-management':
            return <Boxes3DIllustration size="xlarge" />;
        case 'admissions-crm':
            return <Admission3DIllustration size="large" />;
        case 'transport-management':
            return <Bus3DIllustration size="medium" />;
        case 'examination-portal':
            return <EMSExam3DIllustration size="medium" />;
        case 'staff-recruitment':
            return <Recruitment3DIllustration size="medium" />;
        case 'sams':
            return <LabourScanner3DIllustration size="medium" />;
        case 'fee-management':
            return <FeeCoins3DIllustration size="small" />;
        case 'hostel-automation':
            return <HostelBed3DIllustration size="small" />;
        case 'hrms':
            return <HRMSBadge3DIllustration size="small" />;
        case 'student-portal':
            return <StudentDiploma3DIllustration size="small" />;
        default:
            return null;
    }
}

/**
 * PortalBentoCard
 *
 * Implements:
 * 1. Single Heading aligned NEXT to the Icon for every card
 * 2. Random/Varied Bento Layout: Multiple cards with varied sizes:
 *    - 2 Tall cards (Academic on left, Stationary on right)
 *    - 1 Wide banner card (Admission on top)
 *    - 5 Medium cards (EMS, Student, Transport, Recruitment, SAMS)
 *    - 3 Compact cards (Fee, Hostel, HRMS)
 * 3. Proportional 3D illustrations on all cards
 */
export const PortalBentoCard = ({
    portal,
    user,
    isLaunching,
    onPortalClick,
    onLoginClick,
    onColorChange,
    isBentoLayout = true
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [localColor, setLocalColor] = useState(portal.color || '#6366f1');

    const activeColor = portal.color || localColor;

    // Derived color tokens computed from ONE single color
    const rgbaSoft = hexToRgba(activeColor, 0.12);
    const rgbaSubtle = hexToRgba(activeColor, 0.04);
    const rgbaBorder = hexToRgba(activeColor, 0.22);
    const rgbaBorderHover = hexToRgba(activeColor, 0.65);
    const rgbaShadow = hexToRgba(activeColor, 0.14);
    const rgbaShadowHover = hexToRgba(activeColor, 0.28);

    const handleCardClick = (e) => {
        if (e.target.tagName === 'INPUT') return;
        e.preventDefault();
        if (!user) {
            if (onLoginClick) onLoginClick();
            return;
        }
        if (onPortalClick) {
            onPortalClick(portal);
        }
    };

    const handleColorPickerChange = (e) => {
        const newColor = e.target.value;
        setLocalColor(newColor);
        if (onColorChange) {
            onColorChange(portal.portalId, newColor);
        }
    };

    const isAcademic = portal.portalId === 'academic-portal';
    const isAdmission = portal.portalId === 'admissions-crm';
    const isEMS = portal.portalId === 'examination-portal';
    const isStudent = portal.portalId === 'student-portal';
    const isStationary = portal.portalId === 'stationary-management';
    const isTransport = portal.portalId === 'transport-management';
    const isRecruitment = portal.portalId === 'staff-recruitment';
    const isSAMS = portal.portalId === 'sams';

    // CSS variables applied at root of each card
    const cardStyle = {
        '--card-color': activeColor,
        '--card-color-soft': rgbaSoft,
        '--card-color-subtle': rgbaSubtle,
        '--card-border': rgbaBorder,
        '--card-border-hover': rgbaBorderHover,
        borderColor: isHovered ? rgbaBorderHover : rgbaBorder,
        boxShadow: isHovered
            ? `0 12px 24px -6px ${rgbaShadowHover}, 0 4px 8px -3px rgba(15,23,42,0.04)`
            : `0 4px 14px -3px ${rgbaShadow}, 0 2px 4px -2px rgba(15,23,42,0.02)`,
        background: `radial-gradient(ellipse at 92% 8%, ${rgbaSubtle} 0%, #ffffff 75%)`
    };

    // Varied/Random Bento Layout Spans across 12 columns & 4 rows:
    // Row 1: Academic (3 cols, tall) + Admission (5 cols, wide) + EMS (4 cols, medium) = 12 cols
    // Row 2: (Academic 3 cols) + Fee (3 cols) + Hostel (3 cols) + HRMS (3 cols) = 12 cols
    // Row 3: Student (4 cols, medium) + Transport (4 cols, medium) + Stationary (4 cols, tall) = 12 cols
    // Row 4: Recruitment (4 cols, medium) + SAMS (4 cols, medium) + (Stationary 4 cols) = 12 cols
    let gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-4';
    if (isAcademic && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-3 lg:row-span-2';
    } else if (isAdmission && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-5 lg:row-span-1';
    } else if (isEMS && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-1';
    } else if ((portal.portalId === 'fee-management' || portal.portalId === 'hostel-automation' || portal.portalId === 'hrms') && isBentoLayout) {
        gridSpanClass = 'col-span-12 sm:col-span-6 lg:col-span-3 lg:row-span-1';
    } else if (isStudent && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-1';
    } else if (isTransport && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-1';
    } else if (isStationary && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-2';
    } else if (isRecruitment && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-1';
    } else if (isSAMS && isBentoLayout) {
        gridSpanClass = 'col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-1';
    }

    const isTallCard = (isAcademic || isStationary) && isBentoLayout;

    // Render Tall Cards (Academic Portal on top-left AND Stationary Management on bottom-right)
    if (isTallCard) {
        return (
            <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                onClick={handleCardClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={cardStyle}
                className={`${gridSpanClass} group relative bg-white rounded-2xl sm:rounded-3xl border-2 p-3 sm:p-4.5 flex flex-col justify-between h-full min-h-[220px] lg:min-h-0 cursor-pointer overflow-hidden transition-all duration-300`}
            >
                {/* Top Header: Icon & Single Heading aligned side by side! */}
                <div className="flex items-center justify-between gap-2.5 relative z-10 shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <div
                            style={{ backgroundColor: rgbaSoft, color: activeColor }}
                            className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-xs"
                        >
                            {getPortalIcon(portal.portalId, 22)}
                        </div>

                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[24px] xl:text-[26px] font-black text-slate-900 tracking-tight leading-tight truncate">
                            {portal.title}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <input
                            type="color"
                            value={activeColor}
                            onChange={handleColorPickerChange}
                            title="Click to change this card's color"
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full cursor-pointer border-0 bg-transparent p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                            {portal.number || '01'}
                        </span>
                    </div>
                </div>

                {/* Content: Description */}
                <div className="my-auto pt-2 pb-1 relative z-10 min-w-0">
                    <p className="text-slate-500 text-xs sm:text-[13px] lg:text-sm leading-relaxed font-medium line-clamp-3">
                        {portal.description}
                    </p>
                </div>

                {/* Bottom Row: Action Button on Left, Big 3D Illustration on Right */}
                <div className="pt-1 flex items-end justify-between relative z-10 mt-auto shrink-0">
                    {isLaunching ? (
                        <div
                            style={{ backgroundColor: activeColor, color: '#ffffff' }}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-sm"
                        >
                            <Loader2 size={15} className="animate-spin" />
                        </div>
                    ) : (
                        <div
                            style={{ backgroundColor: activeColor, color: '#ffffff' }}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                        >
                            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                    )}

                    {/* Big 3D Illustration */}
                    <div className="relative -mb-2 -mr-2 overflow-visible shrink-0 origin-bottom-right">
                        {renderPortalIllustration(portal.portalId)}
                    </div>
                </div>
            </motion.div>
        );
    }

    // Render All Other Bento Cards with Icon and Single Heading side by side!
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={cardStyle}
            className={`${gridSpanClass} group relative bg-white rounded-2xl sm:rounded-3xl border-2 p-2.5 sm:p-3.5 flex flex-col justify-between h-full min-h-[115px] lg:min-h-0 cursor-pointer overflow-hidden transition-all duration-300`}
        >
            {/* Ambient Background Wave */}
            {isEMS && <FluidWaveGraphic position="bottom-left" />}
            {isStudent && <FluidWaveGraphic position="bottom-right" />}

            {/* Top Row: Icon + Single Heading Title aligned side by side! */}
            <div className="flex items-center justify-between gap-2 relative z-10 shrink-0 mb-1">
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                    <div
                        style={{ backgroundColor: rgbaSoft, color: activeColor }}
                        className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-xs"
                    >
                        {getPortalIcon(portal.portalId, 21)}
                    </div>

                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-[22px] font-black text-slate-900 tracking-tight leading-tight truncate">
                        {portal.title}
                    </h3>
                </div>

                {/* Number badge & Color tester on Right */}
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <input
                        type="color"
                        value={activeColor}
                        onChange={handleColorPickerChange}
                        title="Click to change this card's color"
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full cursor-pointer border-0 bg-transparent p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                        {portal.number || '00'}
                    </span>
                </div>
            </div>

            {/* Middle: Description text */}
            <div className="relative z-10 min-w-0 pr-12 sm:pr-18 md:pr-22 lg:pr-26 xl:pr-28 flex-1 flex flex-col justify-center pt-0.5 pb-0.5">
                <p className="text-slate-500 text-[11px] sm:text-xs lg:text-[13px] leading-relaxed font-medium line-clamp-2">
                    {portal.description}
                </p>
            </div>

            {/* Bottom Row: Circular Action Arrow Button */}
            <div className="relative z-20 flex items-center justify-end mt-auto shrink-0 pt-0.5">
                {isLaunching ? (
                    <div
                        style={{ backgroundColor: rgbaSoft, color: activeColor }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-[color-mix(in_srgb,var(--card-color)_30%,transparent)] shadow-xs"
                    >
                        <Loader2 size={13} className="animate-spin" />
                    </div>
                ) : (
                    <div
                        style={{
                            backgroundColor: isHovered ? activeColor : rgbaSoft,
                            color: isHovered ? '#ffffff' : activeColor,
                            borderColor: isHovered ? activeColor : rgbaBorder
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border shadow-xs transition-all duration-300 group-hover:scale-105"
                    >
                        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                )}
            </div>

            {/* Right Side Unique 3D Graphics */}
            <div className="hidden sm:block absolute -right-2 -bottom-2 shrink-0 origin-bottom-right opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
                {renderPortalIllustration(portal.portalId)}
            </div>
        </motion.div>
    );
};

export default PortalBentoCard;
