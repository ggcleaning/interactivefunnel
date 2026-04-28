import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ShieldCheck, MapPin, Sparkles, Star, ChevronRight, House } from 'lucide-react';
import FAQSection from '../components/modular/FAQSection';
import './TownLandingPage.css';

const ManhassetPage = ({ onOpenEstimate }) => {
  const customFaqs = [
    {
      question: "What house cleaning services do you offer in Manhasset, NY?",
      answer: "G&G Cleaning offers a full range of residential cleaning services in Manhasset, New York, including deep cleaning, recurring weekly and bi-weekly maid service, monthly maintenance cleaning, move-in and move-out cleaning, and post-renovation cleaning. Every service is fully customized based on your home's size, layout, and specific needs. We use non-toxic, family-safe, and pet-safe cleaning products on every job throughout Manhasset and the North Shore."
    },
    {
      question: "Do you clean historic homes and luxury estates in Manhasset?",
      answer: "Yes. Many homes in Manhasset feature custom stonework, original moldings, hardwood floors, marble surfaces, and architectural details that require experienced, careful handling. Our team is trained to clean historic and high-end residences using methods that protect original finishes and custom materials while delivering a thorough, detailed clean throughout every room."
    },
    {
      question: "Do you serve Plandome, Flower Hill, and the Strathmores?",
      answer: "Absolutely. We regularly clean homes throughout all Manhasset neighborhoods including Plandome, Flower Hill, Strathmore, Strathmore-Vanderbilt, and surrounding residential streets. We are a locally trusted cleaning service for the entire Manhasset, NY area and have served homeowners in every part of this community since 2008."
    },
    {
      question: "How is a deep cleaning different from regular recurring cleaning?",
      answer: "A deep cleaning is a full reset for your home — it targets built-up grime, soap scum, grease, dust accumulation, and areas that standard maintenance cleanings typically skip, such as behind appliances, inside the microwave, exhaust fans, window tracks, and baseboards. A regular recurring cleaning maintains your home's cleanliness week after week after the deep clean foundation has been established. Most Manhasset clients start with a deep clean and then move to bi-weekly maintenance service."
    },
    {
      question: "How often should I schedule house cleaning for my Manhasset home?",
      answer: "Most Manhasset homeowners find bi-weekly cleaning to be the best balance of consistent cleanliness and cost. Larger estates or homes with children and pets often benefit from weekly service, while some clients prefer a monthly deep clean. G&G Cleaning will recommend the right frequency based on your home's size, layout, and your household's lifestyle during your quote consultation."
    },
    {
      question: "Are your cleaners insured, bonded, and background-checked?",
      answer: "Yes. G&G Cleaning is fully insured, bonded, and every team member undergoes a thorough background check before joining our crew. We understand the trust involved in welcoming a cleaning team into your Manhasset home, and we take that responsibility seriously on every visit. You can feel completely confident leaving us access to your home."
    },
    {
      question: "Do I need to be home during the cleaning?",
      answer: "No — you do not need to be home during your cleaning appointment. Most G&G Cleaning clients across Manhasset and Nassau County provide access through a key or entry code and return to a completely clean home. Our team is fully vetted, insured, and bonded, so you can trust us with access to your home and your family's belongings without hesitation."
    },
    {
      question: "How do I get a quote for house cleaning in Manhasset?",
      answer: "You can get an instant quote through our website in under 60 seconds — no phone call required. Simply enter your home details, select your preferred service, and book your cleaning online. Pricing is transparent and upfront with no hidden fees. If you have a larger estate or specific requirements, you can also reach out directly and we'll provide a custom estimate."
    },
    {
      question: "What areas near Manhasset do you also serve?",
      answer: "In addition to Manhasset, G&G Cleaning serves surrounding North Shore communities including Great Neck, Port Washington, Roslyn, Roslyn Heights, Lake Success, New Hyde Park, Herricks, and Manhasset Hills. We are a trusted residential cleaning service throughout the greater Manhasset area and northern Nassau County."
    },
    {
      question: "Why do Manhasset homeowners choose G&G Cleaning over other services?",
      answer: "Manhasset homeowners choose G&G Cleaning because we are local, established, consistent, and genuinely invested in the quality of our work. We have operated in Nassau County since 2008 — we know the neighborhood, we understand the homes, and we show up on time with the same trained team on every visit. Our clients stay with us for years because we treat their homes with the same care and attention we would want for our own."
    }
  ];

  return (
    <div className="town-landing-page">
      <Helmet>
        <title>Luxury House Cleaning in Manhasset, NY | G&G Cleaning — Trusted Since 2008</title>
        <meta name="description" content="G&G Cleaning offers professional house cleaning in Manhasset, NY. Deep cleaning, recurring maid service, and move-in/move-out cleaning for luxury estates in Plandome, Flower Hill, and the North Shore. Get an instant quote in 60 seconds." />
        <link rel="canonical" href="https://ggcleaningli.com/locations/manhasset" />
        
        {/* Localized Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "G&G Cleaning Services",
            "image": "https://ggcleaningli.com/favicon.svg",
            "description": "Professional residential cleaning company serving Manhasset, New York since 2008. Specializing in deep cleaning, recurring maid service, and move-in/move-out cleaning for historic estates and luxury homes.",
            "url": "https://ggcleaningli.com/locations/manhasset",
            "telephone": "+18887922909",
            "areaServed": {
              "@type": "City",
              "name": "Manhasset",
              "containedInPlace": {
                "@type": "AdministrativeArea",
                "name": "Nassau County"
              }
            }
          })}
        </script>
      </Helmet>

      {/* SECTION 1 — HERO */}
      <section className="town-hero">
        <div className="town-hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Luxury House Cleaning in Manhasset, NY — Trusted Since 2008
          </motion.h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-text)', marginTop: '20px', marginBottom: '30px' }}>
            White-glove residential cleaning for luxury estates and homes throughout Manhasset and the North Shore.
          </p>

          <motion.div 
            className="town-primary-cta-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h3 style={{ marginBottom: '15px', color: '#fff' }}>Get Your Instant Cleaning Quote</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>No calls. No waiting. No back-and-forth.</p>
            <ul className="cta-benefits">
              <li><CheckCircle size={20} color="var(--color-secondary)" /> See pricing instantly</li>
              <li><CheckCircle size={20} color="var(--color-secondary)" /> Choose your service</li>
              <li><CheckCircle size={20} color="var(--color-secondary)" /> Book online in minutes</li>
            </ul>
            <button className="cta-btn-large" onClick={onOpenEstimate}>
              👉 Get Your Instant Quote — 60 Seconds
            </button>
            <div className="town-urgency">
              <Clock size={16} /> ⚠️ Limited availability — book in advance to secure your spot.
            </div>
          </motion.div>

          {/* SECTION 2 — AI ENTITY SUMMARY BLOCK */}
          <motion.div 
            className="town-ai-snippet"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <strong>G&G Cleaning</strong> is a family-owned professional residential cleaning company serving Manhasset, New York since 2008. Specializing in deep cleaning, recurring maid service, and move-in/move-out cleaning for luxury estates throughout Nassau County's North Shore, G&G Cleaning is one of Long Island's most trusted housekeeping services. We serve all Manhasset neighborhoods including Plandome, Flower Hill, and the Strathmores, as well as surrounding communities including Great Neck, Port Washington, Roslyn, and Lake Success.
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — PAIN + OUTCOME */}
      <section className="town-section town-trust-section">
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Finally Enjoy a Clean Home Without the Stress</h2>
        
        <div className="town-pain-grid">
          <ul className="pain-points-list">
            <li>
              <div style={{ color: 'var(--color-secondary)', flexShrink: 0 }}><CheckCircle size={24} /></div>
              <div><strong>Tired of spending your weekends cleaning instead of living?</strong></div>
            </li>
            <li>
              <div style={{ color: 'var(--color-secondary)', flexShrink: 0 }}><CheckCircle size={24} /></div>
              <div><strong>Need a reliable team you don't have to manage or follow up with?</strong></div>
            </li>
            <li>
              <div style={{ color: 'var(--color-secondary)', flexShrink: 0 }}><CheckCircle size={24} /></div>
              <div><strong>Want your home consistently spotless without the hassle of doing it yourself?</strong></div>
            </li>
            <li>
              <div style={{ color: 'var(--color-secondary)', flexShrink: 0 }}><CheckCircle size={24} /></div>
              <div><strong>Looking for a cleaning service that actually knows Manhasset homes?</strong></div>
            </li>
          </ul>

          <div className="pain-outcome">
            <Sparkles size={40} color="var(--color-secondary)" style={{ marginBottom: '20px' }} />
            <h3>We handle everything.</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>So you can focus on your time, your family, and your life.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — TRUST + LOCAL AUTHORITY */}
      <section className="town-section town-trust-section">
        <div className="town-trust-content">
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Trusted House Cleaners in Manhasset Since 2008</h2>
          
          <div className="town-trust-text">
            <p>Manhasset is one of Long Island's most prestigious communities — home to the Americana Manhasset, the <strong>Miracle Mile</strong>, and elegant estates throughout <strong>Plandome, Flower Hill, and the Strathmores</strong>. Maintaining these homes requires more than a standard clean.</p>
            
            <p>G&G Cleaning has served Manhasset homeowners for over 15 years, delivering white-glove cleaning services tailored to larger, high-end, and architecturally unique properties. We understand the character of Manhasset homes — the custom kitchens, marble surfaces, formal living spaces — and we clean them carefully and completely.</p>
            
            <p>Whether your home sits near the waterfront, along Northern Blvd, or tucked into a quiet Plandome street, our team arrives fully prepared with:</p>
            
            <ul className="cta-benefits" style={{ margin: '30px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <li><ShieldCheck size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> Non-toxic, family-safe and pet-safe products</li>
              <li><CheckCircle size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> A detailed 40+ point cleaning checklist applied to every room</li>
              <li><CheckCircle size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> The same trained, background-checked team on every visit</li>
              <li><Clock size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> Flexible scheduling built around your lifestyle</li>
            </ul>
          </div>

          {/* SECTION 5 — TRUST BADGE STACK */}
          <div className="trust-stack">
            <div className="trust-badge"><Star size={20} fill="var(--color-secondary)" /> 5.0 Star Rated on Google</div>
            <div className="trust-badge"><ShieldCheck size={20} /> Family-Owned Since 2008</div>
            <div className="trust-badge"><ShieldCheck size={20} /> Fully Insured and Bonded</div>
            <div className="trust-badge"><ShieldCheck size={20} /> Background-Checked Pro Team</div>
            <div className="trust-badge"><Sparkles size={20} /> Non-Toxic and Pet-Safe Products</div>
            <div className="trust-badge"><MapPin size={20} /> Same Consistent Team</div>
            <div className="trust-badge"><House size={20} /> Serving Nassau Since 2008</div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — SERVICES */}
      <section className="town-section">
        <h2 style={{ textAlign: 'center' }}>Our Most Popular Cleaning Services in Manhasset</h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', maxWidth: '800px', margin: '10px auto 40px' }}>
          We offer fully customized cleaning plans based on your home size, lifestyle, and preferences. Every service includes our 40+ point checklist, non-toxic products, and the same dedicated team.
        </p>
        
        <div className="town-services-grid">
          <div className="town-service-card">
            <h3>Deep Cleaning</h3>
            <p>A full reset for your home — targeting built-up grime, overlooked areas, baseboards, vents, appliances, and every surface in between. Perfect for first-time clients or seasonal refreshes.</p>
          </div>
          <div className="town-service-card">
            <h3>Recurring Cleaning</h3>
            <p>Weekly, Bi-Weekly, or Monthly. Our most popular service for Manhasset homeowners. We maintain your home consistently so it's always guest-ready without any effort on your part.</p>
          </div>
          <div className="town-service-card">
            <h3>Move-In / Move-Out Cleaning</h3>
            <p>A comprehensive deep clean for homes transitioning between occupants — covering inside cabinets, appliance interiors, baseboards, bathrooms, and every room from top to bottom.</p>
          </div>
          <div className="town-service-card">
            <h3>Post-Renovation Cleaning</h3>
            <p>Construction dust, debris, and residue removed thoroughly so your newly renovated space is clean, safe, and ready to enjoy.</p>
          </div>
        </div>

        <div className="service-tip">
          <Sparkles size={30} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
          <div>
            <strong>💡 Most Manhasset homeowners</strong> start with a deep clean, then move to bi-weekly recurring service for effortless maintenance.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <button className="cta-btn-large" onClick={onOpenEstimate} style={{ maxWidth: '400px' }}>
            👉 Check Pricing and Availability
          </button>
        </div>
      </section>

      {/* SECTION 7 — FAQ */}
      <FAQSection 
        items={customFaqs} 
        title="Manhasset House Cleaning — Frequently Asked Questions" 
        subtitle=""
      />

      {/* SECTION 8 — SERVICE AREA */}
      <section className="town-section town-trust-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ marginBottom: '20px' }}>Neighborhoods and Areas We Serve Near Manhasset</h2>
        <p style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--color-text)' }}>
          Manhasset | Plandome | Flower Hill | Strathmore | Great Neck | Port Washington | Roslyn | Roslyn Heights | Lake Success | New Hyde Park | Herricks | Manhasset Hills
        </p>
      </section>

      {/* SECTION 9 — FINAL CTA */}
      <section className="town-section town-trust-section dark">
        <h2 style={{ fontSize: '2.8rem', marginBottom: '24px' }}>Book Your First Cleaning in Manhasset Today</h2>
        <p style={{ fontSize: '1.25rem', marginBottom: '40px', maxWidth: '850px', margin: '0 auto 48px' }}>
          Stop spending your weekends cleaning and start enjoying your home the way it was meant to be enjoyed. G&G Cleaning has been Manhasset's trusted cleaning service since 2008 — reliable, consistent, and built around your lifestyle.
        </p>
        
        <ul className="cta-benefits" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '32px', margin: '0 auto 48px', maxWidth: '900px' }}>
          <li><CheckCircle size={22} color="var(--color-accent)" /> Instant transparent pricing</li>
          <li><CheckCircle size={22} color="var(--color-accent)" /> Easy online booking — no phone call required</li>
          <li><CheckCircle size={22} color="var(--color-accent)" /> The same trusted team every visit</li>
          <li><CheckCircle size={22} color="var(--color-accent)" /> Satisfaction guaranteed</li>
        </ul>

        <button className="cta-btn-large" onClick={onOpenEstimate} style={{ maxWidth: '420px' }}>
          👉 Get Your Instant Quote Now
        </button>
      </section>

    </div>
  );
};

export default ManhassetPage;
