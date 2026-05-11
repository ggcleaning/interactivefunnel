import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sendToCRM } from '../utils/crm';
import { trackConversion } from '../utils/metaTracking';
import { clarityEvent } from '../utils/analytics';
import { BUSINESS } from '../data/config';
import './EstimateWidget.css';

// ─── Image Helpers ────────────────────────────────────────────────────────────
const compressImage = (file, maxWidth = 1200, quality = 0.72) =>
    new Promise((resolve) => {
        const objUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objUrl);
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
                'image/jpeg',
                quality
            );
        };
        img.src = objUrl;
    });

const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gg_cleaning_quotes';
    if (!cloudName) return null; // Graceful degradation if not configured

    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    fd.append('folder', 'gg_cleaning_quotes');

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: fd }
    );
    const data = await res.json();
    return data.secure_url || null;
};

// ─── Photo Step Config ────────────────────────────────────────────────────────
const PHOTO_STEPS = [
    {
        key: 'kitchen', icon: '🍳', label: 'Kitchen', required: true, max: 2,
        instruction: 'Take a clear photo of your kitchen surfaces, sink area, and stove.',
    },
    {
        key: 'bathroom', icon: '🛁', label: 'Bathroom(s)', required: true, max: 3,
        instruction: 'Snap photos showing the shower/tub, vanity, and toilet for each bathroom.',
    },
    {
        key: 'living', icon: '🛋️', label: 'Living Area', required: true, max: 2,
        instruction: 'Take a wide shot of your main living room, hallways, or common areas.',
    },
    {
        key: 'optional', icon: '⚠️', label: 'Problem Areas', required: false, max: 3,
        instruction: 'Any stains, heavy buildup, or areas needing special attention? (Optional — skip if not needed)',
    },
];

// ─── Component ────────────────────────────────────────────────────────────────
const PhotoQuoteFlow = ({ onClose, initialData = {}, inline = false }) => {
    // step 0 = intro | 1-4 = photo uploads | 5 = contact form | 6 = confirmed
    const [step, setStep] = useState(0);
    const [photos, setPhotos] = useState({ kitchen: [], bathroom: [], living: [], optional: [] });
    const [form, setForm] = useState({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: '',
        serviceType: initialData.serviceType || '',
        estimateRange: initialData.estimateRange || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const photoStep = step >= 1 && step <= 4 ? PHOTO_STEPS[step - 1] : null;

    // Analytics: Track Step 1 Start
    useEffect(() => {
        if (step === 1) {
            clarityEvent('quote_started', { flow: 'Photo Quote' });
        }
    }, [step]);

    const handleFileChange = (key, e) => {
        const max = PHOTO_STEPS.find((s) => s.key === key)?.max || 3;
        const newFiles = Array.from(e.target.files).slice(0, max - photos[key].length);
        const newPreviews = newFiles.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
        setPhotos((prev) => ({ ...prev, [key]: [...prev[key], ...newPreviews].slice(0, max) }));
        
        // Track upload
        if (newFiles.length > 0) {
            clarityEvent('upload_added', { category: key, count: newFiles.length });
        }

        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const removePhoto = (key, idx) => {
        setPhotos((prev) => {
            const arr = [...prev[key]];
            URL.revokeObjectURL(arr[idx].preview);
            arr.splice(idx, 1);
            return { ...prev, [key]: arr };
        });
    };

    const canProceed = () => {
        if (photoStep?.required) return photos[photoStep.key].length > 0;
        return true;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            // 1. Compress & upload all photos
            const imageUrls = { kitchen: [], bathroom: [], living: [], optional: [] };
            for (const { key } of PHOTO_STEPS) {
                for (const { file } of photos[key]) {
                    const compressed = await compressImage(file);
                    const url = await uploadToCloudinary(compressed);
                    if (url) imageUrls[key].push(url);
                }
            }
            // 2. Notify business owner
            const res = await fetch('/.netlify/functions/submit-photo-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, images: imageUrls }),
            });
            if (!res.ok) throw new Error('Server error');

            // Send lead to CRM
            sendToCRM({
                ...form,
                photo_quote: true,
                status: 'Pending Review',
                location_id: 'D5WYnc5CK01FskhJtW3W',
                tags: [form.serviceType?.toLowerCase().includes('commercial') ? 'commercialclient' : 'residentialclient', 'Photo-Quote']
            }, 'photo_quote');

            // 3. Track Lead in Meta Pixel
            trackConversion('Lead', {
                content_category: 'Photo Quote Request',
                content_name: form.serviceType,
                value: 180 // Baseline quote value
            });

            // 4. Track Clarity Event
            clarityEvent('quote_saved', {
                flow: 'Photo Quote',
                service: form.serviceType
            });

            setStep(6);
        } catch (err) {
            setError(`Something went wrong. Please try again or call ${BUSINESS.phone}.`);
        } finally {
            setSubmitting(false);
        }
    };

    const progress = step === 0 ? 0 : (Math.min(step, 5) / 5) * 100;
    const eyebrow = ['Verify Your Reservation', 'Photo 1 of 4', 'Photo 2 of 4', 'Photo 3 of 4', 'Photo 4 of 4', 'Your Details', '✅ Submitted!'][step] || '';
    const title = [
        'Upload Photos for Final Verification',
        `${PHOTO_STEPS[0].icon} ${PHOTO_STEPS[0].label}`,
        `${PHOTO_STEPS[1].icon} ${PHOTO_STEPS[1].label}`,
        `${PHOTO_STEPS[2].icon} ${PHOTO_STEPS[2].label}`,
        `${PHOTO_STEPS[3].icon} ${PHOTO_STEPS[3].label}`,
        'A Few Last Details',
        'Photos Received!',
    ][step] || '';

    const Wrapper = inline ? 'div' : 'div';
    const wrapperProps = inline ? { className: 'ew-inline-wrapper' } : { className: 'ew-overlay', role: 'dialog', 'aria-modal': 'true' };

    return (
        <Wrapper {...wrapperProps}>
            <motion.div
                className={`ew-modal${inline ? ' inline-mode' : ''}`}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                {/* Header */}
                <div className="ew-header" style={{ paddingBottom: 24 }}>
                    <div className="ew-header-text">
                        <div className="ew-eyebrow" style={{ marginBottom: 4, opacity: 0.8 }}>{eyebrow}</div>
                        <div className="ew-title" style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>{title}</div>
                    </div>
                    {!submitting && !inline && <button className="ew-close-btn" onClick={onClose} style={{ top: 24 }}>✕</button>}
                </div>

                {/* Progress */}
                {step > 0 && step < 6 && (
                    <div className="ew-progress-wrap">
                        <div className="ew-progress-track">
                            <div className="ew-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="ew-step-label">{step}/5</span>
                    </div>
                )}

                <div className="ew-body">

                    {/* ── STEP 0: Intro ── */}
                    {step === 0 && (
                        <>
                            <p className="ew-step-subtitle" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                                Please submit a few pictures of your space so we can verify your final price matches your online reservation. Once reviewed, we'll send your Service Agreement.
                            </p>
                            <div className="pq-needs-grid">
                                {PHOTO_STEPS.map((s) => (
                                    <div key={s.key} className={`pq-need-item${!s.required ? ' optional' : ''}`}>
                                        <span className="pq-need-icon" style={{ color: s.required ? 'var(--color-primary)' : 'var(--color-text-light)' }}>{s.icon}</span>
                                        <span className="pq-need-label">{s.label}</span>
                                        {!s.required && <span className="pq-optional-tag">Optional</span>}
                                    </div>
                                ))}
                            </div>
                            <div className="ew-offer-box" style={{ marginTop: 24, padding: '14px 18px' }}>
                                <span style={{ fontSize: 20, color: 'var(--color-accent)' }}>✦</span>
                                <div className="ew-offer-text">Most customers get their final verification and Service Agreement in under 90 minutes.</div>
                            </div>
                            <button
                                className="ew-btn-next"
                                style={{ width: '100%', marginTop: 20, padding: 15 }}
                                onClick={() => setStep(1)}
                            >
                                Start Photo Upload →
                            </button>
                        </>
                    )}

                    {/* ── STEPS 1–4: Photo Upload ── */}
                    {step >= 1 && step <= 4 && photoStep && (
                        <>
                            <p className="ew-step-subtitle">{photoStep.instruction}</p>

                            {/* Preview Grid */}
                            <div className="pq-preview-grid">
                                {photos[photoStep.key].map((p, idx) => (
                                    <div key={idx} className="pq-preview-item">
                                        <img src={p.preview} alt={`Preview ${idx + 1}`} />
                                        <button
                                            className="pq-remove-btn"
                                            onClick={() => removePhoto(photoStep.key, idx)}
                                            aria-label="Remove photo"
                                        >✕</button>
                                    </div>
                                ))}

                                {/* Add Photo Button */}
                                {photos[photoStep.key].length < photoStep.max && (
                                    <label className="pq-add-btn">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileChange(photoStep.key, e)}
                                        />
                                        <span className="pq-add-icon">📷</span>
                                        <span className="pq-add-label">
                                            {photos[photoStep.key].length === 0 ? 'Add Photo' : 'Add More'}
                                        </span>
                                    </label>
                                )}
                            </div>

                            <p className="ew-privacy-note">
                                Up to {photoStep.max} photo{photoStep.max > 1 ? 's' : ''}
                                {!photoStep.required && ' — skip if not applicable'}
                            </p>

                            <div className="ew-nav" style={{ marginTop: 20 }}>
                                <button className="ew-btn-back" onClick={() => setStep((s) => s - 1)}>← Back</button>
                                <button
                                    className="ew-btn-next"
                                    disabled={!canProceed()}
                                    onClick={() => setStep((s) => s + 1)}
                                >
                                    {step === 4 && !photoStep.required && photos.optional.length === 0
                                        ? 'Skip →'
                                        : 'Next →'}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── STEP 5: Contact Form ── */}
                    {step === 5 && (
                        <>
                            <p className="ew-step-subtitle">Where should we send your exact quote?</p>
                            {[
                                { key: 'name', label: 'Full Name *', type: 'text', ph: 'Jane Smith' },
                                { key: 'email', label: 'Email Address *', type: 'email', ph: 'jane@example.com' },
                                { key: 'phone', label: 'Phone Number *', type: 'tel', ph: '(516) 298-8323' },
                                { key: 'address', label: 'Property Address', type: 'text', ph: '123 Main St, Garden City, NY' },
                            ].map(({ key, label, type, ph }) => (
                                <div className="ew-form-group" key={key}>
                                    <label className="ew-label">{label}</label>
                                    <input
                                        className="ew-input"
                                        type={type}
                                        placeholder={ph}
                                        value={form[key]}
                                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            {error && <p className="ew-payment-error">{error}</p>}
                            <div className="ew-nav" style={{ marginTop: 20 }}>
                                <button className="ew-btn-back" onClick={() => setStep(4)}>← Back</button>
                                <button
                                    className="ew-btn-next"
                                    disabled={!form.name.trim() || !form.email.trim() || !form.phone.trim() || submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? 'Sending…' : 'Send My Photos →'}
                                </button>
                            </div>
                            <p className="ew-privacy-note" style={{ marginTop: 14 }}>
                                🔒 Your info is private. We'll only use it to send your quote.
                            </p>
                        </>
                    )}

                    {/* ── STEP 6: Confirmation ── */}
                    {step === 6 && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ fontSize: 52, marginBottom: 16 }}>📸</div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10 }}>
                                Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''}!
                            </p>
                            <p style={{ fontSize: 14, color: 'var(--color-text-light)', lineHeight: 1.7 }}>
                                We're reviewing your space right now. You'll receive your <strong>exact, locked-in price</strong> via text and email within <strong>1–2 hours</strong>.
                            </p>
                            <div className="ew-divider" />
                            <p style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
                                Questions? Call or text us at <strong>{BUSINESS.phone}</strong>
                            </p>
                            <button className="ew-cta-primary" style={{ marginTop: 20 }} onClick={onClose}>
                                Close
                            </button>
                        </div>
                    )}

                </div>
            </motion.div>
        </Wrapper>
    );
};

export default PhotoQuoteFlow;
