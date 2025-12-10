import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, createAuthHeaders } from '../config/api';

interface CreatePaymentOrderPayload {
  walletAddress: string;
  amount: number;
  currency: 'USDT' | 'MATIC';
  network: 'polygon';
  items: any[];
  orderId?: string;
}

interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  receiverAddress: string;
  contractAddress: string;
}

export const cryptoService = {
  async createPaymentOrder(
    payload: CreatePaymentOrderPayload
  ): Promise<PaymentOrderResponse> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No autorizado');
      }

      const response = await fetch(createApiUrl('/api/crypto/create-payment'), {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando orden de pago');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error en cryptoService.createPaymentOrder:', error);
      throw error;
    }
  },

  async confirmPayment(
    orderId: string,
    transactionHash: string,
    walletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No autorizado');
      }

      const response = await fetch(
        createApiUrl(`/api/crypto/confirm-payment/${orderId}`),
        {
          method: 'POST',
          headers: createAuthHeaders(token),
          body: JSON.stringify({
            transactionHash,
            walletAddress,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error confirmando pago');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error en cryptoService.confirmPayment:', error);
      throw error;
    }
  },

  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No autorizado');
      }

      const response = await fetch(
        createApiUrl(`/api/crypto/payment-status/${orderId}`),
        {
          method: 'GET',
          headers: createAuthHeaders(token),
        }
      );

      if (!response.ok) {
        throw new Error('Error obteniendo estado del pago');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error en cryptoService.getPaymentStatus:', error);
      throw error;
    }
  },
};
