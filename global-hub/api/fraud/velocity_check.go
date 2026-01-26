package fraud

import (
	"context"
	"fmt"
	"math"
	"time"
)

// VelocityCheck detects impossible travel patterns
// If a DID attempts verifications in different locations faster than
// physically possible, flag for manual step-up verification
type VelocityCheck struct {
	// Store recent verification locations
	// In production, use Redis or PostgreSQL
	recentVerifications map[string][]VerificationLocation
}

// VerificationLocation tracks where and when a verification occurred
type VerificationLocation struct {
	DID       string
	Latitude  float64
	Longitude float64
	Timestamp time.Time
	Location  string // Human-readable location (e.g., "JFK Airport, New York")
}

// VelocityCheckResult contains the result of velocity analysis
type VelocityCheckResult struct {
	Passed              bool
	RequiresStepUp      bool
	Reason              string
	PreviousLocation    string
	CurrentLocation     string
	DistanceKm          float64
	TimeDeltaMinutes    float64
	RequiredSpeedKmh    float64
	MaxPlaneSpeedKmh    float64
	ImpossibleTravel    bool
}

// NewVelocityCheck creates a new velocity checker
func NewVelocityCheck() *VelocityCheck {
	return &VelocityCheck{
		recentVerifications: make(map[string][]VerificationLocation),
	}
}

// CheckVelocity analyzes if travel between locations is physically possible
func (vc *VelocityCheck) CheckVelocity(
	ctx context.Context,
	did string,
	latitude float64,
	longitude float64,
	location string,
) (*VelocityCheckResult, error) {
	
	currentTime := time.Now()
	currentLocation := VerificationLocation{
		DID:       did,
		Latitude:  latitude,
		Longitude: longitude,
		Timestamp: currentTime,
		Location:  location,
	}
	
	// Get recent verifications for this DID
	recentVerifs, exists := vc.recentVerifications[did]
	
	// First verification for this DID - always pass
	if !exists || len(recentVerifs) == 0 {
		vc.recordVerification(did, currentLocation)
		return &VelocityCheckResult{
			Passed:         true,
			RequiresStepUp: false,
			Reason:         "First verification for this DID",
		}, nil
	}
	
	// Get most recent verification
	lastVerif := recentVerifs[len(recentVerifs)-1]
	
	// Calculate distance between locations (Haversine formula)
	distanceKm := vc.calculateDistance(
		lastVerif.Latitude, lastVerif.Longitude,
		latitude, longitude,
	)
	
	// Calculate time delta
	timeDelta := currentTime.Sub(lastVerif.Timestamp)
	timeDeltaMinutes := timeDelta.Minutes()
	
	// Calculate required speed to travel this distance
	requiredSpeedKmh := (distanceKm / timeDelta.Hours())
	
	// Maximum commercial aircraft speed: ~900 km/h (Mach 0.85)
	// Add 10% buffer for supersonic flights and measurement error
	maxPlaneSpeedKmh := 990.0
	
	// Check if travel is impossible
	impossibleTravel := requiredSpeedKmh > maxPlaneSpeedKmh
	
	// Record this verification
	vc.recordVerification(did, currentLocation)
	
	if impossibleTravel {
		return &VelocityCheckResult{
			Passed:           false,
			RequiresStepUp:   true,
			Reason:           fmt.Sprintf("Impossible travel detected: %.0f km in %.0f minutes requires %.0f km/h (max plane speed: %.0f km/h)", distanceKm, timeDeltaMinutes, requiredSpeedKmh, maxPlaneSpeedKmh),
			PreviousLocation: lastVerif.Location,
			CurrentLocation:  location,
			DistanceKm:       distanceKm,
			TimeDeltaMinutes: timeDeltaMinutes,
			RequiredSpeedKmh: requiredSpeedKmh,
			MaxPlaneSpeedKmh: maxPlaneSpeedKmh,
			ImpossibleTravel: true,
		}, nil
	}
	
	return &VelocityCheckResult{
		Passed:           true,
		RequiresStepUp:   false,
		Reason:           "Travel velocity is physically possible",
		PreviousLocation: lastVerif.Location,
		CurrentLocation:  location,
		DistanceKm:       distanceKm,
		TimeDeltaMinutes: timeDeltaMinutes,
		RequiredSpeedKmh: requiredSpeedKmh,
		MaxPlaneSpeedKmh: maxPlaneSpeedKmh,
		ImpossibleTravel: false,
	}, nil
}

// calculateDistance uses Haversine formula to calculate distance between two points
func (vc *VelocityCheck) calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0
	
	// Convert to radians
	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180
	
	// Haversine formula
	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad
	
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	
	return earthRadiusKm * c
}

// recordVerification stores a verification location
func (vc *VelocityCheck) recordVerification(did string, location VerificationLocation) {
	if _, exists := vc.recentVerifications[did]; !exists {
		vc.recentVerifications[did] = []VerificationLocation{}
	}
	
	vc.recentVerifications[did] = append(vc.recentVerifications[did], location)
	
	// Keep only last 10 verifications per DID
	if len(vc.recentVerifications[did]) > 10 {
		vc.recentVerifications[did] = vc.recentVerifications[did][1:]
	}
}

