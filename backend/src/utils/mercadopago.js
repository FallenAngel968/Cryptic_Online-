import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const preferenceClient = new Preference(mp);
const paymentClient = new Payment(mp); // 👈 necesario para .findById

export { preferenceClient, paymentClient, mp };
