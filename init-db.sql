-- PostgreSQL Database Initialization Script for MedFind
-- This script creates the necessary tables for the MedFind backend

-- Drop existing tables if they exist (in correct dependency order)
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS inventory_item CASCADE;
DROP TABLE IF EXISTS pharmacy CASCADE;
DROP TABLE IF EXISTS medicine CASCADE;

-- Drop existing ENUM types
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;

-- Create ENUM types
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK');
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'READY_FOR_COLLECTION', 'COLLECTED', 'CANCELLED');

-- Medicine table
CREATE TABLE medicine (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    strength VARCHAR(255),
    form VARCHAR(255),
    description TEXT
);

-- Pharmacy table
CREATE TABLE pharmacy (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    hours VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Item table
CREATE TABLE inventory_item (
    id VARCHAR(255) PRIMARY KEY,
    pharmacy_id VARCHAR(255) NOT NULL,
    medicine_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER,
    status availability_status DEFAULT 'AVAILABLE',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacy(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicine(id) ON DELETE CASCADE,
    UNIQUE(pharmacy_id, medicine_id)
);

-- Reservation table
CREATE TABLE reservation (
    id VARCHAR(255) PRIMARY KEY,
    patient_id VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    pharmacy_id VARCHAR(255) NOT NULL,
    medicine_id VARCHAR(255) NOT NULL,
    price INTEGER,
    status reservation_status DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacy(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicine(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_inventory_pharmacy_id ON inventory_item(pharmacy_id);
CREATE INDEX idx_inventory_medicine_id ON inventory_item(medicine_id);
CREATE INDEX idx_reservation_patient_id ON reservation(patient_id);
CREATE INDEX idx_reservation_pharmacy_id ON reservation(pharmacy_id);
CREATE INDEX idx_reservation_medicine_id ON reservation(medicine_id);
CREATE INDEX idx_reservation_status ON reservation(status);

-- Insert sample data
INSERT INTO medicine (id, name, strength, form, description) VALUES
('med_001', 'Paracetamol', '500mg', 'Tablet', 'Pain reliever and fever reducer'),
('med_002', 'Ibuprofen', '200mg', 'Tablet', 'Anti-inflammatory pain relief'),
('med_003', 'Aspirin', '100mg', 'Tablet', 'Pain relief and anticoagulant');

INSERT INTO pharmacy (id, name, city, address, phone, hours, latitude, longitude, verified) VALUES
('pharm_001', 'City Pharmacy', 'Dar es Salaam', '123 Main St', '+255 123 456 789', '8:00-22:00', -6.7924, 39.2083, true),
('pharm_002', 'Health Plus', 'Dar es Salaam', '456 Oak Ave', '+255 987 654 321', '7:00-23:00', -6.7753, 39.2179, true),
('pharm_003', 'MedCare Pharmacy', 'Dar es Salaam', '789 Pine Rd', '+255 555 666 777', '8:00-20:00', -6.8020, 39.2082, true);

INSERT INTO inventory_item (id, pharmacy_id, medicine_id, quantity, price, status, updated_at) VALUES
('inv_001', 'pharm_001', 'med_001', 50, 5000, 'AVAILABLE', CURRENT_TIMESTAMP),
('inv_002', 'pharm_001', 'med_002', 30, 8000, 'AVAILABLE', CURRENT_TIMESTAMP),
('inv_003', 'pharm_002', 'med_001', 2, 5000, 'LOW_STOCK', CURRENT_TIMESTAMP),
('inv_004', 'pharm_002', 'med_003', 0, 3000, 'OUT_OF_STOCK', CURRENT_TIMESTAMP),
('inv_005', 'pharm_003', 'med_002', 45, 8000, 'AVAILABLE', CURRENT_TIMESTAMP);

COMMIT;
