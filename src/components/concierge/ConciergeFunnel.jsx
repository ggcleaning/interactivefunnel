import React, { useMemo, useEffect } from 'react';
import { useConciergeFunnel } from '../../hooks/useConciergeFunnel';
import { getConciergeEstimate } from '../../utils/quoteEngineAdapter';
import { ConciergeLayout } from './ConciergeLayout';
import { ConciergeCard } from './ConciergeCard';
import { sendToCRM } from '../../utils/crm';
import { clarityEvent } from '../../utils/analytics';

// Steps
import { ServiceCategoryStep } from './steps/ServiceCategoryStep';
import { HomeSizeStep } from './steps/HomeSizeStep';
import { ApartmentLogisticsStep } from './steps/ApartmentLogisticsStep';
import { OperationalIntelligenceStep } from './steps/OperationalIntelligenceStep';
import { FrequencyStep } from './steps/FrequencyStep';
import { LeadCaptureStep } from './steps/LeadCaptureStep';
import { BookingSummaryStep } from './steps/BookingSummaryStep';

export function ConciergeFunnel() {
  const { 
    currentStep, 
    data, 
    updateData, 
    handleNext, 
    nextStep,
    prevStep, 
    resetFunnel 
  } = useConciergeFunnel();

  const estimate = useMemo(() => getConciergeEstimate(data), [data]);
  const progress = useMemo(() => {
    const steps = ['lead-capture', 'home-size', 'operational-intelligence', 'final-quote'];
    const idx = steps.indexOf(currentStep);
    return ((idx + 1) / steps.length) * 100;
  }, [currentStep]);

  // Handle final submission and tracking
  useEffect(() => {
    // Track funnel start
    if (currentStep === 'lead-capture') {
      clarityEvent('quote_started');
    }

    // Track quote ready
    if (currentStep === 'final-quote') {
      clarityEvent('quote_saved', { 
        category: data.serviceCategory,
        frequency: data.frequency,
        estimate: `${estimate.min}-${estimate.max}`
      });
      
      sendToCRM({
        ...data,
        ...estimate,
        event_type: 'quote_completed',
        lead_stage: 'Quote Completed - Estimate Viewed',
        source: 'Website Quote Funnel',
        skipMetaLead: true, // Lead is fired at step 1
        tags: [
          'quote_completed',
          'website_quote_funnel',
          'estimate_viewed'
        ]
      }, 'quote_requested');
    }

    if (currentStep === 'booking-confirmed') {
      clarityEvent('booking_completed', { 
        category: data.serviceCategory,
        total: estimate.min // use min as a proxy for revenue tracking
      });
      
      sendToCRM({
        ...data,
        ...estimate,
        event_type: 'booking_confirmed',
        lead_stage: 'Booking Confirmed',
        source: 'Website Quote Funnel',
        skipMetaLead: true,
        tags: [
          'booking_confirmed',
          'website_quote_funnel'
        ]
      }, 'booking_confirmed');
    }
  }, [currentStep, data, estimate]);

  const renderStep = () => {
    switch (currentStep) {
      case 'lead-capture':
        return (
          <ConciergeCard 
            title="Get Your Free Cleaning Estimate" 
            subtitle="Enter your contact info to calculate your personalized pricing."
          >
            <LeadCaptureStep 
              data={data} 
              onChange={updateData} 
              onNext={handleNext} 
            />
          </ConciergeCard>
        );

      case 'home-size':
        return (
          <ConciergeCard 
            title="Tell us about your space" 
            subtitle="The size of your home helps us estimate the time needed."
          >
            <HomeSizeStep 
              data={data} 
              onChange={updateData} 
              onNext={handleNext} 
              onPrev={prevStep} 
            />
          </ConciergeCard>
        );

      case 'operational-intelligence':
        return (
          <ConciergeCard 
            title="Customize Your Service" 
            subtitle="We tailor our approach to your lifestyle and home details."
          >
            <OperationalIntelligenceStep 
              data={data} 
              onChange={updateData} 
              onNext={handleNext} 
              onPrev={prevStep} 
            />
          </ConciergeCard>
        );

      case 'final-quote':
        return (
          <ConciergeCard 
            title="Your Custom Cleaning Estimate" 
            subtitle="Review your details and secure your booking with G&G."
          >
            <BookingSummaryStep 
              data={data}
              estimate={estimate}
              onPrev={prevStep}
              onNext={(results) => {
                updateData(results);
                nextStep('booking-confirmed');
              }}
            />
          </ConciergeCard>
        );

      case 'booking-confirmed':
        return (
          <ConciergeCard 
            title="Booking Confirmed!" 
            subtitle="Your luxury cleaning experience is now secured."
          >
            <div className="confirmation-screen animate-concierge-scale" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="success-icon" style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✨</div>
              <h2 style={{ marginBottom: '1rem' }}>We'll see you soon, {data.firstName}!</h2>
              <p style={{ marginBottom: '2rem', color: 'rgba(0,0,0,0.7)' }}>
                A cleaning concierge has been assigned to your account. You will receive a confirmation email shortly with your arrival window.
              </p>
              
              <div className="next-steps-list glass-card" style={{ textAlign: 'left', padding: '1.5rem', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Preparation Tips:</h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <li style={{ display: 'flex', gap: '0.75rem' }}><span>🗝️</span> Ensure we have access (key instructions or on-site).</li>
                  <li style={{ display: 'flex', gap: '0.75rem' }}><span>🐾</span> Secure any sensitive pets if needed.</li>
                  <li style={{ display: 'flex', gap: '0.75rem' }}><span>🏡</span> Relax and let us handle the rest.</li>
                </ul>
              </div>

              <button className="btn-primary" style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }} onClick={() => window.location.href = '/'}>
                Return to Home
              </button>
            </div>
            <style>{`
              .confirmation-screen { text-align: center; padding: 1rem 0; }
              .success-icon { font-size: 4rem; margin-bottom: 1rem; }
              .confirmation-screen h2 { margin-bottom: 1rem; }
              .next-steps-list { text-align: left; padding: 1.5rem; margin-top: 2rem; }
              .next-steps-list h3 { margin-bottom: 1rem; font-size: 1.1rem; }
              .next-steps-list ul { display: flex; flex-direction: column; gap: 0.75rem; }
            `}</style>
          </ConciergeCard>
        );

      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <ConciergeLayout 
      progress={progress} 
      showEstimate={
        currentStep !== 'lead-capture' && 
        currentStep !== 'final-quote' && 
        currentStep !== 'booking-confirmed'
      }
      estimateData={estimate}
    >
      {renderStep()}
    </ConciergeLayout>
  );
}
