// TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
// SOVRA_Sovereign_Kernel - Integrity Dividend Distributor
//
// Implements monthly distribution of National_Spoke_Pool funds to verified DIDs.
// Autonomous cron job that executes without human intervention.

package wallet

import (
	"context"
	"fmt"
	"time"

	"github.com/robfig/cron/v3"
)

// BlockchainAPI defines the interface for querying blockchain module accounts
type BlockchainAPI interface {
	// GetSpokePoolBalance returns the balance of a National_Spoke_Pool
	GetSpokePoolBalance(ctx context.Context, spokeID string) (int64, error)
	
	// ResetSpokePool resets a National_Spoke_Pool balance to 0 after distribution
	ResetSpokePool(ctx context.Context, spokeID string) error
	
	// GetSpokeIDs returns all active spoke IDs
	GetSpokeIDs(ctx context.Context) ([]string, error)
}

// NotificationService defines the interface for sending notifications
type NotificationService interface {
	// SendDividendNotification sends a dividend notification to a user
	SendDividendNotification(ctx context.Context, did string, amount int64) error
}

// DividendDistributor manages monthly integrity fund distribution
type DividendDistributor struct {
	vaultMgr      *SovereignVaultManager
	blockchainAPI BlockchainAPI
	notifier      NotificationService
	cronScheduler *cron.Cron
}

// NewDividendDistributor creates a new dividend distributor
func NewDividendDistributor(
	vaultMgr *SovereignVaultManager,
	blockchainAPI BlockchainAPI,
	notifier NotificationService,
) *DividendDistributor {
	return &DividendDistributor{
		vaultMgr:      vaultMgr,
		blockchainAPI: blockchainAPI,
		notifier:      notifier,
		cronScheduler: cron.New(),
	}
}

// DistributeMonthlyIntegrityFunds is the cron job function
//
// AUTONOMOUS LOGIC:
// 1. Query total balance in National_Spoke_Pool for each spoke
// 2. Get all verified DIDs (Status: "verified")
// 3. Calculate dividend per DID (total pool / number of verified DIDs)
// 4. Distribute to each verified DID
// 5. Send notification: "You have received your SOVRA Integrity Dividend!"
// 6. Reset National_Spoke_Pool balance to 0
//
// EXECUTION: First day of every month at midnight (WAT)
func (dd *DividendDistributor) DistributeMonthlyIntegrityFunds(ctx context.Context) error {
	fmt.Println("🔄 Starting Monthly Integrity Dividend Distribution...")
	startTime := time.Now()

	// Get all spoke IDs
	spokeIDs, err := dd.blockchainAPI.GetSpokeIDs(ctx)
	if err != nil {
		return fmt.Errorf("failed to get spoke IDs: %w", err)
	}

	totalDistributed := int64(0)
	totalRecipients := 0

	// Process each spoke
	for _, spokeID := range spokeIDs {
		distributed, recipients, err := dd.distributeSpokePool(ctx, spokeID)
		if err != nil {
			fmt.Printf("⚠️  Failed to distribute %s pool: %v\n", spokeID, err)
			continue
		}

		totalDistributed += distributed
		totalRecipients += recipients
	}

	executionTime := time.Since(startTime)

	fmt.Printf("✅ Monthly Integrity Dividend Distribution Complete!\n")
	fmt.Printf("   Total Distributed: %d uSOV (%.6f SOV)\n", totalDistributed, float64(totalDistributed)/1_000_000)
	fmt.Printf("   Total Recipients: %d verified DIDs\n", totalRecipients)
	fmt.Printf("   Execution Time: %v\n", executionTime)

	return nil
}

// distributeSpokePool distributes a single spoke's pool
func (dd *DividendDistributor) distributeSpokePool(ctx context.Context, spokeID string) (int64, int, error) {
	// 1. Get total balance in National_Spoke_Pool
	totalPool, err := dd.blockchainAPI.GetSpokePoolBalance(ctx, spokeID)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get pool balance: %w", err)
	}

	// Skip if pool is empty
	if totalPool == 0 {
		fmt.Printf("   %s: Pool empty, skipping\n", spokeID)
		return 0, 0, nil
	}

	// 2. Get all verified DIDs
	verifiedDIDs, err := dd.vaultMgr.GetVerifiedDIDs(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get verified DIDs: %w", err)
	}

	// Skip if no verified DIDs
	if len(verifiedDIDs) == 0 {
		fmt.Printf("   %s: No verified DIDs, skipping\n", spokeID)
		return 0, 0, nil
	}

	// 3. Calculate dividend per DID
	dividendPerDID := totalPool / int64(len(verifiedDIDs))

	fmt.Printf("   %s: Distributing %d uSOV to %d verified DIDs (%.6f SOV each)\n",
		spokeID, totalPool, len(verifiedDIDs), float64(dividendPerDID)/1_000_000)

	// 4. Distribute to each verified DID
	successCount := 0
	for _, did := range verifiedDIDs {
		// Get vault by DID
		vault, err := dd.vaultMgr.GetVaultByDID(ctx, did)
		if err != nil {
			fmt.Printf("      ⚠️  Failed to get vault for %s: %v\n", did, err)
			continue
		}

		// Credit vault
		_, err = dd.vaultMgr.CreditVault(ctx, vault.UserID, dividendPerDID, "integrity_dividend")
		if err != nil {
			fmt.Printf("      ⚠️  Failed to credit %s: %v\n", did, err)
			continue
		}

		// Send notification
		err = dd.notifier.SendDividendNotification(ctx, did, dividendPerDID)
		if err != nil {
			fmt.Printf("      ⚠️  Failed to send notification to %s: %v\n", did, err)
			// Continue even if notification fails
		}

		successCount++
	}

	// 5. Reset National_Spoke_Pool balance to 0
	err = dd.blockchainAPI.ResetSpokePool(ctx, spokeID)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to reset pool: %w", err)
	}

	return totalPool, successCount, nil
}

// SetupCronJob sets up the monthly cron job
//
// SCHEDULE: "0 0 1 * *" = First day of every month at midnight (WAT)
//
// USAGE:
//   dd := NewDividendDistributor(vaultMgr, blockchainAPI, notifier)
//   dd.SetupCronJob()
//   dd.Start()
func (dd *DividendDistributor) SetupCronJob() error {
	// Schedule: First day of every month at midnight
	// Cron format: "minute hour day-of-month month day-of-week"
	// "0 0 1 * *" = minute 0, hour 0, day 1, every month, any day of week
	_, err := dd.cronScheduler.AddFunc("0 0 1 * *", func() {
		ctx := context.Background()
		err := dd.DistributeMonthlyIntegrityFunds(ctx)
		if err != nil {
			fmt.Printf("❌ Monthly dividend distribution failed: %v\n", err)
		}
	})

	if err != nil {
		return fmt.Errorf("failed to setup cron job: %w", err)
	}

	fmt.Println("✅ Monthly Integrity Dividend Cron Job Scheduled")
	fmt.Println("   Schedule: First day of every month at midnight (WAT)")
	fmt.Println("   Next run:", dd.GetNextRun())

	return nil
}

// Start starts the cron scheduler
func (dd *DividendDistributor) Start() {
	dd.cronScheduler.Start()
	fmt.Println("🚀 Dividend Distributor Started")
}

// Stop stops the cron scheduler
func (dd *DividendDistributor) Stop() {
	dd.cronScheduler.Stop()
	fmt.Println("🛑 Dividend Distributor Stopped")
}

// GetNextRun returns the next scheduled run time
func (dd *DividendDistributor) GetNextRun() time.Time {
	entries := dd.cronScheduler.Entries()
	if len(entries) > 0 {
		return entries[0].Next
	}
	return time.Time{}
}

// RunNow executes the dividend distribution immediately (for testing)
func (dd *DividendDistributor) RunNow(ctx context.Context) error {
	fmt.Println("🧪 Running dividend distribution manually...")
	return dd.DistributeMonthlyIntegrityFunds(ctx)
}

