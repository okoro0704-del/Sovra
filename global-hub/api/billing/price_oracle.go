package billing

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// PriceOracle provides real-time SOV/Fiat exchange rates
// This is a MOCK implementation - in production, integrate with real price feeds
// (e.g., Chainlink, Band Protocol, or centralized exchanges)
type PriceOracle struct {
	// Current exchange rates (uSOV per unit of fiat)
	rates map[string]float64
	mu    sync.RWMutex

	// Last update timestamp
	lastUpdate time.Time

	// Update interval
	updateInterval time.Duration

	// Price volatility simulation (for mock)
	baseRates map[string]float64
}

// ExchangeRate represents a fiat-to-SOV exchange rate
type ExchangeRate struct {
	Currency      string    `json:"currency"`
	USOVPerUnit   float64   `json:"usov_per_unit"`
	SOVPerUnit    float64   `json:"sov_per_unit"`
	LastUpdated   time.Time `json:"last_updated"`
	Source        string    `json:"source"`
	Confidence    float64   `json:"confidence"` // 0.0 to 1.0
}

// NewPriceOracle creates a new price oracle
func NewPriceOracle() *PriceOracle {
	oracle := &PriceOracle{
		rates:          make(map[string]float64),
		baseRates:      make(map[string]float64),
		updateInterval: 30 * time.Second, // Update every 30 seconds
	}

	// Initialize base rates (MOCK values)
	// In production, fetch from real price feeds
	oracle.baseRates["USD"] = 500000.0  // 0.5 SOV per USD (1 SOV = $2.00)
	oracle.baseRates["NGN"] = 1200.0    // 0.0012 SOV per NGN (1 SOV = ~833 NGN)
	oracle.baseRates["EUR"] = 550000.0  // 0.55 SOV per EUR
	oracle.baseRates["GBP"] = 625000.0  // 0.625 SOV per GBP

	// Initialize current rates
	for currency, rate := range oracle.baseRates {
		oracle.rates[currency] = rate
	}

	oracle.lastUpdate = time.Now()

	// Start background price updater
	go oracle.startPriceUpdater()

	return oracle
}

// GetExchangeRate returns the current exchange rate for a currency
func (po *PriceOracle) GetExchangeRate(ctx context.Context, currency string) (*ExchangeRate, error) {
	po.mu.RLock()
	defer po.mu.RUnlock()

	rate, exists := po.rates[currency]
	if !exists {
		return nil, fmt.Errorf("unsupported currency: %s", currency)
	}

	return &ExchangeRate{
		Currency:    currency,
		USOVPerUnit: rate,
		SOVPerUnit:  rate / 1000000.0, // Convert uSOV to SOV
		LastUpdated: po.lastUpdate,
		Source:      "SOVRN_ORACLE_V1", // In production: "CHAINLINK", "BAND", etc.
		Confidence:  0.95,               // Mock confidence score
	}, nil
}

// CalculateSOVAmount calculates how many uSOV you get for a fiat amount
func (po *PriceOracle) CalculateSOVAmount(ctx context.Context, currency string, fiatAmount float64) (int64, error) {
	rate, err := po.GetExchangeRate(ctx, currency)
	if err != nil {
		return 0, err
	}

	// Calculate uSOV amount
	uSOVAmount := fiatAmount * rate.USOVPerUnit

	return int64(uSOVAmount), nil
}

// CalculateFiatAmount calculates how much fiat is needed for a SOV amount
func (po *PriceOracle) CalculateFiatAmount(ctx context.Context, currency string, uSOVAmount int64) (float64, error) {
	rate, err := po.GetExchangeRate(ctx, currency)
	if err != nil {
		return 0, err
	}

	// Calculate fiat amount
	fiatAmount := float64(uSOVAmount) / rate.USOVPerUnit

	return fiatAmount, nil
}

// GetAllRates returns all supported exchange rates
func (po *PriceOracle) GetAllRates(ctx context.Context) (map[string]*ExchangeRate, error) {
	po.mu.RLock()
	defer po.mu.RUnlock()

	rates := make(map[string]*ExchangeRate)
	for currency, rate := range po.rates {
		rates[currency] = &ExchangeRate{
			Currency:    currency,
			USOVPerUnit: rate,
			SOVPerUnit:  rate / 1000000.0,
			LastUpdated: po.lastUpdate,
			Source:      "SOVRN_ORACLE_V1",
			Confidence:  0.95,
		}
	}

	return rates, nil
}

// startPriceUpdater simulates real-time price updates
// MOCK: In production, subscribe to real price feeds
func (po *PriceOracle) startPriceUpdater() {
	ticker := time.NewTicker(po.updateInterval)
	defer ticker.Stop()

	for range ticker.C {
		po.updatePrices()
	}
}

// updatePrices simulates price volatility
// MOCK: In production, fetch from real oracles
func (po *PriceOracle) updatePrices() {
	po.mu.Lock()
	defer po.mu.Unlock()

	for currency, baseRate := range po.baseRates {
		// Simulate ±2% price volatility
		volatility := (rand.Float64() - 0.5) * 0.04 // -2% to +2%
		newRate := baseRate * (1.0 + volatility)
		po.rates[currency] = newRate
	}

	po.lastUpdate = time.Now()
}

