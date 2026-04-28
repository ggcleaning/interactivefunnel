import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FAQSection.css';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
      <button 
        className="faq-question" 
        onClick={onClick}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span className="faq-icon">{isOpen ? '−' : '+'}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="faq-answer-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="faq-answer">
              <p>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = ({ items, title = "Frequently Asked Questions", subtitle = "Common questions about our Long Island cleaning services." }) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-header">
          <div className="faq-label">Got Questions?</div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="faq-list">
          {items.map((item, index) => (
            <FAQItem 
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
