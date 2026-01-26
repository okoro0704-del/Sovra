import { supabase } from '../config/supabase';
import { SovMintingEvent, SovTokenBalance, MintingEventType } from '@sovrn/shared';

/**
 * SOVRA_Sovereign_Kernel - Token Minting Service
 *
 * Core ledger function for usage-based SOV token minting
 * Implements usage-based value logic: SOV tokens are minted based on PFF verification events
 */

// Default minting amount per PFF verification (can be configured)
const DEFAULT_MINT_AMOUNT = '1.0'; // 1 SOV per verification

/**
 * SOVRA_Sovereign_Kernel: Mint SOV tokens for a citizen
 *
 * Core ledger function for minting tokens based on consent events
 * This is the core of the usage-based value logic
 */
export async function mintTokensForConsent(
  citizenId: string,
  consentId: string,
  pffVerificationHash?: string,
  customAmount?: string
): Promise<{ success: boolean; mintingEvent?: SovMintingEvent; error?: string }> {
  try {
    const amount = customAmount || DEFAULT_MINT_AMOUNT;

    // 1. Create minting event record
    const { data: mintingEvent, error: mintError } = await supabase
      .from('sov_minting_events')
      .insert({
        citizen_id: citizenId,
        consent_id: consentId,
        event_type: 'consent_granted' as MintingEventType,
        amount: amount,
        pff_verification_hash: pffVerificationHash,
        metadata: {
          minted_by: 'system',
          reason: 'PFF verification and consent granted'
        }
      })
      .select()
      .single();

    if (mintError || !mintingEvent) {
      console.error('Failed to create minting event:', mintError);
      return { success: false, error: 'Failed to create minting event' };
    }

    // 2. Update or create citizen's token balance
    const balanceUpdateResult = await updateCitizenBalance(citizenId, amount);
    
    if (!balanceUpdateResult.success) {
      console.error('Failed to update balance:', balanceUpdateResult.error);
      return { success: false, error: 'Failed to update token balance' };
    }

    // 3. Record transaction in ledger
    const { error: txError } = await supabase
      .from('sov_token_transactions')
      .insert({
        to_citizen_id: citizenId,
        transaction_type: 'mint',
        amount: amount,
        reference_id: mintingEvent.id,
        metadata: {
          consent_id: consentId,
          event_type: 'consent_granted'
        }
      });

    if (txError) {
      console.error('Failed to record transaction:', txError);
      // Don't fail the whole operation if transaction logging fails
    }

    return { success: true, mintingEvent };
  } catch (error) {
    console.error('Token minting error:', error);
    return { success: false, error: 'Internal error during token minting' };
  }
}

/**
 * Update citizen's token balance (or create if doesn't exist)
 */
async function updateCitizenBalance(
  citizenId: string,
  amountToAdd: string
): Promise<{ success: boolean; balance?: SovTokenBalance; error?: string }> {
  try {
    // Check if balance record exists
    const { data: existingBalance, error: fetchError } = await supabase
      .from('sov_token_balances')
      .select('*')
      .eq('citizen_id', citizenId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new citizens
      return { success: false, error: 'Failed to fetch existing balance' };
    }

    if (existingBalance) {
      // Update existing balance
      const newBalance = (parseFloat(existingBalance.balance) + parseFloat(amountToAdd)).toFixed(8);
      
      const { data: updatedBalance, error: updateError } = await supabase
        .from('sov_token_balances')
        .update({ balance: newBalance })
        .eq('citizen_id', citizenId)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: 'Failed to update balance' };
      }

      return { success: true, balance: updatedBalance };
    } else {
      // Create new balance record
      const { data: newBalance, error: createError } = await supabase
        .from('sov_token_balances')
        .insert({
          citizen_id: citizenId,
          balance: amountToAdd,
          staked_balance: '0'
        })
        .select()
        .single();

      if (createError) {
        return { success: false, error: 'Failed to create balance record' };
      }

      return { success: true, balance: newBalance };
    }
  } catch (error) {
    console.error('Balance update error:', error);
    return { success: false, error: 'Internal error updating balance' };
  }
}

/**
 * Get citizen's current token balance
 */
export async function getCitizenBalance(
  citizenId: string
): Promise<{ success: boolean; balance?: SovTokenBalance; error?: string }> {
  try {
    const { data: balance, error } = await supabase
      .from('sov_token_balances')
      .select('*')
      .eq('citizen_id', citizenId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No balance record exists yet - return zero balance
      return {
        success: true,
        balance: {
          id: '',
          citizen_id: citizenId,
          balance: '0',
          staked_balance: '0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }

    if (error) {
      return { success: false, error: 'Failed to fetch balance' };
    }

    return { success: true, balance };
  } catch (error) {
    console.error('Get balance error:', error);
    return { success: false, error: 'Internal error fetching balance' };
  }
}

