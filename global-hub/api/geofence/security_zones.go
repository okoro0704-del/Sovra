// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY

package geofence

import (
	"fmt"
	"math"
)

/**
 * SOVRA_Sovereign_Kernel - Geofenced Security Protocol
 *
 * Core ledger security function for geographic risk assessment
 * Implements zone-based security policies for high-risk regions
 */

// SecurityZone represents a geographic area with specific security requirements
type SecurityZone struct {
	ID          string
	Name        string
	Country     string
	Region      string // State/Province
	LGA         string // Local Government Area (Nigeria-specific)
	
	// Geographic boundaries (polygon defined by vertices)
	Boundaries  []GeoPoint
	
	// Security level
	RiskLevel   string // "low", "medium", "high", "critical"
	
	// PFF requirements
	RequiredPFFLevel int // 1 = basic, 2 = enhanced, 3 = maximum (3D depth + random movement)
	
	// Watchlist monitoring
	WatchlistMonitoring bool
	
	// Metadata
	Reason      string
	CreatedAt   string
	UpdatedAt   string
}

// GeoPoint represents a latitude/longitude coordinate
type GeoPoint struct {
	Latitude  float64
	Longitude float64
}

// GeofenceService manages security zones and geographic risk assessment
type GeofenceService struct {
	securityZones []SecurityZone
}

// NewGeofenceService creates a new geofence service with predefined zones
func NewGeofenceService() *GeofenceService {
	return &GeofenceService{
		securityZones: loadSecurityZones(),
	}
}

// CheckSecurityZone determines if GPS coordinates fall within a security zone
// Returns the most restrictive zone if coordinates fall in multiple zones
func (gs *GeofenceService) CheckSecurityZone(latitude, longitude float64) (*SecurityZone, bool) {
	point := GeoPoint{Latitude: latitude, Longitude: longitude}
	
	var matchedZone *SecurityZone
	highestRiskLevel := 0
	
	for i := range gs.securityZones {
		zone := &gs.securityZones[i]
		
		if gs.isPointInPolygon(point, zone.Boundaries) {
			// Calculate risk level priority
			riskPriority := getRiskPriority(zone.RiskLevel)
			
			// Keep the highest risk zone
			if riskPriority > highestRiskLevel {
				highestRiskLevel = riskPriority
				matchedZone = zone
			}
		}
	}
	
	if matchedZone != nil {
		return matchedZone, true
	}
	
	return nil, false
}

// GetRequiredPFFLevel returns the PFF level required for given coordinates
func (gs *GeofenceService) GetRequiredPFFLevel(latitude, longitude float64) int {
	zone, inZone := gs.CheckSecurityZone(latitude, longitude)
	
	if !inZone {
		return 1 // Default: Basic PFF level
	}
	
	return zone.RequiredPFFLevel
}

// IsWatchlistMonitoringRequired checks if watchlist monitoring is required for location
func (gs *GeofenceService) IsWatchlistMonitoringRequired(latitude, longitude float64) bool {
	zone, inZone := gs.CheckSecurityZone(latitude, longitude)
	
	if !inZone {
		return false
	}
	
	return zone.WatchlistMonitoring
}

// isPointInPolygon uses ray-casting algorithm to determine if point is inside polygon
// Reference: https://en.wikipedia.org/wiki/Point_in_polygon
func (gs *GeofenceService) isPointInPolygon(point GeoPoint, polygon []GeoPoint) bool {
	if len(polygon) < 3 {
		return false
	}
	
	inside := false
	j := len(polygon) - 1
	
	for i := 0; i < len(polygon); i++ {
		xi, yi := polygon[i].Longitude, polygon[i].Latitude
		xj, yj := polygon[j].Longitude, polygon[j].Latitude
		
		intersect := ((yi > point.Latitude) != (yj > point.Latitude)) &&
			(point.Longitude < (xj-xi)*(point.Latitude-yi)/(yj-yi)+xi)
		
		if intersect {
			inside = !inside
		}
		
		j = i
	}
	
	return inside
}

// getRiskPriority converts risk level string to numeric priority
func getRiskPriority(riskLevel string) int {
	switch riskLevel {
	case "critical":
		return 4
	case "high":
		return 3
	case "medium":
		return 2
	case "low":
		return 1
	default:
		return 0
	}
}

// CalculateDistance uses Haversine formula (same as velocity check)
func CalculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180

	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

// GetZoneInfo returns human-readable information about a security zone
func (zone *SecurityZone) GetZoneInfo() string {
	return fmt.Sprintf("%s (%s, %s) - Risk: %s, PFF Level: %d",
		zone.Name, zone.LGA, zone.Region, zone.RiskLevel, zone.RequiredPFFLevel)
}

