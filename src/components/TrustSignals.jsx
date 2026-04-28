import React from 'react';
import { Star, ShieldCheck, Users, Clock } from 'lucide-react';

const TrustSignals = () => {
    return (
        <div className="trust-signals">
            <div className="trust-item">
                <div className="stars">
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                    <Star size={20} fill="#f59e0b" color="#f59e0b" />
                </div>
                <span><strong>5.0</strong> Google Reviews</span>
            </div>

            <div className="divider"></div>

            <div className="trust-item">
                <Users size={20} color="var(--color-secondary)" />
                <span>Family-Owned & Operated</span>
            </div>

            <div className="divider"></div>

            <div className="trust-item">
                <ShieldCheck size={20} color="var(--color-secondary)" />
                <span>Fully Insured & Bonded</span>
            </div>
        </div>
    );
};

export default TrustSignals;
