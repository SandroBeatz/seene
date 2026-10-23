# Privacy Policy

**Service:** Seene
**Effective date:** {{EFFECTIVE_DATE}}
**Last updated:** {{LAST_UPDATED}}

> This document is a working template prepared to match Seene's actual architecture. It is not legal advice. Before publishing, have it reviewed by a data-protection lawyer (152-FZ / GDPR), especially sections 8 (cross-border transfers) and 10 (controller vs. processor roles).

---

## 1. Overview

This Privacy Policy ("Policy") explains how {{OPERATOR_LEGAL_NAME}} ("Seene", "we", "the Operator") collects, uses, stores and protects personal data when you use the Seene web service and mobile application ("Service").

Seene is a platform for beauty professionals and service specialists. It lets a professional run their workspace (appointment calendar, services, client base), publish a personal page and accept online bookings from clients.

By using the Service you confirm that you have read this Policy. If you do not agree with it, please do not use the Service.

This Policy is prepared in accordance with Russian Federal Law No. 152-FZ "On Personal Data". For users in the European Economic Area, the provisions of the General Data Protection Regulation (GDPR) in section 10 also apply.

## 2. Definitions

- **Master** — a registered user of the Service: a professional who runs their workspace and accepts bookings.
- **Client** — an individual who books an appointment with a Master via the public page, or whose data a Master enters into their client base.
- **Personal data** — any information relating to a directly or indirectly identified individual (data subject).
- **Processing** — any operation on personal data: collection, recording, storage, use, transfer, deletion.

## 3. What data we process

### 3.1. Master data (Seene as Controller/Operator)

When you register and use the workspace, we process:

- email address (for authentication and communication);
- name / display name, brand name;
- phone number;
- professional information: list of services, prices, duration, descriptions, portfolio (work images), working hours and settings;
- content of your public personal page (bio, styling, links);
- technical authentication and session data.

### 3.2. Client data

When a Client books online or a Master adds a client to their base, we process:

- name;
- email address (used to confirm the booking via a one-time code — OTP);
- phone number (a required contact field — used by the Master for communication and booking notifications);
- booking details: selected service, date and time, comments;
- an anonymous identifier (UUID token) stored locally in the Client's browser solely to pre-fill the form on a repeat booking (see section 12).

Important: for Client data that a Master enters and uses within their client base, the Master is the Controller and Seene acts as a processor on the Master's instructions. See section 10.4.

### 3.3. Technical data

Automatically collected when you access the Service: IP address, device and browser type, usage data and event logs (for security and diagnostics).

## 4. Purposes and legal bases

| Purpose | Data categories | Legal basis |
|---|---|---|
| Master registration and authentication | Email, session data | Performance of a contract (Terms) |
| Running the workspace: calendar, services, clients | Master and entered Client data | Contract / Master's instructions |
| Confirming a Client's online booking | Email, OTP code | Consent / performance of a contract |
| Communication and booking notifications | Phone, email | Consent / Master's legitimate interest |
| Security and abuse prevention | Technical data | Legitimate interest / legal requirement |
| User support | Contact data | Consent / performance of a contract |

## 5. Consent

By registering as a Master or submitting the online booking form as a Client, the data subject consents to the processing of their personal data under this Policy. Consent may be withdrawn at any time (see section 10). Withdrawal does not affect the lawfulness of processing carried out before withdrawal.

For Clients, consent is recorded at the moment the booking form is submitted (acceptance of the Policy and Terms).

## 6. How we collect data

- **Directly from the subject** — at registration, when completing a profile, when submitting a booking form.
- **Via the Master** — when a Master enters their clients' data into the workspace.
- **Automatically** — technical data during use of the Service.

We do not buy personal data from third parties and do not scrape public sources for profiling.

## 7. Sharing with third parties

We do not sell personal data. To operate the Service we use the following processors (sub-processors), which process data on our instructions under contracts:

- **Supabase** — database hosting, authentication, file storage (portfolio), and sending confirmation-code (OTP) emails via Supabase Auth. Data is stored on Supabase infrastructure.
- **Vercel** — web application hosting and content delivery (CDN, access logs).
- **Apple (TestFlight / App Store)** — distribution of the mobile app during testing and beyond.

An up-to-date list of sub-processors is available on request via the contacts in section 15.

We may also disclose data in response to lawful requests from competent authorities.

## 8. Cross-border transfers and data localization

Our processors' infrastructure (Supabase, Vercel) is located outside the Russian Federation, which involves a cross-border transfer of personal data.

During the testing phase, the Service does not target users located in the Russian Federation and does not knowingly collect the personal data of Russian citizens. Accordingly, the data-localization requirement of Article 18 of Federal Law No. 152-FZ does not apply at this stage. Before launching the Service for users in the Russian Federation, we will ensure the primary storage of their personal data on servers located in Russia, or otherwise comply with localization requirements.

For EEA users, cross-border transfers rely on applicable GDPR mechanisms (Standard Contractual Clauses and/or adequacy decisions); see section 10.

## 9. Retention

We keep personal data no longer than necessary for the purposes of processing:

- Master account data — for the period of Service use and up to {{RETENTION_MASTER}} after deletion;
- Client data in a Master's base — while the Master works with them or until the Master deletes it;
- logs and technical data — up to {{RETENTION_LOGS}};
- data required to comply with legal obligations — for statutory periods.

After these periods, data is deleted or anonymized.

## 10. Your rights

### 10.1. Under 152-FZ you may:

- obtain information about the processing of your data;
- request correction, blocking or destruction of data that is incomplete, outdated, inaccurate or processed unlawfully;
- withdraw your consent to processing;
- appeal the Operator's actions to Roskomnadzor or in court.

### 10.2. For EEA users (GDPR), additionally:

the right of access, rectification, erasure ("right to be forgotten"), restriction of processing, data portability, objection to processing, and the right to lodge a complaint with a supervisory authority.

### 10.3. Exercising your rights

Send a request to {{PRIVACY_CONTACT_EMAIL}}. We will respond within the period set by applicable law (under 152-FZ — within 10 working days, extendable; under GDPR — within 1 month).

### 10.4. Seene as a processor

For personal data of Clients that a Master enters and processes in their client base, **the Master is the Controller** and Seene acts as a **processor** solely on the Master's instructions. If you are a Client and wish to exercise your rights over such data, please contact the relevant Master first; we will assist the Master as needed. The Master, in turn, must have a lawful basis for processing their clients' data (see Terms of Service).

## 11. Security

We apply organizational and technical safeguards: encryption in transit (TLS), row-level access control in the database (Row Level Security), access controls and authentication. No method of transmission or storage is completely secure, so we cannot guarantee absolute protection.

## 12. Cookies, local storage and the pre-fill token

The Service uses strictly necessary cookies and browser local storage (localStorage) to run authentication and save user preferences.

For Clients making an online booking, an anonymous UUID token is stored in localStorage. It is used **solely** to pre-fill name, email and phone on a repeat booking — a convenience, not an authorization mechanism. The token grants no access to booking history or other sensitive information. Access to sensitive data is only possible after re-verification by email (OTP). A Client can delete the token by clearing site data in their browser.

## 13. Children's data

The Service is not intended for persons under 18 and does not knowingly collect their data. If you believe a minor's data was submitted to us without a lawful basis, contact us and we will delete it.

## 14. Changes to this Policy

We may update this Policy. The current version is always available in the Service with its update date shown. We will notify users of material changes by available means.

## 15. Contacts

**Operator:** {{OPERATOR_LEGAL_NAME}}
**Privacy email:** {{PRIVACY_CONTACT_EMAIL}}
**Address:** {{OPERATOR_ADDRESS}}

Supervisory authority (RF): Roskomnadzor — https://rkn.gov.ru
