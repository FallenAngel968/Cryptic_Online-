import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { apiRequest } from '../config/api';

export const usePaymentStatusChecker = () => {
  const [checking, setChecking] = useState(false);

  const checkPaymentStatus = useCallback(async (orderId: number) => {
    try {
      setChecking(true);
      console.log('🔍 Verificando estado de pago para orden:', orderId);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        return null;
      }

      // Verificar si hay pagos en la base de datos
      console.log('🔍 Verificando pagos en base de datos...');
      const { response: paymentsResponse, data: paymentsData } = await apiRequest('/api/orders/debug/payments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (paymentsResponse.ok) {
        console.log('💳 Pagos en DB:', paymentsData.payments);
        const orderPayments = paymentsData.payments.filter((p: any) => 
          p.orderId === orderId || p.referenceId?.includes(orderId.toString())
        );
        console.log(`💳 Pagos para orden ${orderId}:`, orderPayments);
        
        // Si hay pagos pero la orden sigue pendiente, algo está mal con los webhooks
        if (orderPayments.length > 0) {
          console.log('⚠️ PROBLEMA: Hay pagos en DB pero la orden no se actualizó');
          console.log('🔍 Esto sugiere que los webhooks de MercadoPago no están llegando');
        }
      }

      const { response, data } = await apiRequest(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok && data.success) {
        console.log('✅ Estado de pago actualizado:', {
          orderId: data.order.id,
          status: data.order.status,
          payments: data.order.payments?.length || 0
        });
        return data.order;
      } else {
        console.error('❌ Error verificando estado de pago:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error verificando estado de pago:', error);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const checkMultipleOrders = useCallback(async (orderIds: number[]) => {
    try {
      setChecking(true);
      console.log('🔍 Verificando múltiples órdenes:', orderIds);
      
      const results = await Promise.all(
        orderIds.map(orderId => checkPaymentStatus(orderId))
      );
      
      return results.filter(Boolean); // Filtrar nulls
    } catch (error) {
      console.error('❌ Error verificando múltiples órdenes:', error);
      return [];
    } finally {
      setChecking(false);
    }
  }, [checkPaymentStatus]);

  // Función para verificar automáticamente órdenes pendientes
  const autoCheckPendingOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return [];

      console.log('🔄 Verificación automática de órdenes pendientes...');
      
      // Obtener órdenes pendientes
      const { response, data } = await apiRequest('/api/orders', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok && data.success) {
        const pendingOrders = data.orders.filter((order: any) => order.status === 'PENDING');
        console.log(`🔍 Encontradas ${pendingOrders.length} órdenes pendientes`);
        
        if (pendingOrders.length > 0) {
          // Verificar cada orden pendiente
          const updatedOrders = [];
          for (const order of pendingOrders) {
            const updated = await checkPaymentStatus(order.id);
            if (updated && updated.status !== 'PENDING') {
              updatedOrders.push(updated);
            }
          }
          
          if (updatedOrders.length > 0) {
            console.log(`✅ ${updatedOrders.length} órdenes actualizadas automáticamente`);
          }
          
          return updatedOrders;
        }
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error en verificación automática:', error);
      return [];
    }
  }, [checkPaymentStatus]);

  return {
    checkPaymentStatus,
    checkMultipleOrders,
    autoCheckPendingOrders,
    checking
  };
};