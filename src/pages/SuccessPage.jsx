import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Calendar, ArrowRight, MessageSquare, Camera, Phone } from 'lucide-react';
import Sparkles from '../components/Sparkles';
import PhotoQuoteFlow from '../components/PhotoQuoteFlow';
import { sendToCRM } from '../utils/crm';

const SuccessPage = () => {
    const location = useLocation();
    const isBooking = location.pathname.includes('booking-confirmed');
    const [showPhotoFlow, setShowPhotoFlow] = useState(false);
    const [showCallForm, setShowCallForm] = useState(false);
    const [callRequested, setCallRequested] = useState(false);
    const [callPhone, setCallPhone] = useState('');
    
    // Retrieve state passed from navigation
    const state = location.state || {};
    const { showPhotoPrompt, form, estimate, isCommercial } = state;

    const handleCallRequest = async () => {
        if (!callPhone) return;
        setCallRequested(true);
        try {
            await sendToCRM({
                ...form,
                name: form?.name || 'Customer from Success Page',
                phone: callPhone,
                status: 'Call Requested',
                tags: ['Call-Requested', 'Quote-Confirmation-Page']
            }, 'quote_request');
        } catch (e) {
            console.error('Failed to request call', e);
        }
    };
    
    let content;
    if (isBooking) {
        content = {
            title: "Welcome to the Family",
            subtitle: "Your booking is confirmed! We've officially reserved your spot to work our magic.",
            details: "A detailed receipt and confirmation has been sent to your inbox. Expect a text reminder 24 hours before we arrive.",
            icon: <Calendar className="w-12 h-12 text-accent" />,
            type: "Residential Booking"
        };
    } else if (isCommercial) {
        content = {
            title: "Proposal Requested",
            subtitle: "Your custom facility proposal is being generated as we speak.",
            details: "Check your email in 5-10 minutes for your professional proposal. A G&G facility consultant will reach out shortly to schedule your on-site walkthrough and finalize details.",
            icon: <MessageSquare className="w-12 h-12 text-accent" />,
            type: "Commercial Proposal"
        };
    } else {
        content = {
            title: "Request Received",
            subtitle: "Thank you for reaching out! Your quote request has been priority-routed to our intake team.",
            details: "A member of our team will contact you shortly (usually within 2 hours) to confirm details and provide your custom quote.",
            icon: <MessageSquare className="w-12 h-12 text-accent" />,
            type: "Quote Request"
        };
    }


    if (showPhotoFlow) {
        return (
            <div className="pt-24 pb-20 min-h-screen">
                <PhotoQuoteFlow
                    onClose={() => setShowPhotoFlow(false)}
                    initialData={{
                        name: form?.name,
                        email: form?.email,
                        phone: form?.phone,
                        serviceType: form?.frequency === 'oneTime' ? form?.serviceType : `${form?.frequency} Plan`,
                        estimateRange: estimate?.distMonth1 ? `$${estimate.distMonth1.finalTotal}` : '',
                    }}
                />
            </div>
        );
    }

    return (
        <section className="min-h-screen pt-32 pb-20 relative overflow-hidden flex items-center justify-center">
            <Sparkles />
            <div className="container relative z-10 px-6 max-w-2xl text-center">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/10 mb-8 border border-accent/20"
                >
                    <CheckCircle2 className="w-12 h-12 text-accent" />
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="text-secondary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
                        {content.type} Confirmed
                    </span>
                    <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 leading-tight">
                        {content.title}
                    </h1>
                    <p className="text-xl text-text-light mb-8 leading-relaxed">
                        {content.subtitle}
                    </p>
                    
                    <div className="bg-bg-alt/50 border border-white/5 p-8 rounded-2xl mb-10 text-left">
                        <div className="flex gap-4 items-start">
                            <div className="mt-1">{content.icon}</div>
                            <div>
                                <h4 className="text-white font-bold mb-2">What Happens Next?</h4>
                                <p className="text-text-light text-sm leading-relaxed">
                                    {content.details}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isCommercial && showPhotoPrompt && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-r from-[#5B2D8E]/20 to-[#C9A84C]/20 border border-[#C9A84C]/30 p-8 rounded-2xl mb-10 text-center"
                        >
                            <Camera className="w-10 h-10 text-[#C9A84C] mx-auto mb-4" />
                            <h4 className="text-white font-bold mb-2 text-xl">Want to lock in your exact price?</h4>
                            <p className="text-text-light text-sm leading-relaxed mb-6">
                                Upload a few quick photos of your home so our team can finalize your quote before we arrive. It takes less than 2 minutes!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button 
                                    onClick={() => setShowPhotoFlow(true)}
                                    className="btn-primary"
                                >
                                    Upload Photos Now
                                </button>
                                <button 
                                    onClick={() => setShowCallForm(!showCallForm)}
                                    className="btn-outline"
                                >
                                    Skip — We'll Confirm by Phone
                                </button>
                            </div>

                            <AnimatePresence>
                                {showCallForm && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6 text-left border-t border-white/10 pt-6 overflow-hidden"
                                    >
                                        {!callRequested ? (
                                            <>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                        <Phone className="w-5 h-5 text-primary-light" />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-white font-bold">Request a Confirmation Call</h5>
                                                        <p className="text-xs text-text-light">We'll call you shortly to confirm details.</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-white/70 mb-1">Name</label>
                                                        <input type="text" value={form?.name || ''} readOnly className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white opacity-70" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-white/70 mb-1">Best number to reach you</label>
                                                        <input type="tel" value={callPhone} onChange={(e) => setCallPhone(e.target.value)} className="w-full bg-bg-alt border border-primary/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" />
                                                    </div>
                                                    <button onClick={handleCallRequest} className="w-full bg-primary hover:bg-primary-light text-white rounded-lg py-3 font-semibold transition-colors mt-2">
                                                        Request Call Now
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-4">
                                                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                                <h5 className="text-white font-bold text-lg mb-1">Call Requested!</h5>
                                                <p className="text-sm text-text-light">Our team will call you at {callPhone} shortly.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}


                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/" className="btn-primary flex items-center justify-center gap-2">
                            Return Home <ArrowRight size={18} />
                        </Link>
                        <a href="tel:5162988323" className="btn-outline flex items-center justify-center gap-2">
                             Have Questions? Call Us
                        </a>
                    </div>
                </motion.div>
                
                <p className="mt-12 text-text-light/50 text-sm">
                    The G&G Promise: 100% Satisfaction or we re-clean for free.
                </p>
            </div>
        </section>
    );
};

export default SuccessPage;
