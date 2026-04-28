import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ShieldCheck, Sparkles, Star, ChevronRight, House, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import FAQSection from '../components/modular/FAQSection';
import './TownLandingPage.css';

const DeepCleanChecklistPage = ({ onOpenEstimate }) => {
  const customFaqs = [
    {
      question: "What is included in a professional deep house cleaning?",
      answer: "A professional deep house cleaning covers every major area of your home at a level beyond standard maintenance cleaning. At G&G Cleaning, our deep clean includes full kitchen degreasing and appliance cleaning, bathroom scrubbing and grout cleaning, bedroom and living area dusting, baseboards, vents, ceiling fans, door frames, light switches, and a complete whole-home detail pass. Our checklist covers 40+ specific areas across every room to ensure nothing is skipped or rushed."
    },
    {
      question: "How is a deep cleaning different from a regular cleaning?",
      answer: "A regular maintenance cleaning keeps your home looking presentable week after week by cleaning visible surfaces and high-traffic areas. A deep cleaning goes further — it targets built-up grease, soap scum, dust accumulation, and overlooked areas like behind appliances, inside the microwave, exhaust fans, window tracks, and baseboards. A deep clean is a full reset. Most Long Island homeowners do one deep clean first and then maintain with bi-weekly service afterward."
    },
    {
      question: "How long does a deep cleaning take for a Long Island home?",
      answer: "For most 3 to 4 bedroom homes in Nassau or Suffolk County, a professional deep clean takes between 4 and 8 hours depending on the size of the home and current condition. Larger estates in communities like Dix Hills, Manhasset, or Garden City may require additional time. G&G Cleaning provides a clear time and pricing estimate before every job so there are no surprises."
    },
    {
      question: "Do I need to be home during the deep cleaning?",
      answer: "No — you do not need to be home during your deep cleaning appointment. Most G&G Cleaning clients across Nassau and Suffolk County provide access through a key or entry code and return to a fully cleaned home. Our entire team is insured, bonded, and background-checked, so you can trust us completely with access to your home and your family's belongings."
    },
    {
      question: "How often should I get a deep cleaning?",
      answer: "Most homeowners benefit from one deep cleaning as a full reset, followed by recurring bi-weekly or monthly maintenance service to keep the home consistently clean. If your home has not been professionally cleaned in several months, or if you've recently moved in, a deep clean is the right starting point. G&G Cleaning will recommend the right frequency based on your home's size and your household's needs."
    },
    {
      question: "How much does a deep cleaning cost in Nassau or Suffolk County?",
      answer: "Deep cleaning pricing on Long Island varies based on the size of your home, number of bedrooms and bathrooms, and current condition. G&G Cleaning provides transparent upfront pricing — you can get an estimate tailored to your specific home quickly by contacting us directly. There are no hidden fees and no surprises after the job is done."
    },
    {
      question: "Do you use non-toxic or pet-safe cleaning products?",
      answer: "Yes. G&G Cleaning uses non-toxic, pet-safe cleaning products on every job — including deep cleans. This is especially important for families with children or pets, and it is one of the reasons Long Island homeowners have trusted us since 2008. If you have specific product sensitivities or allergies, let us know when booking and we will accommodate accordingly."
    },
    {
      question: "Where do you offer deep cleaning services on Long Island?",
      answer: "G&G Cleaning provides professional deep cleaning throughout Nassau County and Suffolk County including Garden City, Manhasset, Dix Hills, Great Neck, Port Washington, Roslyn, Huntington, Commack, Melville, Syosset, Woodbury, Mineola, Westbury, and surrounding communities. If you're located on Long Island and unsure whether we serve your area, contact us and we'll confirm availability."
    }
  ];

  return (
    <div className="town-landing-page">
      <Helmet>
        <title>What's Included in a Professional Deep House Cleaning? | G&G Cleaning Long Island</title>
        <meta name="description" content="See exactly what's included in a professional deep house cleaning from G&G Cleaning. 40+ point checklist covering kitchens, bathrooms, bedrooms, and more. Serving Nassau and Suffolk County since 2008." />
        <link rel="canonical" href="https://ggcleaningli.com/deep-cleaning-checklist" />
      </Helmet>

      {/* SECTION 1 — HERO */}
      <section className="town-hero" style={{ paddingBottom: '30px' }}>
        <div className="town-hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            What's Included in a Professional Deep House Cleaning? Our 40+ Point Checklist
          </motion.h1>

          {/* AI ENTITY SUMMARY BLOCK */}
          <motion.div 
            className="town-ai-snippet"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ marginTop: '30px', textAlign: 'left' }}
          >
            <strong>G&G Cleaning</strong> is a family-owned professional cleaning company serving Long Island since 2008, offering deep cleaning services across Nassau and Suffolk County including Garden City, Manhasset, Dix Hills, Great Neck, Huntington, Commack, and surrounding communities. A professional deep house cleaning goes far beyond regular maintenance — it targets built-up grime, high-touch surfaces, and often-missed areas like baseboards, vents, and behind appliances. The checklist below outlines exactly what G&G Cleaning covers in every room of your Long Island home.
          </motion.div>
          
          <motion.div 
            className="town-primary-cta-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <button className="cta-btn-large" onClick={onOpenEstimate}>
              👉 Get Your Instant Deep Cleaning Quote
            </button>
            <div className="town-urgency">
              <Clock size={16} /> ⚠️ Limited availability — book in advance to secure your spot.
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — WHY A DEEP CLEAN? */}
      <section className="town-section">
        <div className="town-trust-content">
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>What Is a Deep Cleaning — and Do You Really Need One?</h2>
          
          <div className="town-trust-text">
            <p>If you've searched "what's included in a deep clean," you're not alone. Many homeowners assume it's just a more intense regular cleaning — but a true deep clean resets your home by tackling built-up dirt, grease, soap scum, and hidden dust that standard maintenance cleanings miss entirely.</p>
            
            <p style={{ marginTop: '20px' }}><strong>A professional deep cleaning is especially valuable if:</strong></p>
            
            <ul className="cta-benefits" style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li><CheckCircle size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> It's your first time hiring professional cleaners</li>
              <li><CheckCircle size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> Your home hasn't had a thorough clean in several months or longer</li>
              <li><House size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> You're moving in or out of a home</li>
              <li><Sparkles size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> You want a full reset before starting recurring bi-weekly or monthly service</li>
              <li><Star size={24} color="var(--color-secondary)" style={{ flexShrink: 0 }}/> You're preparing for guests, an event, or a holiday gathering</li>
            </ul>

            <div className="service-tip" style={{ marginTop: '30px' }}>
              <Sparkles size={30} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
              <div>
                Most Long Island homeowners — especially in <Link to="/locations/garden-city" style={{color: 'var(--color-secondary)'}}>Garden City</Link>, <Link to="/locations/manhasset" style={{color: 'var(--color-secondary)'}}>Manhasset</Link>, and <Link to="/locations/dix-hills" style={{color: 'var(--color-secondary)'}}>Dix Hills</Link> — start with a deep clean, then move to bi-weekly maintenance to keep their home consistently fresh without the effort.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE ACTUAL CHECKLIST */}
      <section className="town-section town-trust-section">
        <h2 style={{ textAlign: 'center', marginBottom: '50px' }}>G&G Cleaning's Complete Deep Cleaning Checklist</h2>
        
        <div className="town-services-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Kitchen */}
          <div className="town-service-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              🍳 Kitchen — 11 Areas Covered
            </h3>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Clean and sanitize all countertops and backsplash</li>
              <li>Clean exterior of all cabinets and drawers including faces and handles</li>
              <li>Spot clean reachable interior cabinet areas</li>
              <li>Clean and sanitize sink, polish faucet and all fixtures</li>
              <li>Degrease stovetop, burners, and range hood thoroughly</li>
              <li>Clean exterior of all appliances — refrigerator, oven, dishwasher, and microwave</li>
              <li>Clean inside microwave completely including ceiling and walls</li>
              <li>Wipe down and sanitize small countertop appliances</li>
              <li>Wipe interior and exterior of oven door and handles</li>
              <li>Clean behind and under reachable appliances</li>
              <li>Vacuum and mop all floors including edges and corners</li>
            </ol>
          </div>
142: 
          {/* Bathrooms */}
          <div className="town-service-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              🚿 Bathrooms — 10 Areas Covered
            </h3>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Scrub and disinfect toilets inside and out including base and behind</li>
              <li>Clean and sanitize sinks and all countertop surfaces</li>
              <li>Polish mirrors and all glass surfaces</li>
              <li>Scrub showers and tubs, remove soap scum and mineral buildup</li>
              <li>Clean tile and grout with focus on built-up residue</li>
              <li>Polish all fixtures and hardware throughout</li>
              <li>Clean exhaust fans and bathroom vents</li>
              <li>Wipe door frames, handles, and light switches</li>
              <li>Empty trash and sanitize wastebaskets</li>
              <li>Mop floors thoroughly including corners and behind toilet base</li>
            </ol>
          </div>
161: 
          {/* Bedrooms */}
          <div className="town-service-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              🛏️ Bedrooms — 8 Areas Covered
            </h3>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Dust all surfaces including furniture, nightstands, and dressers</li>
              <li>Clean mirrors and all glass surfaces</li>
              <li>Dust light fixtures and ceiling fans completely</li>
              <li>Dust baseboards and window sills</li>
              <li>Dust blinds and reachable window tracks</li>
              <li>Vacuum under beds and all reachable floor areas</li>
              <li>Vacuum carpets and rugs or mop hard floors</li>
              <li>Make beds upon request</li>
            </ol>
          </div>
178: 
          {/* Living Areas */}
          <div className="town-service-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              🛋️ Living Areas — 8 Areas Covered
            </h3>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Dust all furniture, shelves, décor, and electronics</li>
              <li>Clean glass tables and surfaces</li>
              <li>Dust baseboards and door frames throughout</li>
              <li>Clean light fixtures and ceiling fans</li>
              <li>Remove cobwebs and dust vents and air returns</li>
              <li>Clean stair railings and banisters where applicable</li>
              <li>Vacuum carpets and rugs or mop hard floors</li>
              <li>Straighten cushions and general surface tidying</li>
            </ol>
          </div>
195: 
          {/* Whole Home Detail */}
          <div className="town-service-card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              ✨ Whole-Home Detail Areas — 8 Areas Covered
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <ol style={{ paddingLeft: '20px', lineHeight: '1.8', margin: 0 }}>
                <li>High-touch surface sanitizing throughout — switches, knobs, handles, and remotes</li>
                <li>Spot clean walls and scuff marks as needed</li>
                <li>Dust all vents and air return covers</li>
                <li>Remove cobwebs from corners, ceilings, and stairwells</li>
              </ol>
              <ol start="5" style={{ paddingLeft: '20px', lineHeight: '1.8', margin: 0 }}>
                <li>Clean all interior door frames and handles</li>
                <li>Wipe all light switches and outlet covers</li>
                <li>Final room-by-room walk-through for missed details</li>
                <li>Ensure all surfaces are dry, streak-free, and presentation-ready</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — DETAILS & WHO */}
      <section className="town-section town-trust-section">
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '50px' }}>
          <div>
            <h2 style={{ marginBottom: '20px' }}>What Makes This a True Deep Clean?</h2>
            <p style={{ lineHeight: '1.8', color: 'var(--color-text)' }}>
              Most cleaning services run through a home on a timer. G&G Cleaning works through a systematic room-by-room process built around the 40+ point checklist above — focusing on built-up grime, high-touch surfaces, and the areas that standard maintenance cleanings skip entirely. The result is a home that doesn't just look clean — it feels completely reset and sanitized throughout.
            </p>
          </div>
          <div>
            <h2 style={{ marginBottom: '20px' }}>Who Is a Deep Cleaning Right For?</h2>
            <p style={{ lineHeight: '1.6', color: 'var(--color-text)', marginBottom: '15px' }}>A professional deep cleaning from G&G Cleaning is the right choice if you are:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><CheckCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: '2px' }}/> <span style={{ color: 'var(--color-text)' }}>A first-time professional cleaning client starting fresh</span></li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><CheckCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: '2px' }}/> <span style={{ color: 'var(--color-text)' }}>A homeowner preparing for guests, a holiday, or a special event</span></li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><CheckCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: '2px' }}/> <span style={{ color: 'var(--color-text)' }}>Someone moving into or out of a home in Nassau or Suffolk County</span></li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><CheckCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: '2px' }}/> <span style={{ color: 'var(--color-text)' }}>A family that wants a complete reset before starting a recurring cleaning plan</span></li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}><CheckCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: '2px' }}/> <span style={{ color: 'var(--color-text)' }}>A property owner managing a rental or vacation home turnover</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FAQ */}
      <FAQSection 
        items={customFaqs} 
        title="Deep House Cleaning — Frequently Asked Questions" 
        subtitle=""
      />

      {/* SECTION 6 — SERVICE AREA & TRUST BADGES */}
      <section className="town-section town-trust-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ marginBottom: '20px' }}>Deep Cleaning Service Areas — Long Island</h2>
        <p style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '60px' }}>
          <Link to="/locations/garden-city" style={{color: 'inherit', textDecoration: 'none'}}>Garden City</Link> | 
          <Link to="/locations/manhasset" style={{color: 'inherit', textDecoration: 'none'}}> Manhasset</Link> | 
          <Link to="/locations/dix-hills" style={{color: 'inherit', textDecoration: 'none'}}> Dix Hills</Link> | 
          Great Neck | Port Washington | Roslyn | Huntington | Commack | Melville | Syosset | Woodbury | Mineola | Westbury | Cold Spring Harbor | Floral Park | New Hyde Park | Uniondale | Huntington Station | Wheatley Heights | Carle Place
        </p>

        <h2 style={{ marginBottom: '30px' }}>Why Long Island Homeowners Trust G&G Cleaning</h2>
        <div className="trust-stack">
          <div className="trust-badge"><Star size={20} fill="var(--color-secondary)" /> 5.0 Star Rated on Google</div>
          <div className="trust-badge"><ShieldCheck size={20} /> Family-Owned Since 2008</div>
          <div className="trust-badge"><ShieldCheck size={20} /> Fully Insured & Bonded</div>
          <div className="trust-badge"><ShieldCheck size={20} /> Background-Checked Team</div>
          <div className="trust-badge"><Sparkles size={20} /> Non-Toxic, Pet-Safe Products</div>
          <div className="trust-badge"><MapPin size={20} /> Same Consistent Team</div>
          <div className="trust-badge"><House size={20} /> Serving LI Over 15 Years</div>
        </div>
      </section>

      {/* SECTION 7 — FINAL CTA */}
      <section className="town-section town-trust-section dark">
        <h2 style={{ fontSize: '2.8rem', marginBottom: '24px' }}>Ready for a Truly Clean Home?</h2>
        <p style={{ fontSize: '1.25rem', marginBottom: '40px', maxWidth: '850px', margin: '0 auto 48px' }}>
          G&G Cleaning has been Long Island's trusted deep cleaning service since 2008. Get transparent pricing, easy scheduling, and a team that treats your home with the care it deserves.
        </p>
        
        <button className="cta-btn-large" onClick={onOpenEstimate} style={{ maxWidth: '420px' }}>
          👉 Get Your Instant Deep Cleaning Quote Now
        </button>
      </section>

    </div>
  );
};

export default DeepCleanChecklistPage;
