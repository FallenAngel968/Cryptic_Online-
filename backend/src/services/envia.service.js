import axios from 'axios';

const ENVIA_API_KEY = process.env.ENVIA_API_KEY;
const BASE_URL = 'https://api.envia.com'; // según doc

const createShipment = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/shipments`, data, {
      headers: {
        'Authorization': `Bearer ${ENVIA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (err) {
    console.error('❌ Error creando envío:', err.response?.data || err.message);
    throw err;
  }
};

const trackShipment = async (trackingNumber) => {
  try {
    const response = await axios.get(`${BASE_URL}/trackings/${trackingNumber}`, {
      headers: {
        'Authorization': `Bearer ${ENVIA_API_KEY}`,
      }
    });
    return response.data;
  } catch (err) {
    console.error('❌ Error rastreando paquete:', err.response?.data || err.message);
    throw err;
  }
};

export default { createShipment, trackShipment };
