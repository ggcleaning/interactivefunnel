import React from 'react';
import { ArrowRight, CheckCircle2, Star, Home, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import TrustSignals from './TrustSignals';
import heroBg from '../assets/hero-bg.png';
import './Hero.css';
import './TrustSignals.css';

const STATS = [
    { icon: <Home size={15} />, value: '500+', label: 'Homes Cleaned' },
    { icon: <Star size={15} fill="#d4af37" color="#d4af37" />, value: '5.0', label: 'Google Rating' },
    { icon: <Clock size={15} />, value: '15+', label: 'Years Experience' },
];

const Hero = ({ onOpenEstimate }) => {
    return (
        <section className="hero" id="home">
            <div className="hero-bg" style={{ backgroundImage: `url(${heroBg})` }}></div>
            <div className="hero-overlay"></div>

            <div className="hero-content">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="badge"
                >
                    <CheckCircle2 size={16} color="var(--color-accent)" />
                    <span>📍 Serving Nassau & Suffolk Counties, Long Island</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="hero-title"
                >
                    Exquisite Cleaning. <br />
                    <span className="text-gradient">Impeccable Care.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="hero-subtitle"
                >
                    Experience the G&G difference. Family-owned residential and commercial cleaning trusted by Long Island's finest homes and businesses.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="hero-buttons"
                    style={{ flexWrap: 'wrap', gap: '1rem' }}
                >
                    <button onClick={onOpenEstimate} className="btn-primary" id="hero-estimate-btn">
                        Get Instant Resident Quote <ArrowRight size={18} />
                    </button>
                    <a href="#contact" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Request Commercial Quote <ArrowRight size={16} />
                    </a>
                </motion.div>

                {/* ── Floating Stats Bar ── */}
                <motion.div
                    className="hero-stats"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    {STATS.map((s, i) => (
                        <motion.div
                            key={i}
                            className="hero-stat-pill"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                        >
                            <span className="hero-stat-icon">{s.icon}</span>
                            <span className="hero-stat-value">{s.value}</span>
                            <span className="hero-stat-label">{s.label}</span>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                >
                    <TrustSignals />
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
