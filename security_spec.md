# Firestore Security Specification: FocusCore Synchronizer

## 1. Data Invariants
- **Owner Isolation**: Users may only read or write their own `/users/{userId}` user profile document.
- **Identity Integrity**: The user profile document `userId` and internal payload `uid` property must strictly match the authenticated user `request.auth.uid`.
- **System-wide Default-Deny**: All paths, files, and unspecified query endpoints default to fully closed permission states.
- **Verification Rule**: All write actions require verified email credentials if standard email accounts are used, but since Google Login is implemented here, we strictly look for a valid `request.auth.uid`.
- **Temporal Enforcement**: Document additions/edits must align with server timing (`request.time`).

## 2. The "Dirty Dozen" Malicious Payloads
These payloads attempt to bypass structure or ownership boundaries and must be blocked:
1. **The Ghost Spoof**: Unauthenticated write to `/users/user_123` with arbitrary content.
2. **The Identity Takeover**: Authenticated user `attacker_456` attempting to read `/users/victim_789`.
3. **The Shadow Elevation**: Authenticated user `attacker_456` trying to write custom admin role parameters into `/users/attacker_456` or directly into `/users/admins`.
4. **The Alien Mapping**: Writing a profile where `uid` is set to "fake_user" while logged in as "validated_user".
5. **The Gigabyte Explode**: Writing a schema where fields contain extremely large strings, exceeding nominal safety buffers.
6. **The Immutable Freeze Bypass**: Altering original `createdAt` timestamps with old mock values.
7. **The Future Shock**: Attempting to set `updatedAt` to a future timestamp rather than the official `request.time`.
8. **The Schema Dilution**: Sinking custom properties like `{ "pwned": true }` into the profile map.
9. **The Empty Keys Attack**: Sending an empty Map payload that skips the compulsory schema parameters.
10. **The Orphan Query**: Launching full lists queries across the `/users` collection hoping to extract profiles from all active participants.
11. **Type Distortion**: Setting custom type profiles where `theme` is written as boolean (`true`) or number (`1337`) instead of the permitted enum string literals.
12. **Status Corruption**: Injecting unmapped status levels on days' goal elements (such as `DayStatus.SUCCESS` altered to `DayStatus.MALICIOUS`).

## 3. Conceptual Security Verification
The ruleset will resolve these threats safely by forcing structured validation functions, `incoming() != null`, and strict document identity checks.
