// Central place for all business rules — change once, applies everywhere
export const PLATFORM_FEES = {
  hospital_attendant: 7.5,
  home_nurse: 9.5,
};

export const calculateFee = (amount: number, serviceType: 'hospital_attendant' | 'home_nurse') => {
  const feePercent = PLATFORM_FEES[serviceType];
  const fee = Math.round((amount * feePercent) / 100);
  const providerEarning = amount - fee;
  return { fee, providerEarning, feePercent };
};