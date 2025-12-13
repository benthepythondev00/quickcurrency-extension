import { startPaymentBackgroundListener, onPaymentStatusChange } from '@/src/lib/payment';
import { setProStatus } from '@/src/lib/storage';

export default defineBackground(() => {
  console.log('QuickCurrency background started', { id: browser.runtime.id });
  
  // Start ExtPay background listener for payment processing
  startPaymentBackgroundListener();
  
  // Listen for payment status changes
  onPaymentStatusChange(async (user) => {
    console.log('QuickCurrency: Payment status changed', { paid: user.paid });
    await setProStatus(user.paid);
  });
});
