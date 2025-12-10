import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: string | null;
}

export const useCryptoWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
  });

  const hasWallet = useCallback(() => {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    }
    // En móvil siempre retornar true para permitir intentar conexión
    return true;
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Conexión Web: usar window.ethereum (MetaMask)
        if (!window.ethereum) {
          throw new Error('MetaMask no está instalado. Por favor instálalo para continuar.');
        }

        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });

        setWalletState({
          address: accounts[0],
          isConnected: true,
          chainId,
        });

        console.log('✅ Web Wallet conectada:', accounts[0]);

        return {
          address: accounts[0],
          chainId,
        };
      } else {
        // En móvil, mostrar mensaje de instrucciones
        throw new Error(
          'En dispositivos móviles, necesitas usar MetaMask Mobile App o un navegador compatible.\n\n' +
          '1. Abre MetaMask en tu dispositivo\n' +
          '2. Copia el enlace: ethereum://walletconnect\n' +
          '3. Pega en MetaMask para conectar'
        );
      }
    } catch (error: any) {
      console.error('Error conectando wallet:', error);
      throw error;
    }
  }, []);

  const sendTransaction = useCallback(
    async (to: string, amount: string, tokenAddress: string) => {
      try {
        if (Platform.OS !== 'web' || !window.ethereum) {
          throw new Error('Wallet no disponible');
        }

        // Crear data para transferencia ERC20
        const transferData = encodeERC20Transfer(to, amount);

        const tx = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: walletState.address,
              to: tokenAddress,
              value: '0x0',
              data: transferData,
            },
          ],
        });

        console.log('✅ Transacción enviada:', tx);
        return tx;
      } catch (error: any) {
        console.error('Error enviando transacción:', error);
        throw error;
      }
    },
    [walletState.address]
  );

  const switchNetwork = useCallback(async () => {
    try {
      if (Platform.OS === 'web' && window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x89' }],
          });
          console.log('✅ Cambiado a red Polygon');
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x89',
                  chainName: 'Polygon',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18,
                  },
                  rpcUrls: ['https://polygon-rpc.com/'],
                  blockExplorerUrls: ['https://polygonscan.com/'],
                },
              ],
            });
            console.log('✅ Red Polygon agregada');
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error('Error cambiando red:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setWalletState({
        address: null,
        isConnected: false,
        chainId: null,
      });
      console.log('✅ Wallet desconectada');
    } catch (error) {
      console.error('Error desconectando:', error);
    }
  }, []);

  return {
    walletState,
    connectWallet,
    sendTransaction,
    switchNetwork,
    disconnect,
    hasWallet,
  };
};

// Helper para codificar transferencia ERC20
function encodeERC20Transfer(to: string, amount: string): string {
  // Función transfer(address to, uint256 amount)
  const methodId = '0xa9059cbb';

  // Padding de dirección
  const paddedTo = to.substring(2).padStart(64, '0');

  // Padding de amount (en wei, asumiendo 6 decimales para USDT)
  const amountWei = (BigInt(amount) * BigInt(10 ** 6)).toString(16);
  const paddedAmount = amountWei.padStart(64, '0');

  return `${methodId}${paddedTo}${paddedAmount}`;
}
