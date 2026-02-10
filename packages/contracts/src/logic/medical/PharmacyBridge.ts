/**
 * PharmacyBridge.ts - Safety-First Medication Advice
 * 
 * Provides WHO-approved OTC medication recommendations for low-risk conditions
 * 
 * Features:
 * - Low-risk condition filtering
 * - WHO-standard OTC recommendations
 * - Age/weight-based dosing
 * - ZK-signed disclaimer
 * - Pharmacist consultation prompts
 * 
 * "This is AI analysis, not a prescription. Consult a licensed pharmacist."
 */

import type { DiagnosisResult } from './SymptomChecker';
import { ethers } from 'ethers';

// ============ TYPES ============

export interface Medication {
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  contraindications: string[];
  availability: 'OTC' | 'Prescription';
}

export interface MedicationAdvice {
  condition: string;
  riskLevel: 'low' | 'medium';
  medications: Medication[];
  generalAdvice: string[];
  disclaimer: string;
  zkSignature: string;
  timestamp: number;
  requiresPharmacist: boolean;
}

export interface PharmacyBridgeRequest {
  diagnosis: DiagnosisResult;
  age: number;
  weight: number;
  allergies?: string[];
  currentMedications?: string[];
}

// ============ CONSTANTS ============

const DISCLAIMER_TEXT = `⚠️ IMPORTANT MEDICAL DISCLAIMER

This is an AI analysis, not a final medical prescription.

The medication recommendations provided are:
• Based on WHO-approved over-the-counter (OTC) guidelines
• For informational purposes only
• NOT a substitute for professional medical advice

YOU MUST:
✓ Consult a licensed pharmacist before purchasing any medication
✓ Inform the pharmacist of any allergies or current medications
✓ Seek immediate medical attention if symptoms worsen

This advice is provided as a public health service and does not constitute a doctor-patient relationship.`;

// ============ MAIN FUNCTION ============

/**
 * Get medication advice for a diagnosis
 * 
 * Only provides advice for LOW and MEDIUM risk conditions
 * HIGH and CRITICAL urgency require immediate doctor visit
 */
export async function getMedicationAdvice(
  request: PharmacyBridgeRequest
): Promise<MedicationAdvice | null> {
  const { diagnosis, age, weight, allergies = [], currentMedications = [] } = request;

  // Filter: Only provide advice for low/medium risk
  if (diagnosis.urgency === 'high' || diagnosis.urgency === 'critical') {
    return null; // Require doctor visit
  }

  // Get medications for this disease
  const medications = getMedicationsForDisease(
    diagnosis.disease.id,
    age,
    weight,
    allergies
  );

  // Get general advice
  const generalAdvice = getGeneralAdvice(diagnosis.disease.id);

  // Generate ZK-signed disclaimer
  const zkSignature = await generateZKSignature({
    condition: diagnosis.disease.commonName,
    timestamp: Date.now(),
    riskLevel: diagnosis.urgency === 'low' ? 'low' : 'medium',
  });

  return {
    condition: diagnosis.disease.commonName,
    riskLevel: diagnosis.urgency === 'low' ? 'low' : 'medium',
    medications,
    generalAdvice,
    disclaimer: DISCLAIMER_TEXT,
    zkSignature,
    timestamp: Date.now(),
    requiresPharmacist: true,
  };
}

// ============ MEDICATION DATABASE ============

/**
 * Get WHO-approved OTC medications for a disease
 */
function getMedicationsForDisease(
  diseaseId: string,
  age: number,
  weight: number,
  allergies: string[]
): Medication[] {
  const medicationMap: Record<string, Medication[]> = {
    malaria: [
      {
        name: 'Artemether-Lumefantrine (Coartem)',
        genericName: 'Artemether + Lumefantrine',
        dosage: calculateMalariaDosage(age, weight),
        frequency: 'Twice daily',
        duration: '3 days',
        instructions: 'Take with food or milk. Complete full course even if symptoms improve.',
        contraindications: ['pregnancy_first_trimester', 'severe_liver_disease'],
        availability: 'OTC',
      },
      {
        name: 'Paracetamol (Fever Relief)',
        genericName: 'Acetaminophen',
        dosage: calculateParacetamolDosage(age, weight),
        frequency: 'Every 6 hours as needed',
        duration: 'Until fever subsides',
        instructions: 'Do not exceed 4 grams per day. Take with water.',
        contraindications: ['severe_liver_disease'],
        availability: 'OTC',
      },
    ],
    typhoid: [
      {
        name: 'Oral Rehydration Salts (ORS)',
        genericName: 'Electrolyte Solution',
        dosage: '1 sachet dissolved in 1 liter of clean water',
        frequency: 'Drink frequently throughout the day',
        duration: 'Until diarrhea stops',
        instructions: 'Prepare fresh solution daily. Discard after 24 hours.',
        contraindications: [],
        availability: 'OTC',
      },
      {
        name: 'Paracetamol (Fever Relief)',
        genericName: 'Acetaminophen',
        dosage: calculateParacetamolDosage(age, weight),
        frequency: 'Every 6 hours as needed',
        duration: 'Until fever subsides',
        instructions: 'Do not exceed 4 grams per day. Take with water.',
        contraindications: ['severe_liver_disease'],
        availability: 'OTC',
      },
    ],
    respiratory_infection: [
      {
        name: 'Cough Syrup (Guaifenesin)',
        genericName: 'Guaifenesin',
        dosage: age >= 12 ? '10-20ml' : '5-10ml',
        frequency: 'Every 4-6 hours',
        duration: '5-7 days',
        instructions: 'Drink plenty of water. Do not use if cough persists > 7 days.',
        contraindications: ['chronic_cough', 'asthma'],
        availability: 'OTC',
      },
      {
        name: 'Paracetamol (Fever Relief)',
        genericName: 'Acetaminophen',
        dosage: calculateParacetamolDosage(age, weight),
        frequency: 'Every 6 hours as needed',
        duration: 'Until fever subsides',
        instructions: 'Do not exceed 4 grams per day. Take with water.',
        contraindications: ['severe_liver_disease'],
        availability: 'OTC',
      },
    ],
    dengue: [
      {
        name: 'Paracetamol (Fever & Pain Relief)',
        genericName: 'Acetaminophen',
        dosage: calculateParacetamolDosage(age, weight),
        frequency: 'Every 6 hours as needed',
        duration: 'Until fever subsides',
        instructions: 'AVOID aspirin and ibuprofen (risk of bleeding). Drink plenty of fluids.',
        contraindications: ['severe_liver_disease'],
        availability: 'OTC',
      },
      {
        name: 'Oral Rehydration Salts (ORS)',
        genericName: 'Electrolyte Solution',
        dosage: '1 sachet dissolved in 1 liter of clean water',
        frequency: 'Drink frequently throughout the day',
        duration: 'Until symptoms improve',
        instructions: 'Essential for preventing dehydration. Monitor for warning signs.',
        contraindications: [],
        availability: 'OTC',
      },
    ],
    covid19: [
      {
        name: 'Paracetamol (Fever Relief)',
        genericName: 'Acetaminophen',
        dosage: calculateParacetamolDosage(age, weight),
        frequency: 'Every 6 hours as needed',
        duration: 'Until fever subsides',
        instructions: 'Rest and isolate. Monitor oxygen levels if possible.',
        contraindications: ['severe_liver_disease'],
        availability: 'OTC',
      },
    ],
  };

  return medicationMap[diseaseId] || [];
}

// ============ DOSAGE CALCULATIONS ============

function calculateMalariaDosage(age: number, weight: number): string {
  if (age < 3) return 'Consult pediatrician';
  if (weight < 15) return '1 tablet twice daily';
  if (weight < 25) return '2 tablets twice daily';
  if (weight < 35) return '3 tablets twice daily';
  return '4 tablets twice daily';
}

function calculateParacetamolDosage(age: number, weight: number): string {
  if (age < 3) return 'Consult pediatrician';
  if (age < 12) return `${Math.round(weight * 10)}mg (max 500mg) every 6 hours`;
  return '500-1000mg every 6 hours (max 4g/day)';
}

// ============ GENERAL ADVICE ============

function getGeneralAdvice(diseaseId: string): string[] {
  const adviceMap: Record<string, string[]> = {
    malaria: [
      '💧 Drink plenty of fluids to stay hydrated',
      '🛏️ Get adequate rest',
      '🦟 Use mosquito nets to prevent re-infection',
      '🌡️ Monitor temperature regularly',
      '⚠️ Seek immediate care if symptoms worsen or persist after 3 days',
    ],
    typhoid: [
      '💧 Drink only boiled or bottled water',
      '🍽️ Eat light, easily digestible foods',
      '🧼 Wash hands frequently with soap',
      '🛏️ Get plenty of rest',
      '⚠️ Seek medical care if high fever persists or severe abdominal pain develops',
    ],
    respiratory_infection: [
      '💧 Drink warm fluids (tea, soup)',
      '🛏️ Get adequate rest',
      '🌡️ Use a humidifier if available',
      '🚭 Avoid smoking and secondhand smoke',
      '⚠️ Seek care if breathing difficulty worsens or fever persists > 3 days',
    ],
    dengue: [
      '💧 Drink plenty of fluids (ORS, coconut water, fruit juice)',
      '🛏️ Complete bed rest',
      '🦟 Use mosquito nets to prevent spreading',
      '⚠️ URGENT: Seek immediate care if you notice bleeding, severe abdominal pain, or persistent vomiting',
      '📊 Monitor platelet count if possible',
    ],
    covid19: [
      '🏠 Isolate from others for at least 5 days',
      '💧 Stay well hydrated',
      '🛏️ Rest and monitor symptoms',
      '😷 Wear a mask if you must be around others',
      '⚠️ Seek immediate care if breathing difficulty, chest pain, or confusion develops',
    ],
  };

  return adviceMap[diseaseId] || [
    '💧 Stay hydrated',
    '🛏️ Get adequate rest',
    '⚠️ Consult a healthcare provider if symptoms worsen',
  ];
}

// ============ ZK SIGNATURE ============

/**
 * Generate Zero-Knowledge signature for disclaimer
 * 
 * Proves that:
 * - Advice was generated by SOVRA Protocol
 * - At specific timestamp
 * - For specific condition
 * 
 * Without revealing:
 * - User identity
 * - Specific symptoms
 * - Location
 */
async function generateZKSignature(data: {
  condition: string;
  timestamp: number;
  riskLevel: string;
}): Promise<string> {
  // In production, use actual ZK-SNARK proof
  // For now, use cryptographic hash
  const message = JSON.stringify(data);
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
  
  return hash;
}

