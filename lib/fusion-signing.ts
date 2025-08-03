import { WalletClient } from 'viem';

// EIP-712 domain for 1inch Fusion orders
export const FUSION_DOMAIN = {
  name: '1inch Fusion',
  version: '1',
  chainId: 1, // Will be dynamic based on network
  verifyingContract: '0x2ad5004c60e16e54d5007c80ce329adde5b51ef5' as `0x${string}`, // Settlement contract
};

// EIP-712 types for Fusion orders
export const FUSION_ORDER_TYPES = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'receiver', type: 'address' },
    { name: 'makerAsset', type: 'address' },
    { name: 'takerAsset', type: 'address' },
    { name: 'makingAmount', type: 'uint256' },
    { name: 'takingAmount', type: 'uint256' },
    { name: 'makerTraits', type: 'uint256' },
  ],
};

export interface FusionOrderForSigning {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

/**
 * Sign a Fusion order using EIP-712
 */
export async function signFusionOrder(
  walletClient: WalletClient,
  order: FusionOrderForSigning,
  chainId: number,
  signTypedDataAsync: any
): Promise<string> {
  try {
    console.log('🔐 Signing Fusion order with EIP-712...');
    
    const domain = {
      ...FUSION_DOMAIN,
      chainId,
    };

    const signature = await signTypedDataAsync({
      domain,
      types: FUSION_ORDER_TYPES,
      primaryType: 'Order',
      message: order,
    });

    console.log('✅ Order signed successfully');
    return signature;
  } catch (error) {
    console.error('❌ Error signing order:', error);
    throw new Error(`Failed to sign order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert Fusion SDK order to signing format
 */
export function prepareFusionOrderForSigning(fusionOrder: any): FusionOrderForSigning {
  console.log('🔍 Preparing order for signing:', fusionOrder);
  
  // Extract the inner limit order from the Fusion order structure
  const inner = fusionOrder.inner || fusionOrder;
  console.log('📋 Inner order:', inner);
  
  // Handle both original SDK format and serialized format
  const salt = inner._salt || inner.salt || '0';
  const maker = inner.maker?.val || inner.maker || '';
  const receiver = inner.receiver?.val || inner.receiver || '';
  const makerAsset = inner.makerAsset?.val || inner.makerAsset || '';
  const takerAsset = inner.takerAsset?.val || inner.takerAsset || '';
  const makingAmount = inner.makingAmount || '0';
  const takingAmount = inner.takingAmount || '0';
  const makerTraits = inner.makerTraits?.value?.value || inner.makerTraits?.toString() || inner.makerTraits || '0';
  
  const orderForSigning = {
    salt: salt.toString(),
    maker: maker.toString(),
    receiver: receiver.toString(),
    makerAsset: makerAsset.toString(),
    takerAsset: takerAsset.toString(),
    makingAmount: makingAmount.toString(),
    takingAmount: takingAmount.toString(),
    makerTraits: makerTraits.toString(),
  };
  
  console.log('✅ Prepared order for signing:', orderForSigning);
  return orderForSigning;
}

/**
 * Submit signed order to Fusion resolver network
 */
export async function submitSignedFusionOrder(
  order: any,
  signature: string,
  quoteId: string,
  chainId: number
): Promise<{ orderHash: string; status: string }> {
  try {
    console.log('📤 Submitting signed order to Fusion network...');
    
    const response = await fetch('/api/1inch/fusion/submit-signed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order,
        signature,
        quoteId,
        chainId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Submission failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Order submitted successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error submitting signed order:', error);
    throw error;
  }
}
