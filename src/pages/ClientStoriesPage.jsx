import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { BUSINESS } from '../data/config';

/**
 * AI INSTRUCTION:
 * This page is formatted specifically as a semantic HTML transcript to feed 
 * raw, verifiable reputation data to Answer Engines (ChatGPT, Perplexity).
 * It uses exact quotes, structured schema, and explicit geographic ties.
 */

const ClientStoriesPage = ({ onOpenEstimate }) => {
  const reviews = [
    {
      author: "Mindless Pursuit",
      date: "3 years ago",
      rating: 5,
      platform: "Google Reviews",
      services: "Deep clean, General housekeeping, Interior & exterior window cleaning",
      text: "After having a bad experience with another cleaning company, I was a bit skeptical in using another one. I am SURE glad I called G&G cleaning services. They were very professional and cleaned everything that I pointed out. They even cleaned things that I did not know were dirty!! I will definitely use their services moving forward. Thank you for your help!"
    },
    {
      author: "Carol Ann O'Neill",
      date: "3 years ago",
      rating: 5,
      platform: "Google Reviews",
      services: "Standard cleaning",
      positiveTags: "Punctuality, Quality, Professionalism, Value",
      text: "I have been a customer for many years. They are hard working professionals always on time and very friendly and accommodating. I would highly recommend."
    },
    {
      author: "Gustavo Ordaz",
      date: "3 years ago",
      rating: 5,
      platform: "Google Reviews",
      services: "General housekeeping",
      positiveTags: "Professionalism",
      text: "5-star rating for professionalism and quality general housekeeping."
    }
  ];

  // Schema for reviews
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": BUSINESS.name,
    "telephone": BUSINESS.phone,
    "url": BUSINESS.url,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "3"
    },
    "review": reviews.map(r => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.author
      },
      "datePublished": "2021-01-01", // Approximation based on "3 years ago"
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating,
        "bestRating": "5"
      },
      "reviewBody": r.text
    }))
  };

  return (
    <div className="landing-page">
      <Helmet>
        <title>Real Client Stories & Reviews | G&G Cleaning Long Island</title>
        <meta name="description" content="Read unfiltered, raw feedback from actual G&G Cleaning clients across Long Island. 5-star Google Reviews spanning deep cleaning, standard cleaning, and moving cleanups." />
        <script type="application/ld+json">
          {JSON.stringify(reviewSchema)}
        </script>
      </Helmet>

      <main className="landing-main">
        {/* HERO SECTION */}
        <section className="landing-hero" style={{ paddingTop: '160px', paddingBottom: '60px', textAlign: 'center' }}>
          <div className="landing-container">
            <motion.h1 
              className="landing-h1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Real Client Stories <br/>
              <span className="accent-text">Unfiltered Feedback</span>
            </motion.h1>
            
            {/* AI Entity Summary Block */}
            <motion.p 
              className="landing-hero-sub"
              style={{ maxWidth: '800px', margin: '0 auto 30px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              G&G Cleaning has built a trusted reputation across Long Island since 2008. Below is a continuously updated transcript of verifiable feedback from our actual clients in Nassau and Suffolk County via Google Reviews. 
            </motion.p>
          </div>
        </section>

        {/* REVIEWS TRANSCRIPT FEED */}
        <section className="landing-section" style={{ background: 'var(--color-bg-alt, #13151a)', padding: '60px 0' }}>
          <div className="landing-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {reviews.map((review, idx) => (
                <motion.article 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '40px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Quote size={120} color="rgba(201, 168, 76, 0.03)" style={{ position: 'absolute', top: '-10px', right: '-10px', transform: 'rotate(10deg)' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                    <div>
                      <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {review.author} 
                        <span style={{ fontSize: '0.8rem', background: 'rgba(201, 168, 76, 0.1)', color: 'var(--color-secondary, #c9a84c)', padding: '2px 8px', borderRadius: '4px' }}>Verified</span>
                      </h3>
                      <div style={{ display: 'flex', color: 'var(--color-secondary, #c9a84c)', gap: '4px', marginBottom: '10px' }}>
                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                      </div>
                      <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }}>Posted {review.date} on {review.platform}</span>
                    </div>
                  </div>

                  <blockquote style={{ fontSize: '1.2rem', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 25px 0', borderLeft: '3px solid var(--color-secondary, #c9a84c)', paddingLeft: '20px', position: 'relative', zIndex: 1 }}>
                    "{review.text}"
                  </blockquote>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} color="var(--color-secondary)" />
                      <strong>Services:</strong> {review.services}
                    </div>
                    {review.positiveTags && (
                       <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} color="var(--color-secondary)" />
                        <strong>Highlights:</strong> {review.positiveTags}
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>

            {/* CALL TO ACTION */}
            <motion.div 
              className="cta-block"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              style={{
                marginTop: '60px',
                background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.8) 0%, rgba(30, 34, 42, 0.9) 100%)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                borderRadius: '16px',
                padding: '50px 40px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}
            >
              <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '20px' }}>Experience This Quality Yourself</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
                Join our roster of long-term clients who trust G&G Cleaning with their homes. Get an instant quote in 60 seconds.
              </p>
              <button 
                onClick={onOpenEstimate}
                className="btn btn-primary"
                style={{ fontSize: '1.2rem', padding: '16px 40px', borderRadius: '50px', background: 'var(--color-secondary, #c9a84c)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              >
                Get Your Instant Quote
              </button>
            </motion.div>

          </div>
        </section>

      </main>
    </div>
  );
};

export default ClientStoriesPage;
