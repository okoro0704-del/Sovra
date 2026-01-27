-- TECHNOLOGY_TYPE: VITALIZED_LEDGER_TECHNOLOGY
--
-- Database Schema for Airline_Vitalian_Direct Handshake
-- This schema supports airline boarding with conditional wallet logic

-- Certified Airline Carriers
CREATE TABLE certified_airline_carriers (
  carrier_id TEXT PRIMARY KEY,
  carrier_name TEXT NOT NULL,
  iata TEXT NOT NULL UNIQUE,
  icao TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  certification_id TEXT NOT NULL UNIQUE,
  vault_id TEXT NOT NULL,
  vault_balance BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carriers_iata ON certified_airline_carriers(iata);
CREATE INDEX idx_carriers_country ON certified_airline_carriers(country);
CREATE INDEX idx_carriers_active ON certified_airline_carriers(is_active);

-- Ticket-PFF Links
CREATE TABLE ticket_pff_links (
  link_id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL UNIQUE,
  vitalian_did TEXT NOT NULL,
  carrier_id TEXT NOT NULL REFERENCES certified_airline_carriers(carrier_id),
  flight_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  boarding_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('linked', 'boarded', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_links_ticket_id ON ticket_pff_links(ticket_id);
CREATE INDEX idx_ticket_links_vitalian_did ON ticket_pff_links(vitalian_did);
CREATE INDEX idx_ticket_links_carrier_id ON ticket_pff_links(carrier_id);
CREATE INDEX idx_ticket_links_flight_number ON ticket_pff_links(flight_number);
CREATE INDEX idx_ticket_links_status ON ticket_pff_links(status);
CREATE INDEX idx_ticket_links_boarding_time ON ticket_pff_links(boarding_time);

-- Boarding Events
CREATE TABLE boarding_events (
  event_id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES ticket_pff_links(ticket_id),
  vitalian_did TEXT NOT NULL,
  carrier_id TEXT NOT NULL REFERENCES certified_airline_carriers(carrier_id),
  flight_number TEXT NOT NULL,
  pff_hash TEXT NOT NULL,
  wallet_check_result TEXT NOT NULL CHECK (wallet_check_result IN ('vitalian_funded', 'vitalian_empty')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('vitalian_wallet', 'airline_vault')),
  fee_amount BIGINT NOT NULL,
  transaction_id TEXT NOT NULL,
  integrity_score INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_boarding_events_ticket_id ON boarding_events(ticket_id);
CREATE INDEX idx_boarding_events_vitalian_did ON boarding_events(vitalian_did);
CREATE INDEX idx_boarding_events_carrier_id ON boarding_events(carrier_id);
CREATE INDEX idx_boarding_events_flight_number ON boarding_events(flight_number);
CREATE INDEX idx_boarding_events_payment_method ON boarding_events(payment_method);
CREATE INDEX idx_boarding_events_timestamp ON boarding_events(timestamp);

-- Boarding Receipts
CREATE TABLE boarding_receipts (
  receipt_id TEXT PRIMARY KEY,
  vitalian_did TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('vitalian_wallet', 'airline_vault')),
  fee_amount BIGINT NOT NULL,
  integrity_score INTEGER NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_boarding_receipts_vitalian_did ON boarding_receipts(vitalian_did);
CREATE INDEX idx_boarding_receipts_timestamp ON boarding_receipts(timestamp);

-- Views for Analytics

-- Airline Proxy Payment Statistics
CREATE VIEW airline_proxy_payment_stats AS
SELECT
  c.carrier_id,
  c.carrier_name,
  c.iata,
  COUNT(CASE WHEN be.payment_method = 'airline_vault' THEN 1 END) AS proxy_payments_count,
  COUNT(CASE WHEN be.payment_method = 'vitalian_wallet' THEN 1 END) AS vitalian_payments_count,
  SUM(CASE WHEN be.payment_method = 'airline_vault' THEN be.fee_amount ELSE 0 END) AS total_proxy_amount_usov,
  SUM(CASE WHEN be.payment_method = 'vitalian_wallet' THEN be.fee_amount ELSE 0 END) AS total_vitalian_amount_usov,
  COUNT(*) AS total_boardings
FROM certified_airline_carriers c
LEFT JOIN boarding_events be ON c.carrier_id = be.carrier_id
GROUP BY c.carrier_id, c.carrier_name, c.iata;

-- Vitalian Boarding History
CREATE VIEW vitalian_boarding_history AS
SELECT
  be.vitalian_did,
  COUNT(*) AS total_boardings,
  COUNT(CASE WHEN be.payment_method = 'airline_vault' THEN 1 END) AS proxy_paid_count,
  COUNT(CASE WHEN be.payment_method = 'vitalian_wallet' THEN 1 END) AS self_paid_count,
  MAX(be.integrity_score) AS current_integrity_score,
  MAX(be.timestamp) AS last_boarding_timestamp
FROM boarding_events be
GROUP BY be.vitalian_did;

-- Flight Boarding Statistics
CREATE VIEW flight_boarding_stats AS
SELECT
  be.flight_number,
  be.carrier_id,
  c.carrier_name,
  COUNT(*) AS total_passengers,
  COUNT(CASE WHEN be.payment_method = 'airline_vault' THEN 1 END) AS proxy_paid_passengers,
  COUNT(CASE WHEN be.payment_method = 'vitalian_wallet' THEN 1 END) AS self_paid_passengers,
  SUM(be.fee_amount) AS total_fees_collected_usov,
  MIN(be.timestamp) AS first_boarding,
  MAX(be.timestamp) AS last_boarding
FROM boarding_events be
JOIN certified_airline_carriers c ON be.carrier_id = c.carrier_id
GROUP BY be.flight_number, be.carrier_id, c.carrier_name;

-- Wallet Check Analytics
CREATE VIEW wallet_check_analytics AS
SELECT
  DATE(be.timestamp) AS boarding_date,
  COUNT(*) AS total_scans,
  COUNT(CASE WHEN be.wallet_check_result = 'vitalian_empty' THEN 1 END) AS empty_wallet_count,
  COUNT(CASE WHEN be.wallet_check_result = 'vitalian_funded' THEN 1 END) AS funded_wallet_count,
  ROUND(100.0 * COUNT(CASE WHEN be.wallet_check_result = 'vitalian_empty' THEN 1 END) / COUNT(*), 2) AS empty_wallet_percentage
FROM boarding_events be
GROUP BY DATE(be.timestamp)
ORDER BY boarding_date DESC;

