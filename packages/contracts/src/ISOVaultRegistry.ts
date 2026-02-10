/**
 * ISOVaultRegistry.ts - TypeScript Integration Layer
 * 
 * "THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY."
 * 
 * This module provides TypeScript integration for the ISO-VAULT system,
 * enabling universal national vault authorization for all 195+ ISO-3166 nations.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

import {
  ISO3166_COUNTRIES,
  findCountryByCode,
  determineCountryFromLocation,
  getNearestCountry,
  type CountryInfo,
  type LocationCoordinates,
} from './ISO3166CountryRegistry';

// ════════════════════════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * National Vault structure
 */
export interface NationalVault {
  iso3166Code: string;
  countryName: string;
  safeVault: string;
  liquidityVault: string;
  nationalStableToken: string;
  safeVaultBalance: bigint;
  liquidityVaultBalance: bigint;
  snatLockExpiry: bigint;
  isActive: boolean;
  snatSigned: boolean;
}

/**
 * Citizen binding structure
 */
export interface CitizenBinding {
  citizen: string;
  iso3166Code: string;
  pffIdentity: string;
  latitude: bigint;
  longitude: bigint;
  bindingTimestamp: bigint;
  isActive: boolean;
}

/**
 * Cross-swap record structure
 */
export interface CrossSwapRecord {
  sender: string;
  recipient: string;
  fromNation: string;
  toNation: string;
  fromStableAmount: bigint;
  vidaCapAmount: bigint;
  toStableAmount: bigint;
  timestamp: bigint;
  swapHash: string;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  vaultsRegistered: bigint;
  citizensBound: bigint;
  crossSwaps: bigint;
  totalCountries: bigint;
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN CLASS - ISO VAULT REGISTRY
// ════════════════════════════════════════════════════════════════════════════════

/**
 * ISOVaultRegistry - Universal National Vault Authorization
 */
export class ISOVaultRegistry {
  private contract: any; // Smart contract instance

  constructor(contractInstance: any) {
    this.contract = contractInstance;
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // VAULT REGISTRATION
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Register a national vault for an ISO-3166 nation
   */
  async registerNationalVault(
    iso3166Code: string,
    countryName: string,
    safeVault: string,
    liquidityVault: string,
    nationalStableToken: string
  ): Promise<void> {
    const tx = await this.contract.registerNationalVault(
      iso3166Code,
      countryName,
      safeVault,
      liquidityVault,
      nationalStableToken
    );
    await tx.wait();
  }

  /**
   * Sign SNAT treaty for a nation (180-day protection)
   */
  async signSNATTreaty(iso3166Code: string): Promise<void> {
    const tx = await this.contract.signSNATTreaty(iso3166Code);
    await tx.wait();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // CITIZEN BINDING
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Bind citizen to vault based on geolocation
   * Uses geolocation boundaries to automatically route citizens to their sovereign vault
   */
  async bindCitizenToVault(
    citizen: string,
    pffIdentity: string,
    location: LocationCoordinates
  ): Promise<void> {
    // Determine country from location using geolocation boundaries
    const country = determineCountryFromLocation(location.latitude, location.longitude);
    
    if (!country) {
      // If exact match fails, find nearest country
      const nearestCountry = getNearestCountry(location.latitude, location.longitude);
      if (!nearestCountry) {
        throw new Error('Unable to determine country from location');
      }
      
      // Use nearest country
      const latitudeScaled = BigInt(Math.floor(location.latitude * 1e6));
      const longitudeScaled = BigInt(Math.floor(location.longitude * 1e6));
      
      const tx = await this.contract.bindCitizenToVault(
        citizen,
        nearestCountry.iso3166Code,
        pffIdentity,
        latitudeScaled,
        longitudeScaled
      );
      await tx.wait();
      return;
    }

    // Scale coordinates (multiply by 1e6 for precision)
    const latitudeScaled = BigInt(Math.floor(location.latitude * 1e6));
    const longitudeScaled = BigInt(Math.floor(location.longitude * 1e6));

    const tx = await this.contract.bindCitizenToVault(
      citizen,
      country.iso3166Code,
      pffIdentity,
      latitudeScaled,
      longitudeScaled
    );
    await tx.wait();
  }

  /**
   * Get citizen's bound nation
   */
  async getCitizenNation(citizen: string): Promise<string> {
    return await this.contract.getCitizenNation(citizen);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // VIDA CAP DEPOSIT
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Deposit VIDA CAP with 70/30 split
   */
  async depositVIDACAP(iso3166Code: string, amount: bigint): Promise<void> {
    const tx = await this.contract.depositVIDACAP(iso3166Code, amount);
    await tx.wait();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // GODCURRENCY CROSS-SWAP
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Execute cross-border swap: [A]_Stable → VIDA CAP → [B]_Stable
   */
  async executeCrossSwap(
    sender: string,
    recipient: string,
    fromStableAmount: bigint
  ): Promise<string> {
    const tx = await this.contract.executeCrossSwap(sender, recipient, fromStableAmount);
    const receipt = await tx.wait();

    // Extract swap hash from event
    const event = receipt.events?.find((e: any) => e.event === 'CrossSwapExecuted');
    return event?.args?.swapHash || '';
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // LIQUIDITY ISOLATION
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Validate liquidity isolation
   */
  async validateLiquidityIsolation(iso3166Code: string, citizen: string): Promise<boolean> {
    return await this.contract.validateLiquidityIsolation(iso3166Code, citizen);
  }

  /**
   * Enforce liquidity isolation (reverts on violation)
   */
  async enforceLiquidityIsolation(iso3166Code: string, citizen: string): Promise<void> {
    await this.contract.enforceLiquidityIsolation(iso3166Code, citizen);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // GETTER FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Get vault details for a nation
   */
  async getVaultDetails(iso3166Code: string): Promise<NationalVault> {
    const result = await this.contract.getVaultDetails(iso3166Code);
    return {
      iso3166Code,
      countryName: result.countryName,
      safeVault: result.safeVault,
      liquidityVault: result.liquidityVault,
      nationalStableToken: result.nationalStableToken,
      safeVaultBalance: result.safeVaultBalance,
      liquidityVaultBalance: result.liquidityVaultBalance,
      snatLockExpiry: result.snatLockExpiry,
      isActive: result.isActive,
      snatSigned: result.snatSigned,
    };
  }

  /**
   * Get citizen binding details
   */
  async getCitizenBinding(citizen: string): Promise<CitizenBinding> {
    const result = await this.contract.getCitizenBinding(citizen);
    return {
      citizen,
      iso3166Code: result.iso3166Code,
      pffIdentity: result.pffIdentity,
      latitude: result.latitude,
      longitude: result.longitude,
      bindingTimestamp: result.bindingTimestamp,
      isActive: result.isActive,
    };
  }

  /**
   * Get cross-swap record
   */
  async getCrossSwapRecord(swapHash: string): Promise<CrossSwapRecord> {
    const result = await this.contract.getCrossSwapRecord(swapHash);
    return {
      sender: result.sender,
      recipient: result.recipient,
      fromNation: result.fromNation,
      toNation: result.toNation,
      fromStableAmount: result.fromStableAmount,
      vidaCapAmount: result.vidaCapAmount,
      toStableAmount: result.toStableAmount,
      timestamp: result.timestamp,
      swapHash,
    };
  }

  /**
   * Get all registered countries
   */
  async getRegisteredCountries(): Promise<string[]> {
    return await this.contract.getRegisteredCountries();
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<RegistryStats> {
    const result = await this.contract.getRegistryStats();
    return {
      vaultsRegistered: result.vaultsRegistered,
      citizensBound: result.citizensBound,
      crossSwaps: result.crossSwaps,
      totalCountries: result.totalCountries,
    };
  }

  /**
   * Check if SNAT lock is active
   */
  async isSNATLockActive(iso3166Code: string): Promise<boolean> {
    return await this.contract.isSNATLockActive(iso3166Code);
  }

  /**
   * Get remaining SNAT lock time
   */
  async getRemainingLockTime(iso3166Code: string): Promise<bigint> {
    return await this.contract.getRemainingLockTime(iso3166Code);
  }

  /**
   * Get validation message
   */
  async getValidationMessage(): Promise<string> {
    return await this.contract.getValidationMessage();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Register all 195+ ISO-3166 nations (batch operation)
   */
  async registerAllNations(
    safeVaultFactory: (iso: string) => string,
    liquidityVaultFactory: (iso: string) => string,
    stableTokenFactory: (iso: string) => string
  ): Promise<void> {
    console.log(`Registering ${ISO3166_COUNTRIES.length} nations...`);

    for (const country of ISO3166_COUNTRIES) {
      try {
        await this.registerNationalVault(
          country.iso3166Code,
          country.countryName,
          safeVaultFactory(country.iso3166Code),
          liquidityVaultFactory(country.iso3166Code),
          stableTokenFactory(country.iso3166Code)
        );
        console.log(`✅ Registered: ${country.countryName} (${country.iso3166Code})`);
      } catch (error) {
        console.error(`❌ Failed to register ${country.countryName}:`, error);
      }
    }

    console.log('✅ All nations registered!');
  }

  /**
   * Get country info from ISO code
   */
  getCountryInfo(iso3166Code: string): CountryInfo | undefined {
    return findCountryByCode(iso3166Code);
  }

  /**
   * Determine country from location
   */
  determineCountryFromLocation(location: LocationCoordinates): CountryInfo | undefined {
    return determineCountryFromLocation(location.latitude, location.longitude);
  }
}

