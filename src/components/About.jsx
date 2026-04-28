import React from 'react';
import { Users, Heart, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import familyPhoto from '../assets/family-photo.jpg';
import officeBg from '../assets/office-bg.png';
import './About.css';

const About = () => {
    return (
        <section className="about-section" id="about">
            <div
                className="section-bg"
                style={{ backgroundImage: `url(${officeBg})` }}
            ></div>
            <div className="section-overlay"></div>
            <div className="about-container">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="about-image"
                >
                    <img src={familyPhoto} alt="G&G Cleaning Family Team" loading="lazy" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="about-content"
                >
                    <span className="section-sub">Our Story</span>
                    <h2>A Family-Owned Cleaning Company <br />Built on Trust.</h2>

                    <p>
                        G&G Cleaning Services is a family-owned and operated business, established in 2008 by <strong>Griselda Alas</strong>. Coming from a close-knit family and working in the cleaning industry since the early 2000s, Griselda built her company through hard work, consistency, and genuine care for her clients.
                    </p>
                    <p>
                        Over the years, she has earned the trust of homeowners and businesses throughout Long Island by delivering reliable, detailed cleaning services. Many of our clients have been with us for 10 years or more—a testament to the quality of our work.
                    </p>
                    <p>
                        At G&G Cleaning Services, you’re not just hiring a cleaner—you’re partnering with a team that truly cares.
                    </p>

                    <div className="values-grid">
                        <div className="value-item">
                            <h4><Heart size={18} color="var(--color-secondary)" /> Established 2008</h4>
                            <p>Over 15 years of experience.</p>
                        </div>
                        <div className="value-item">
                            <h4><Shield size={18} color="var(--color-secondary)" /> Trust</h4>
                            <p>Fully insured, bonded, and screened.</p>
                        </div>
                        <div className="value-item">
                            <h4><Users size={18} color="var(--color-secondary)" /> Family</h4>
                            <p>Owned & operated by Griselda Alas.</p>
                        </div>
                        <div className="value-item">
                            <h4><Clock size={18} color="var(--color-secondary)" /> Consistent</h4>
                            <p>Detailed cleaning that exceeds expectations.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
