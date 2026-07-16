import { useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'gg_concierge_funnel_state';

const INITIAL_STATE = {
  currentStep: 'lead-capture',
  history: [],
  data: {
    serviceCategory: 'standard', // standard, deep, moveOut, airbnb, commercial
    bedrooms: 1,
    bathrooms: 1,
    sqft: '',
    clutterLevel: 'medium',
    hasPets: false,
    frequency: 'one-time',
    hasElevator: true,
    floorLevel: 1,
    parkingType: 'street',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    isExpress: false,
    isEcoFriendly: false,
    referralSource: '',
    quote_session_id: '',
    internal_quote_id: '',
  }
};

export function useConciergeFunnel() {
  const [funnelState, setFunnelState] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(funnelState));
  }, [funnelState]);

  const updateData = (newData) => {
    setFunnelState(prev => ({
      ...prev,
      data: { ...prev.data, ...newData }
    }));
  };

  const nextStep = (targetStep) => {
    setFunnelState(prev => ({
      ...prev,
      history: [...prev.history, prev.currentStep],
      currentStep: targetStep
    }));
  };

  const prevStep = () => {
    if (funnelState.history.length === 0) return;
    
    const newHistory = [...funnelState.history];
    const lastStep = newHistory.pop();
    
    setFunnelState(prev => ({
      ...prev,
      history: newHistory,
      currentStep: lastStep
    }));
  };

  const resetFunnel = () => {
    setFunnelState(INITIAL_STATE);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  // Logic for conditional branching
  const getNextStep = (currentStep, data) => {
    switch (currentStep) {
      case 'lead-capture':
        return 'home-size';
      
      case 'home-size':
        return 'operational-intelligence';
        
      case 'operational-intelligence':
        return 'final-quote';
        
      default:
        return 'lead-capture';
    }
  };

  const handleNext = () => {
    const target = getNextStep(funnelState.currentStep, funnelState.data);
    nextStep(target);
  };

  return {
    ...funnelState,
    updateData,
    nextStep,
    prevStep,
    handleNext,
    resetFunnel
  };
}
