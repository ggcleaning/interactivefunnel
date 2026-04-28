import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StickyCTA from './components/StickyCTA';
import ScrollToTop from './components/ScrollToTop';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import EstimateWidget from './components/EstimateWidget';
import ChatWidget from './components/ChatWidget';
import Sparkles from './components/Sparkles';

import SuccessPage from './pages/SuccessPage';

// Pages
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import ServicesPage from './pages/ServicesPage';
import RecurringPlansPage from './pages/RecurringPlansPage';
import CommercialPage from './pages/CommercialPage';
import QuotePage from './pages/QuotePage';
import GardenCityPage from './pages/GardenCityPage';
import ManhassetPage from './pages/ManhassetPage';
import DixHillsPage from './pages/DixHillsPage';
import DeepCleanChecklistPage from './pages/DeepCleanChecklistPage';
import ClientStoriesPage from './pages/ClientStoriesPage';
import InternalQuotePage from './pages/InternalQuotePage';
import CommercialQuotePage from './pages/CommercialQuotePage';

const QuoteForm = lazy(() => import('./components/QuoteForm'));

const LoadingFallback = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', background: '#0f1117', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
    Loading...
  </div>
);

function AppContent() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isEstimateOpen, setIsEstimateOpen] = useState(false);
  const location = useLocation();
  const isInternalRoute = location.pathname === '/internal-quote';

  // Source Tracking (Capture FB Ads Leads)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const source = params.get('source') || params.get('utm_source');
    const audience = params.get('audience');
    const campaign = params.get('campaign') || params.get('utm_campaign');
    const adSet = params.get('ad_set');
    const content = params.get('utm_content');
    
    // Store attribution data
    if (source) sessionStorage.setItem('lead_source_raw', source);
    if (source && source.toLowerCase().includes('facebook')) {
      sessionStorage.setItem('lead_source', 'facebook');
    }
    
    if (audience) sessionStorage.setItem('lead_audience', audience);
    if (campaign) sessionStorage.setItem('lead_campaign', campaign);
    if (adSet) sessionStorage.setItem('lead_ad_set', adSet);
    if (content) sessionStorage.setItem('lead_content', content);
  }, [location]);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sparkles />
      {!isInternalRoute && <Navbar onOpenEstimate={() => setIsEstimateOpen(true)} />}
      <ScrollToTop />
      {!isInternalRoute && <ChatWidget />}
      <main>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/"           element={<HomePage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/services"   element={<ServicesPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/pricing"    element={<PricingPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/plans"      element={<RecurringPlansPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/commercial" element={<CommercialPage />} />
            <Route path="/commercial-quote" element={<CommercialQuotePage />} />
            <Route path="/commercial-intake" element={<CommercialQuotePage />} />
            <Route path="/quote"      element={<QuotePage />} />
            <Route path="/locations/garden-city" element={<GardenCityPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/locations/manhasset" element={<ManhassetPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/locations/dix-hills" element={<DixHillsPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/services/deep-cleaning-checklist" element={<DeepCleanChecklistPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            <Route path="/reviews" element={<ClientStoriesPage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
            
            {/* Tracking Success Pages */}
            <Route path="/booking-confirmed" element={<SuccessPage />} />
            <Route path="/quote-confirmed" element={<SuccessPage />} />
            <Route path="/internal-quote" element={<InternalQuotePage />} />

            {/* Fallback: redirect unknown routes to home */}
            <Route path="*"           element={<HomePage onOpenEstimate={() => setIsEstimateOpen(true)} />} />
          </Routes>
        </Suspense>
      </main>
      {!isInternalRoute && <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} onOpenTerms={() => setIsTermsOpen(true)} onOpenEstimate={() => setIsEstimateOpen(true)} />}
      {!isInternalRoute && <StickyCTA onOpenEstimate={() => setIsEstimateOpen(true)} />}
      
      <AnimatePresence>
        {isEstimateOpen && (
          <EstimateWidget onClose={() => setIsEstimateOpen(false)} />
        )}
      </AnimatePresence>
      
      <PrivacyPolicy isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsOfService isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
