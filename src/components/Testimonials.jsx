import React from 'react';
import { Star, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import bathroomBg from '../assets/bathroom-bg.png';
import './Testimonials.css';

const reviews = [
    {
        name: 'Sarah Jenkins',
        initial: 'S',
        location: 'Garden City, NY',
        text: "I've tried three different cleaning services on Long Island and G&G is by far the best. They are thorough, polite, and always on time. My house smells amazing whenever they leave!",
        stars: 5,
    },
    {
        name: 'Michael Ross',
        initial: 'M',
        location: 'Mineola, NY',
        text: 'We hired G&G for our law office in Garden City. They have been maintaining our space for over a year now. Very professional and consistent. Highly recommend for commercial needs.',
        stars: 5,
    },
    {
        name: 'Emily T.',
        initial: 'E',
        location: 'Huntington, NY',
        text: 'Did a fantastic job with my move-out deep clean. Got my full security deposit back thanks to them. The oven and fridge looked brand new!',
        stars: 5,
    },
    {
        name: 'Diana Flores',
        initial: 'D',
        location: 'Commack, NY',
        text: "Absolutely worth every penny. Griselda's team is detail-obsessed — they cleaned spots I didn't even think to ask about. My home has never looked so good. We're now on a weekly schedule!",
        stars: 5,
    },
];

const Testimonials = () => (
    <section className="testimonials-section">
        <div className="section-bg" style={{ backgroundImage: `url(${bathroomBg})` }} />
        <div className="section-overlay-testimonials" />

        <div className="section-header">
            <span className="section-sub">Testimonials</span>
            <h2 className="section-title">Trusted by your neighbors</h2>
            <p className="section-desc">Don't just take our word for it. See what our happy clients have to say.</p>
        </div>

        <div className="testimonials-grid">
            {reviews.map((review, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="review-card"
                >
                    <div className="review-quote-mark">"</div>

                    <div className="review-header">
                        <div className="reviewer-initial">{review.initial}</div>
                        <div className="review-meta">
                            <h4>{review.name}</h4>
                            <span className="review-location">{review.location}</span>
                            <div className="review-stars">
                                {[...Array(review.stars)].map((_, i) => (
                                    <Star key={i} size={13} fill="#d4af37" color="#d4af37" />
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="review-text">"{review.text}"</p>

                    <div className="review-verified">
                        <BadgeCheck size={14} color="#4285F4" />
                        <span>Verified Google Review</span>
                    </div>
                </motion.div>
            ))}
        </div>

        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="google-badge"
        >
            <div style={{ display: 'flex', gap: '2px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#d4af37" color="#d4af37" />)}
            </div>
            <span>5.0 Rating · 150+ Verified Google Reviews</span>
        </motion.div>
    </section>
);

export default Testimonials;
