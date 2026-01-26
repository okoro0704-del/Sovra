// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Notification Service
//
// Sends push notifications to users for dividend distributions and payments.
// Integrates with Firebase Cloud Messaging (FCM) for mobile notifications.

package wallet

import (
	"context"
	"fmt"
	"time"
)

// DeviceToken represents a user's device registration
type DeviceToken struct {
	DID         string    `json:"did"`
	DeviceID    string    `json:"device_id"`
	Token       string    `json:"token"`        // FCM token
	Platform    string    `json:"platform"`     // "ios", "android"
	RegisteredAt time.Time `json:"registered_at"`
}

// FCMClient defines the interface for Firebase Cloud Messaging
type FCMClient interface {
	// Send sends a push notification to a device
	Send(ctx context.Context, token string, title string, body string, data map[string]string) error
}

// MockFCMClient is a mock implementation for development
type MockFCMClient struct{}

// Send sends a mock notification (prints to console)
func (m *MockFCMClient) Send(ctx context.Context, token string, title string, body string, data map[string]string) error {
	fmt.Printf("📱 PUSH NOTIFICATION\n")
	fmt.Printf("   To: %s\n", token)
	fmt.Printf("   Title: %s\n", title)
	fmt.Printf("   Body: %s\n", body)
	if len(data) > 0 {
		fmt.Printf("   Data: %v\n", data)
	}
	return nil
}

// NotificationServiceImpl implements NotificationService
type NotificationServiceImpl struct {
	fcmClient    FCMClient
	deviceTokens map[string]*DeviceToken // DID -> DeviceToken
}

// NewNotificationService creates a new notification service
func NewNotificationService(fcmClient FCMClient) *NotificationServiceImpl {
	return &NotificationServiceImpl{
		fcmClient:    fcmClient,
		deviceTokens: make(map[string]*DeviceToken),
	}
}

// NewMockNotificationService creates a mock notification service for development
func NewMockNotificationService() *NotificationServiceImpl {
	return NewNotificationService(&MockFCMClient{})
}

// RegisterDevice registers a device token for a DID
func (ns *NotificationServiceImpl) RegisterDevice(did string, deviceID string, token string, platform string) error {
	ns.deviceTokens[did] = &DeviceToken{
		DID:          did,
		DeviceID:     deviceID,
		Token:        token,
		Platform:     platform,
		RegisteredAt: time.Now(),
	}

	fmt.Printf("✅ Device registered for %s: %s (%s)\n", did, deviceID, platform)
	return nil
}

// SendDividendNotification sends a dividend notification to a user
//
// MESSAGE: "You have received your SOVRA Integrity Dividend!"
//
// PARAMETERS:
// - did: User's decentralized identifier
// - amount: Dividend amount in uSOV
func (ns *NotificationServiceImpl) SendDividendNotification(ctx context.Context, did string, amount int64) error {
	// 1. Get user's device token
	deviceToken, exists := ns.deviceTokens[did]
	if !exists {
		// User hasn't registered a device - skip notification
		fmt.Printf("   ℹ️  No device registered for %s, skipping notification\n", did)
		return nil
	}

	// 2. Format amount (convert uSOV to SOV)
	sovAmount := float64(amount) / 1_000_000

	// 3. Create notification message
	title := "SOVRA Integrity Dividend"
	body := fmt.Sprintf("You have received your SOVRA Integrity Dividend! Amount: %.6f SOV", sovAmount)

	// 4. Additional data payload
	data := map[string]string{
		"type":       "integrity_dividend",
		"amount":     fmt.Sprintf("%d", amount),
		"sov_amount": fmt.Sprintf("%.6f", sovAmount),
		"timestamp":  time.Now().Format(time.RFC3339),
	}

	// 5. Send push notification via FCM
	err := ns.fcmClient.Send(ctx, deviceToken.Token, title, body, data)
	if err != nil {
		return fmt.Errorf("failed to send FCM notification: %w", err)
	}

	return nil
}

// SendPaymentNotification sends a payment confirmation notification
//
// PARAMETERS:
// - did: User's decentralized identifier
// - txType: Transaction type (fast_track, standard)
// - amount: Payment amount in uSOV
// - balanceAfter: Remaining balance in uSOV
func (ns *NotificationServiceImpl) SendPaymentNotification(ctx context.Context, did string, txType TransactionType, amount int64, balanceAfter int64) error {
	// 1. Get user's device token
	deviceToken, exists := ns.deviceTokens[did]
	if !exists {
		// User hasn't registered a device - skip notification
		return nil
	}

	// 2. Format amounts
	sovAmount := float64(amount) / 1_000_000
	sovBalance := float64(balanceAfter) / 1_000_000

	// 3. Create notification message
	title := "SOVRA Payment Confirmed"
	body := fmt.Sprintf("Biometric payment successful: %.6f SOV. Remaining balance: %.6f SOV", sovAmount, sovBalance)

	// 4. Additional data payload
	data := map[string]string{
		"type":           "biometric_payment",
		"transaction_type": string(txType),
		"amount":         fmt.Sprintf("%d", amount),
		"balance_after":  fmt.Sprintf("%d", balanceAfter),
		"timestamp":      time.Now().Format(time.RFC3339),
	}

	// 5. Send push notification via FCM
	err := ns.fcmClient.Send(ctx, deviceToken.Token, title, body, data)
	if err != nil {
		return fmt.Errorf("failed to send FCM notification: %w", err)
	}

	return nil
}

