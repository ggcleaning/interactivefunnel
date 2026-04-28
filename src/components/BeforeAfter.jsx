import React, { useState, useRef } from 'react';
import { MoveHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import beforeImage from '../assets/before-kitchen.jpg';
import afterImage from '../assets/after-kitchen.jpg';
import './BeforeAfter.css';

const BeforeAfter = () => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleDrag = (e, clientX) => {
        if (!containerRef.current) return;
        const { left, width } = containerRef.current.getBoundingClientRect();
        const position = ((clientX - left) / width) * 100;
        setSliderPosition(Math.min(100, Math.max(0, position)));
    };

    const onMouseDown = () => setIsDragging(true);
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e) => {
        if (isDragging) handleDrag(e, e.clientX);
    };
    const onTouchMove = (e) => handleDrag(e, e.touches[0].clientX);

    return (
        <section className="before-after-section">
            <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <span className="section-sub">See the Difference</span>
                <h2 className="section-title">Transformation Gallery</h2>
                <p className="section-desc">Drag the slider to see the G&G deep clean effect.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div
                    className="slider-container"
                    ref={containerRef}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onMouseMove={onMouseMove}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onMouseUp}
                >
                    {/* 'After' Image (Clean) - Background */}
                    <div className="image-layer after-image">
                        <img src={afterImage} alt="After cleaning - spotless kitchen" loading="lazy" />
                        <div className="image-label after-label">AFTER</div>
                    </div>

                    {/* 'Before' Image (Messy) - Clipped */}
                    <div
                        className="image-layer before-image"
                        style={{ width: `${sliderPosition}%` }}
                    >
                        <img src={beforeImage} alt="Before cleaning - messy kitchen" loading="lazy" />
                        <div className="image-label before-label">BEFORE</div>
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="slider-handle"
                        style={{ left: `${sliderPosition}%` }}
                    >
                        <div className="handle-line"></div>
                        <div className="handle-circle">
                            <MoveHorizontal size={20} color="#581c87" />
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.p
                className="slider-hint"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                ← Drag the slider to reveal the transformation →
            </motion.p>
        </section>
    );
};

export default BeforeAfter;
