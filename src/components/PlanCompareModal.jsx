import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus } from 'lucide-react';
import { RECURRING_PLANS, PLAN_NOTES } from '../data/config';
import './PlanCompareModal.css';

// ── Feature comparison table rows ────────────────────────────────────────────
const COMPARE_ROWS = [
    { label: 'Cleanings per month',    basic: '1',               plus: '2',                premium: '2+' },
    { label: 'Member savings',         basic: '5% Off Quote',     plus: '10% Off Quote',    premium: 'Max Savings' },
    { label: 'Priority scheduling',    basic: true,              plus: 'High',             premium: 'Top Tier' },
    { label: 'Flexible rescheduling',  basic: true,              plus: true,               premium: true },
    { label: 'Quarterly member perk',  basic: false,             plus: true,               premium: true },
    { label: 'Dedicated team',         basic: false,             plus: false,              premium: true },
    { label: 'Home condition report',  basic: false,             plus: false,              premium: true },
    { label: '1st clean baseline',     basic: 'Deep Clean',      plus: 'Deep Clean',       premium: 'Deep Clean' },
    { label: 'Down payment',           basic: '25% based on quote', plus: '25% based on quote', premium: '25% based on quote' },
];

const CellValue = ({ value }) => {
    if (value === true)  return <Check size={18} className="pcm-check" />;
    if (value === false) return <Minus size={16} className="pcm-minus" />;
    return <span>{value}</span>;
};

const PlanCompareModal = ({ isOpen, onClose, onSelectPlan }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                className="pcm-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="pcm-modal"
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.97 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="pcm-header">
                        <div>
                            <div className="pcm-eyebrow">Compare Plans</div>
                            <h2 className="pcm-title">Choose the Right Cleaning Plan</h2>
                        </div>
                        <button className="pcm-close" onClick={onClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Table */}
                    <div className="pcm-scroll">
                        <table className="pcm-table">
                            <thead>
                                <tr>
                                    <th className="pcm-th-feature">Feature</th>
                                    {RECURRING_PLANS.map(plan => (
                                        <th key={plan.id} className={`pcm-th-plan${plan.featured ? ' pcm-th-featured' : ''}`}>
                                            {plan.tag && <div className="pcm-best-badge">{plan.tag}</div>}
                                            <div className="pcm-plan-name">{plan.name}</div>
                                            <div className="pcm-plan-freq">{plan.frequency}</div>
                                            <div className="pcm-plan-price">{plan.price}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARE_ROWS.map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'pcm-row-even' : ''}>
                                        <td className="pcm-td-label">{row.label}</td>
                                        <td className="pcm-td"><CellValue value={row.basic} /></td>
                                        <td className="pcm-td pcm-td-featured"><CellValue value={row.plus} /></td>
                                        <td className="pcm-td"><CellValue value={row.premium} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pcm-footer-notes" style={{ padding: '16px 24px', background: '#f9fafb', fontSize: '0.78rem', color: '#6b7280', borderTop: '1px solid #f3f4f6', lineHeight: 1.5 }}>
                        <p style={{ margin: 0 }}><strong>Pricing:</strong> {PLAN_NOTES.pricing}</p>
                        <p style={{ margin: '4px 0 0' }}><strong>Baselines:</strong> {PLAN_NOTES.operational}</p>
                    </div>

                    {/* CTA Row */}
                    <div className="pcm-cta-row">
                        {RECURRING_PLANS.map(plan => (
                            <button
                                key={plan.id}
                                className={`pcm-cta-btn${plan.featured ? ' pcm-cta-featured' : ''}`}
                                onClick={() => { onClose(); onSelectPlan(plan); }}
                            >
                                Start {plan.name} →
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default PlanCompareModal;
