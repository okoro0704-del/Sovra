/**
 * Nigerian Spoke Configuration
 * Customizes SOVRN Protocol for Nigerian regulatory and operational requirements
 */

export const NigeriaConfig = {
  /**
   * Token Economics - Nigerian Minting Rates
   */
  tokenEconomics: {
    // Standard minting rates
    mintingRates: {
      pff_verification: '1.0',      // 1 SOV per PFF verification
      consent_granted: '1.0',       // 1 SOV per consent granted
      manual_mint: '0.0'            // Manual minting disabled by default
    },

    // Bonus multipliers
    bonuses: {
      first_time_registration: '5.0',  // 5 SOV bonus for first-time users
      high_value_consent: '1.5',       // 1.5x multiplier for financial data consent
      frequent_user_monthly: '2.0'     // 2 SOV monthly bonus for active users
    },

    // Rate limiting
    rateLimits: {
      max_mints_per_day: 10,           // Maximum 10 minting events per citizen per day
      cooldown_period_minutes: 60      // 60-minute cooldown between verifications
    }
  },

  /**
   * Regulatory Compliance - NDPR (Nigeria Data Protection Regulation)
   */
  compliance: {
    // Data protection
    ndpr: {
      enabled: true,
      data_residency: 'nigeria',       // All data must reside in Nigeria
      consent_expiry_days: 365,        // Consent expires after 1 year
      right_to_erasure: true,          // Citizens can request data deletion
      data_portability: true           // Citizens can export their data
    },

    // NIMC (National Identity Management Commission) integration
    nimc: {
      enabled: true,
      require_nin_verification: true,  // Require NIN for registration
      nin_validation_endpoint: process.env.NIMC_API_ENDPOINT || 'https://api.nimc.gov.ng/verify'
    },

    // KYC/AML requirements
    kyc: {
      tier1_kyc_required: true,        // Government entities require full KYC
      tier2_kyc_required: true,        // Financial institutions require KYC
      tier3_kyc_required: false        // Commercial entities - basic verification only
    }
  },

  /**
   * Localization - Nigerian Languages
   */
  localization: {
    default_language: 'en',
    supported_languages: ['en', 'ha', 'yo', 'ig'],  // English, Hausa, Yoruba, Igbo
    currency_display: 'NGN',           // Display token value in Naira equivalent
    date_format: 'DD/MM/YYYY',
    timezone: 'Africa/Lagos'
  },

  /**
   * Infrastructure - Nigerian Deployment
   */
  infrastructure: {
    // API configuration
    api: {
      base_url: process.env.API_BASE_URL || 'https://api.nigeria.sovrn.protocol',
      port: parseInt(process.env.PORT || '3000'),
      rate_limit_requests: 100,        // 100 requests per minute per API key
      rate_limit_window_ms: 60000
    },

    // Database configuration
    database: {
      region: 'nigeria',
      backup_frequency_hours: 24,
      retention_days: 90
    },

    // CDN and static assets
    cdn: {
      enabled: true,
      provider: 'cloudflare',
      region: 'africa'
    }
  },

  /**
   * Entity Tiers - Nigerian Classification
   */
  entityTiers: {
    tier1: {
      name: 'Government Agencies',
      examples: ['NIMC', 'FIRS', 'Immigration', 'Police'],
      data_access_level: 'full',
      verification_required: 'government_certificate',
      monthly_fee_ngn: 0               // Government entities don't pay
    },
    tier2: {
      name: 'Financial Institutions',
      examples: ['Banks', 'Fintechs', 'Insurance'],
      data_access_level: 'financial',
      verification_required: 'cbn_license',  // Central Bank of Nigeria license
      monthly_fee_ngn: 500000          // ₦500,000 per month
    },
    tier3: {
      name: 'Commercial Entities',
      examples: ['E-commerce', 'Telecom', 'Healthcare'],
      data_access_level: 'basic',
      verification_required: 'cac_registration',  // Corporate Affairs Commission
      monthly_fee_ngn: 100000          // ₦100,000 per month
    }
  },

  /**
   * Security - Nigerian-Specific Settings
   */
  security: {
    // Biometric hashing
    pff: {
      algorithm: 'HMAC-SHA256',
      salt_rounds: 12,
      require_liveness_check: true     // Prevent spoofing with photos
    },

    // API key management
    api_keys: {
      rotation_days: 90,               // Rotate API keys every 90 days
      min_length: 32,
      require_ip_whitelist: true       // Tier 1 & 2 must whitelist IPs
    },

    // Audit logging
    audit: {
      log_all_access: true,
      retention_days: 365,
      real_time_alerts: true           // Alert on suspicious activity
    }
  },

  /**
   * Features - Nigerian Spoke Specific
   */
  features: {
    // Mobile money integration
    mobile_money: {
      enabled: true,
      providers: ['MTN', 'Airtel', 'Glo', '9mobile'],
      sov_to_ngn_enabled: false        // Token-to-Naira conversion (future)
    },

    // USSD support for feature phones
    ussd: {
      enabled: true,
      shortcode: '*347*768#',          // *347*SOV#
      supported_operations: ['balance', 'consent', 'history']
    },

    // Offline verification
    offline_mode: {
      enabled: true,
      sync_interval_hours: 24,
      max_offline_duration_days: 7
    }
  }
};

/**
 * Environment-specific overrides
 */
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    return {
      ...NigeriaConfig,
      infrastructure: {
        ...NigeriaConfig.infrastructure,
        api: {
          ...NigeriaConfig.infrastructure.api,
          base_url: 'https://api.nigeria.sovrn.protocol'
        }
      }
    };
  }

  if (env === 'development') {
    return {
      ...NigeriaConfig,
      infrastructure: {
        ...NigeriaConfig.infrastructure,
        api: {
          ...NigeriaConfig.infrastructure.api,
          base_url: 'http://localhost:3000'
        }
      },
      compliance: {
        ...NigeriaConfig.compliance,
        nimc: {
          ...NigeriaConfig.compliance.nimc,
          enabled: false  // Disable NIMC integration in dev
        }
      }
    };
  }

  return NigeriaConfig;
};

export default getConfig();

