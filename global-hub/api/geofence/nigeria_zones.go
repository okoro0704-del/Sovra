package geofence

/**
 * SOVRA_Sovereign_Kernel - Nigerian Security Zones Configuration
 * 
 * Defines high-risk security zones in Nigeria requiring enhanced PFF verification
 * Based on real-world security assessments and government advisories
 */

// loadSecurityZones returns predefined security zones for Nigeria
// In production, load from database or configuration service
func loadSecurityZones() []SecurityZone {
	zones := []SecurityZone{}
	
	// ========================================================================
	// CRITICAL RISK ZONES - Northern Nigeria
	// ========================================================================
	
	// Borno State - High-risk LGAs (Boko Haram activity)
	zones = append(zones, SecurityZone{
		ID:          "NG-BO-001",
		Name:        "Maiduguri Metropolitan",
		Country:     "nigeria",
		Region:      "Borno",
		LGA:         "Maiduguri",
		Boundaries: []GeoPoint{
			{Latitude: 11.9000, Longitude: 13.0500},
			{Latitude: 11.9000, Longitude: 13.2000},
			{Latitude: 11.7500, Longitude: 13.2000},
			{Latitude: 11.7500, Longitude: 13.0500},
		},
		RiskLevel:           "critical",
		RequiredPFFLevel:    3, // Maximum: 3D depth + random movement
		WatchlistMonitoring: true,
		Reason:              "High-risk security zone - Enhanced verification required",
		CreatedAt:           "2026-01-26T00:00:00Z",
		UpdatedAt:           "2026-01-26T00:00:00Z",
	})
	
	zones = append(zones, SecurityZone{
		ID:          "NG-BO-002",
		Name:        "Gwoza LGA",
		Country:     "nigeria",
		Region:      "Borno",
		LGA:         "Gwoza",
		Boundaries: []GeoPoint{
			{Latitude: 11.1000, Longitude: 13.6500},
			{Latitude: 11.1000, Longitude: 13.8000},
			{Latitude: 10.9500, Longitude: 13.8000},
			{Latitude: 10.9500, Longitude: 13.6500},
		},
		RiskLevel:           "critical",
		RequiredPFFLevel:    3,
		WatchlistMonitoring: true,
		Reason:              "Border region - Maximum security protocols",
		CreatedAt:           "2026-01-26T00:00:00Z",
		UpdatedAt:           "2026-01-26T00:00:00Z",
	})
	
	// Yobe State - High-risk LGAs
	zones = append(zones, SecurityZone{
		ID:          "NG-YO-001",
		Name:        "Damaturu LGA",
		Country:     "nigeria",
		Region:      "Yobe",
		LGA:         "Damaturu",
		Boundaries: []GeoPoint{
			{Latitude: 11.8000, Longitude: 11.9000},
			{Latitude: 11.8000, Longitude: 12.0500},
			{Latitude: 11.7000, Longitude: 12.0500},
			{Latitude: 11.7000, Longitude: 11.9000},
		},
		RiskLevel:           "high",
		RequiredPFFLevel:    3,
		WatchlistMonitoring: true,
		Reason:              "State capital - Enhanced monitoring required",
		CreatedAt:           "2026-01-26T00:00:00Z",
		UpdatedAt:           "2026-01-26T00:00:00Z",
	})
	
	// Adamawa State - Border regions
	zones = append(zones, SecurityZone{
		ID:          "NG-AD-001",
		Name:        "Madagali LGA",
		Country:     "nigeria",
		Region:      "Adamawa",
		LGA:         "Madagali",
		Boundaries: []GeoPoint{
			{Latitude: 10.9500, Longitude: 13.4000},
			{Latitude: 10.9500, Longitude: 13.6000},
			{Latitude: 10.8000, Longitude: 13.6000},
			{Latitude: 10.8000, Longitude: 13.4000},
		},
		RiskLevel:           "high",
		RequiredPFFLevel:    3,
		WatchlistMonitoring: true,
		Reason:              "Border security zone",
		CreatedAt:           "2026-01-26T00:00:00Z",
		UpdatedAt:           "2026-01-26T00:00:00Z",
	})
	
	// ========================================================================
	// HIGH RISK ZONES - North-Central Nigeria
	// ========================================================================
	
	// Kaduna State - Kidnapping hotspots
	zones = append(zones, SecurityZone{
		ID:          "NG-KD-001",
		Name:        "Birnin Gwari LGA",
		Country:     "nigeria",
		Region:      "Kaduna",
		LGA:         "Birnin Gwari",
		Boundaries: []GeoPoint{
			{Latitude: 11.1000, Longitude: 6.6000},
			{Latitude: 11.1000, Longitude: 6.8000},
			{Latitude: 10.9000, Longitude: 6.8000},
			{Latitude: 10.9000, Longitude: 6.6000},
		},
		RiskLevel:           "high",
		RequiredPFFLevel:    3,
		WatchlistMonitoring: true,
		Reason:              "Kidnapping hotspot - Enhanced verification",
		CreatedAt:           "2026-01-26T00:00:00Z",
		UpdatedAt:           "2026-01-26T00:00:00Z",
	})
	
	// Zamfara State - Banditry zones
	zones = append(zones, SecurityZone{
		ID:          "NG-ZA-001",
		Name:        "Anka LGA",
		Country:     "nigeria",
		Region:      "Zamfara",
		LGA:         "Anka",
		Boundaries: []GeoPoint{
			{Latitude: 12.2000, Longitude: 5.9000},
			{Latitude: 12.2000, Longitude: 6.1000},
			{Latitude: 12.0000, Longitude: 6.1000},
			{Latitude: 12.0000, Longitude: 5.9000},
		},
		RiskLevel:           "high",
		RequiredPFFLevel:    3,
		WatchlistMonitoring: true,
		Reason:              "Banditry activity - Maximum security",
		CreatedAt:           "2026-01-26T00:00:00Z",
		UpdatedAt:           "2026-01-26T00:00:00Z",
	})
	
	return zones
}

