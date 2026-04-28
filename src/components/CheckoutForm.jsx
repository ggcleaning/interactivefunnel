import React, { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

/**
 * CheckoutForm — Stripe PaymentElement-based deposit form.
 * Rendered inside EstimateWidget Step 5 after the estimate result.
 *
 * Props:
 *   clientSecret  — from the create-payment-intent Netlify function
 *   amount        — deposit amount in dollars (displayed to user)
 *   onSuccess     — callback when payment confirms successfully
 *   onBack        — callback to go back to estimate result
 */
const CheckoutForm = ({ amount, breakdown, onSuccess, onBack }) => {
    const stripe = useStripe();
    const elements = useElements();

    const [errorMessage, setErrorMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setErrorMessage('');

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/?booking=confirmed',
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message || 'Payment failed. Please try again.');
            setProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess(paymentIntent);
        } else {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="ew-checkout-form">
            {/* Deposit summary with optional breakdown */}
            <div className="ew-deposit-summary">
                <div className="ew-deposit-label">Secure Booking Deposit</div>
                <div className="ew-deposit-amount">${amount}</div>
                
                {breakdown && breakdown.travelFee > 0 && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Remote Route Premium</span>
                            <span>+${breakdown.travelFee}</span>
                        </div>
                        {breakdown.distanceCredit > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)', fontWeight: 600 }}>
                                <span>Long-Distance Discount</span>
                                <span>-${breakdown.distanceCredit}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="ew-deposit-note" style={{ marginTop: '12px' }}>
                    Remaining balance is collected only after your cleaning is complete.
                </div>
            </div>

            {/* Stripe Payment Element (handles cards, Apple Pay, Google Pay) */}
            <div className="ew-stripe-element-wrap">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        wallets: { applePay: 'auto', googlePay: 'auto' },
                    }}
                />
            </div>

            {/* Error message */}
            {errorMessage && (
                <div className="ew-payment-error">
                    ⚠️ {errorMessage}
                </div>
            )}

            {/* Actions */}
            <div className="ew-nav" style={{ marginTop: 20 }}>
                <button type="button" className="ew-btn-back" onClick={onBack} disabled={processing}>
                    ← Back
                </button>
                <button
                    type="submit"
                    className="ew-btn-next"
                    disabled={!stripe || processing}
                >
                    {processing ? 'Processing…' : `Pay $${amount} Deposit →`}
                </button>
            </div>

            <p className="ew-privacy-note" style={{ marginTop: 14 }}>
                🔒 Payments secured by Stripe. G&G Cleaning never stores card data.
            </p>
        </form>
    );
};

export default CheckoutForm;
