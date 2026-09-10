# Transaction Reference Standard

This document defines the standard for generating transaction references within the myChange system.

## Overview

A transaction reference is a unique, human-readable identifier assigned to every financial event. Unlike the internal database UUID, the reference is designed to be shared with users and used by support teams for auditing and reconciliation.

## Reference Format

The system uses a **Structured-Random Reference** format:

`MYCH-[TYPE]-[DATE]-[RANDOM]`

### Breakdown
1. **`MYCH`**: Company constant prefix.
2. **`[TYPE]`**: 3-letter initial representing the transaction type.
   - `TMB`: Transfer MyChange (Internal)
   - `TBN`: Transfer Bank (Outbound)
   - `GCH`: Give Change (Seller to Customer)
   - `GEN`: Generic/Other
3. **`[DATE]`**: Date of transaction in `YYYYMMDD` format (e.g., `20260910`).
4. **`[RANDOM]`**: A 6-character alphanumeric random string to ensure uniqueness and prevent ID enumeration.

**Example**: `MYCH-TMB-20260910-X7Y2P1`

---

## Implementation Logic

The generation is handled by `src/utils/reference-generator.ts`.

### Algorithm
- Retrieve the prefix based on the `TransactionType` enum.
- Format the current system date.
- Generate a base-36 random string.
- Join segments with hyphens.

---

## Design Rationale

### 1. Human Readability
Support agents can identify the transaction type and date immediately from the reference without performing a database lookup.

### 2. Collision Resistance
By combining a date stamp with a 6-character random string ($36^6$ combinations per day), the probability of a collision is negligible for the system's expected volume.

### 3. Security (Anti-Enumeration)
Sequential IDs (1, 2, 3...) allow malicious users to guess other transaction references. Random alphanumeric strings make it computationally impossible to guess valid references.

### 4. Auditing & Reconciliation
The reference acts as the primary key for business audits. When reconciling with bank statements, the reference is passed as the "Payment Description" or "Remittance Info" to link external bank records back to internal ledger entries.
