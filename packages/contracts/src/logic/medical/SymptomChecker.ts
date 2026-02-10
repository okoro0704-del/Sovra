/**
 * SymptomChecker.ts - Sentinel AI
 * 
 * Probabilistic mapping between PFF data and common local diseases
 * 
 * Diseases:
 * - Malaria
 * - Typhoid
 * - Respiratory Infection
 * - Dengue Fever
 * - COVID-19
 * 
 * "Glass-Box AI: We always explain WHY."
 */

import type { VitalSigns } from '@vitalia/pff-engine/src/VitalsMonitor';

// ============ TYPES ============

export interface Symptom {
  id: string;
  name: string;
  category: 'general' | 'respiratory' | 'digestive' | 'neurological' | 'skin';
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Disease {
  id: string;
  name: string;
  commonName: string;
  description: string;
  prevalence: number; // 0-1 (how common in Nigeria/Ghana)
}

export interface DiagnosisResult {
  disease: Disease;
  probability: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[]; // Glass-box explanation
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface SymptomCheckRequest {
  symptoms: string[]; // Symptom IDs
  vitals: VitalSigns;
  age: number;
  weight: number;
  location: string; // For regional disease prevalence
}

// ============ SYMPTOM DATABASE ============

export const SYMPTOMS: Symptom[] = [
  // General
  { id: 'fever', name: 'Fever', category: 'general', severity: 'moderate' },
  { id: 'chills', name: 'Chills', category: 'general', severity: 'moderate' },
  { id: 'fatigue', name: 'Fatigue/Weakness', category: 'general', severity: 'mild' },
  { id: 'headache', name: 'Headache', category: 'general', severity: 'mild' },
  { id: 'body_aches', name: 'Body Aches', category: 'general', severity: 'mild' },
  { id: 'sweating', name: 'Excessive Sweating', category: 'general', severity: 'mild' },
  
  // Respiratory
  { id: 'cough', name: 'Cough', category: 'respiratory', severity: 'mild' },
  { id: 'shortness_breath', name: 'Shortness of Breath', category: 'respiratory', severity: 'severe' },
  { id: 'chest_pain', name: 'Chest Pain', category: 'respiratory', severity: 'severe' },
  { id: 'sore_throat', name: 'Sore Throat', category: 'respiratory', severity: 'mild' },
  { id: 'runny_nose', name: 'Runny Nose', category: 'respiratory', severity: 'mild' },
  
  // Digestive
  { id: 'nausea', name: 'Nausea', category: 'digestive', severity: 'moderate' },
  { id: 'vomiting', name: 'Vomiting', category: 'digestive', severity: 'moderate' },
  { id: 'diarrhea', name: 'Diarrhea', category: 'digestive', severity: 'moderate' },
  { id: 'abdominal_pain', name: 'Abdominal Pain', category: 'digestive', severity: 'moderate' },
  { id: 'loss_appetite', name: 'Loss of Appetite', category: 'digestive', severity: 'mild' },
  
  // Neurological
  { id: 'confusion', name: 'Confusion', category: 'neurological', severity: 'severe' },
  { id: 'dizziness', name: 'Dizziness', category: 'neurological', severity: 'moderate' },
  
  // Skin
  { id: 'rash', name: 'Skin Rash', category: 'skin', severity: 'mild' },
  { id: 'jaundice', name: 'Yellowing of Skin/Eyes', category: 'skin', severity: 'severe' },
];

// ============ DISEASE DATABASE ============

export const DISEASES: Disease[] = [
  {
    id: 'malaria',
    name: 'Malaria',
    commonName: 'Malaria',
    description: 'Mosquito-borne parasitic infection common in tropical regions',
    prevalence: 0.8, // Very common in Nigeria/Ghana
  },
  {
    id: 'typhoid',
    name: 'Typhoid Fever',
    commonName: 'Typhoid',
    description: 'Bacterial infection from contaminated food/water',
    prevalence: 0.6,
  },
  {
    id: 'respiratory_infection',
    name: 'Respiratory Tract Infection',
    commonName: 'Respiratory Infection',
    description: 'Infection of airways, lungs, or sinuses',
    prevalence: 0.7,
  },
  {
    id: 'dengue',
    name: 'Dengue Fever',
    commonName: 'Dengue',
    description: 'Mosquito-borne viral infection',
    prevalence: 0.3,
  },
  {
    id: 'covid19',
    name: 'COVID-19',
    commonName: 'COVID-19',
    description: 'Coronavirus respiratory illness',
    prevalence: 0.4,
  },
];

// ============ PROBABILISTIC MAPPING ============

/**
 * Calculate disease probability based on symptoms and vitals
 * 
 * Uses Bayesian-inspired approach with:
 * - Symptom matching
 * - Vital sign correlation
 * - Regional prevalence
 * - Glass-box reasoning
 */
export function checkSymptoms(request: SymptomCheckRequest): DiagnosisResult[] {
  const results: DiagnosisResult[] = [];
  
  for (const disease of DISEASES) {
    const result = calculateDiseaseProbability(disease, request);
    results.push(result);
  }
  
  // Sort by probability (highest first)
  results.sort((a, b) => b.probability - a.probability);
  
  // Return top 3
  return results.slice(0, 3);
}

/**
 * Calculate probability for a specific disease
 */
function calculateDiseaseProbability(
  disease: Disease,
  request: SymptomCheckRequest
): DiagnosisResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;
  
  // Base score from prevalence
  score += disease.prevalence * 20;
  maxScore += 20;
  reasoning.push(`${disease.commonName} is ${getPrevalenceText(disease.prevalence)} in your region`);
  
  // Symptom matching
  const symptomScore = matchSymptoms(disease, request.symptoms, reasoning);
  score += symptomScore.score;
  maxScore += symptomScore.maxScore;
  
  // Vital signs correlation
  const vitalScore = matchVitals(disease, request.vitals, reasoning);
  score += vitalScore.score;
  maxScore += vitalScore.maxScore;
  
  // Calculate probability (0-100)
  const probability = Math.round((score / maxScore) * 100);
  
  // Determine confidence
  const confidence = getConfidence(probability, request.symptoms.length);
  
  // Determine urgency
  const urgency = getUrgency(disease, request.vitals, request.symptoms);
  
  return {
    disease,
    probability,
    confidence,
    reasoning,
    urgency,
  };
}

/**
 * Match symptoms to disease
 */
function matchSymptoms(
  disease: Disease,
  symptoms: string[],
  reasoning: string[]
): { score: number; maxScore: number } {
  let score = 0;
  const maxScore = 50;
  
  // Disease-specific symptom patterns
  const patterns = getSymptomPatterns(disease.id);
  
  let matchCount = 0;
  for (const symptom of symptoms) {
    if (patterns.primary.includes(symptom)) {
      score += 15;
      matchCount++;
    } else if (patterns.secondary.includes(symptom)) {
      score += 5;
      matchCount++;
    }
  }
  
  if (matchCount > 0) {
    reasoning.push(`${matchCount} of your symptoms match ${disease.commonName}`);
  }
  
  return { score: Math.min(score, maxScore), maxScore };
}

/**
 * Match vital signs to disease
 */
function matchVitals(
  disease: Disease,
  vitals: VitalSigns,
  reasoning: string[]
): { score: number; maxScore: number } {
  let score = 0;
  const maxScore = 30;
  
  // High fever indicator (elevated BPM)
  if (vitals.bpm > 100) {
    if (['malaria', 'typhoid', 'dengue', 'covid19'].includes(disease.id)) {
      score += 10;
      reasoning.push(`Your elevated heart rate (${vitals.bpm} BPM) suggests fever, common in ${disease.commonName}`);
    }
  }
  
  // Low oxygen (respiratory issues)
  if (vitals.spO2 > 0 && vitals.spO2 < 95) {
    if (['respiratory_infection', 'covid19'].includes(disease.id)) {
      score += 15;
      reasoning.push(`Your low oxygen level (${vitals.spO2}%) indicates respiratory involvement`);
    }
  }
  
  // Rapid breathing
  if (vitals.respiratoryRate > 20) {
    if (['respiratory_infection', 'covid19', 'malaria'].includes(disease.id)) {
      score += 5;
      reasoning.push(`Your rapid breathing (${vitals.respiratoryRate}/min) may indicate infection`);
    }
  }
  
  return { score: Math.min(score, maxScore), maxScore };
}

// ============ HELPER FUNCTIONS ============

function getSymptomPatterns(diseaseId: string): { primary: string[]; secondary: string[] } {
  const patterns: Record<string, { primary: string[]; secondary: string[] }> = {
    malaria: {
      primary: ['fever', 'chills', 'sweating', 'headache'],
      secondary: ['fatigue', 'body_aches', 'nausea', 'vomiting'],
    },
    typhoid: {
      primary: ['fever', 'headache', 'abdominal_pain', 'loss_appetite'],
      secondary: ['fatigue', 'diarrhea', 'body_aches'],
    },
    respiratory_infection: {
      primary: ['cough', 'sore_throat', 'shortness_breath', 'chest_pain'],
      secondary: ['fever', 'fatigue', 'headache', 'runny_nose'],
    },
    dengue: {
      primary: ['fever', 'headache', 'body_aches', 'rash'],
      secondary: ['fatigue', 'nausea', 'vomiting'],
    },
    covid19: {
      primary: ['fever', 'cough', 'shortness_breath', 'fatigue'],
      secondary: ['headache', 'body_aches', 'sore_throat', 'loss_appetite'],
    },
  };
  
  return patterns[diseaseId] || { primary: [], secondary: [] };
}

function getPrevalenceText(prevalence: number): string {
  if (prevalence > 0.7) return 'very common';
  if (prevalence > 0.5) return 'common';
  if (prevalence > 0.3) return 'moderately common';
  return 'less common';
}

function getConfidence(probability: number, symptomCount: number): 'low' | 'medium' | 'high' {
  if (symptomCount < 2) return 'low';
  if (probability > 70 && symptomCount >= 3) return 'high';
  if (probability > 50) return 'medium';
  return 'low';
}

function getUrgency(disease: Disease, vitals: VitalSigns, symptoms: string[]): 'low' | 'medium' | 'high' | 'critical' {
  // Critical if low oxygen or very high heart rate
  if ((vitals.spO2 > 0 && vitals.spO2 < 92) || vitals.bpm > 120) {
    return 'critical';
  }
  
  // High if severe symptoms
  if (symptoms.includes('shortness_breath') || symptoms.includes('chest_pain') || symptoms.includes('confusion')) {
    return 'high';
  }
  
  // Medium for most infectious diseases
  if (['malaria', 'typhoid', 'dengue'].includes(disease.id)) {
    return 'medium';
  }
  
  return 'low';
}

