# BOCRA WEBSITE AUDIT REPORT
**Prepared for:** BOCRA Hackathon Development Team  
**Date:** 18 March 2026  
**Audited Site:** [https://www.bocra.org.bw](https://www.bocra.org.bw)  
**Competitor Sites Reviewed:** ICASA (South Africa), Communications Authority of Kenya, Estonia TTJA (European Gold Standard), EU BEREC

---

## Executive Summary

> [!CAUTION]
> The BOCRA website has **critical usability, design, and content issues** that make it unsuitable as a modern regulatory platform. A ground-up rebuild will create an enormous competitive advantage at the hackathon.

**Top 5 Critical Problems Found:**

1. 🚨 **Completely Broken Mobile Experience** — The site is virtually unusable on smartphones. The search bar overlaps body text, navigation tabs overlap, and elements clip offscreen. Given that ~80% of Botswana's internet users are on mobile, this is the #1 failure.
2. 🧟 **Outdated "Content Rot"** — A **COVID-19 banner** from 2020 is still prominently displayed on the homepage in 2026. A **"Vote Now!"** popup for an ITU election is still showing. FAQs reference the old "www.bta.org.bw" domain (predecessor agency).
3. 🔗 **Broken Links & 404s** — The **Tariffs page** returns a `404 Not Found` error. Footer links to `/form/tariffs` and `/form/faqs` use incorrect URL patterns. The `Broadcasting Coverage` link on the homepage points back to the homepage itself (dead link).
4. 🧩 **No Real Self-Service** — The **"File a Complaint" form page is completely empty** (only shows footer). There is no online license application portal, no complaint tracking, no real-time status updates. Citizens must write physical letters to the Chief Executive.
5. 🎨 **Severely Outdated Design** — Early 2010s aesthetic with cluttered multi-row navigation, inconsistent color usage, and no responsive framework. Competitors (ICASA, Kenya CA) have modern, clean interfaces with accessibility tools and live chat.

---

## Site Map

### Complete Navigation Structure

```
BOCRA Website (https://www.bocra.org.bw)
│
├── 🏠 Homepage
│
├── 📋 About
│   ├── Profile (/profile)
│   ├── A Word From The Chief Executive (/word-chief-executive)
│   ├── History Of Communication Regulation (/history-of-communication-regulation)
│   ├── Organogram (/organogram)
│   ├── Board of Directors (/board-of-directors)
│   ├── Executive Management (/executive-management)
│   └── Careers (/careers)
│
├── ⚖️ Mandate
│   ├── Legislation (/legislation)
│   ├── Telecommunications (/telecommunications)
│   │   ├── National Radio Frequency Plan (/national-radio-frequency-plan)
│   │   ├── Radio Spectrum Planning (/radio-spectrum-planning)
│   │   ├── The Numbering Plan (/numbering-plan)
│   │   └── Type Approval (/type-approval)
│   ├── Broadcasting (/broadcasting)
│   ├── Postal (/postal)
│   ├── Internet (/internet)
│   │   ├── bw ccTLD (/bw-cctld)
│   │   ├── bw CIRT (/bw-cirt)
│   │   ├── Electronic Evidence (/electronic-evidence)
│   │   └── Electronic Communications Transactions (/electronic-communications-transactions)
│   └── Licensing (/licensing)
│
├── 📁 Projects (/projects)
│
├── 📄 Documents (/documents&legislation)
│   ├── Draft Documents And Legislation (/draft-documents-and-legislation)
│   ├── ICT Licencing Framework (/ict-licensing-frameworks)
│   └── ITU Capacity Building Workshop (/itu-capacity-building-workshop)
│
├── 📢 Complaints (/complaints)
│   ├── Consumer Education And Advice (/consumer-education-and-advice)
│   ├── Registering Complaints (/registering-complaints)
│   └── File A Complaint (/form/file-complaint-form) ⚠️ EMPTY PAGE
│
├── 📰 Media (/media-center)
│   ├── News & Events (/news&events)
│   └── Speeches (/speeches)
│
├── 📋 Tenders (/tenders)
│
├── 🔗 External Portals (in nav bar)
│   ├── BOCRA Portal → https://op-web.bocra.org.bw
│   ├── QOS Monitoring → https://dqos.bocra.org.bw
│   ├── ASMS-WebCP → https://registration.bocra.org.bw/
│   ├── Licence Verification → https://customerportal.bocra.org.bw/OnlineLicenseVerification/verify
│   ├── Type Approval → https://typeapproval.bocra.org.bw/
│   └── Register BW → https://nic.net.bw/
│
├── 📊 Telecoms Statistics (/telecoms-statistics) ⚠️ EMPTY - no visible stats
│
└── 🦶 Footer Links
    ├── Tariffs (/tariffs) ❌ 404 ERROR
    ├── FAQs (/faqs)
    ├── Links (/links)
    ├── Privacy Notice (/privacy-notice)
    └── BOCRA Staff Mail → office.com ⚠️ Internal link exposed publicly
```

### Navigation Click Depth Analysis

| Destination | Clicks from Homepage | Assessment |
|-------------|---------------------|------------|
| File a Complaint | 1 (sidebar) or 3 (nav menu) | OK but form is **broken/empty** |
| Apply for a License | 2+ clicks (no clear CTA) | **Too hard to find** |
| Check Telecom Statistics | 1 click | Page is **empty** |
| Find Legislation/Regulations | 2 clicks | Acceptable |
| Register a .bw Domain | 1 click (redirects to nic.net.bw) | OK |
| Report a Cybersecurity Incident | 3+ clicks (buried under Internet > bw CIRT) | **Too deep** |
| Check Equipment Type Approval | 1 click (nav bar link) | OK |
| Verify a Licence | 1 click (nav bar link) | OK |
| Find Contact Information | Scroll to footer | Could be more prominent |
| View Tariff Information | 1 click | **Returns 404 error** |

---

## Critical Issues (Fix These First)

### 🔴 Priority 1 — Showstoppers

| # | Issue | URL | Impact |
|---|-------|-----|--------|
| 1 | **Complaint form page is empty** | `/form/file-complaint-form` | Citizens cannot file complaints online — BOCRA's core consumer protection function is broken |
| 2 | **Tariffs page is 404** | `/tariffs` | Operators and consumers cannot find pricing/tariff information |
| 3 | **Mobile layout completely broken** | All pages | ~80% of Botswana internet users on mobile cannot use the site |
| 4 | **COVID-19 banner still displayed** | Homepage | Makes the organization look unmaintained and unprofessional in 2026 |
| 5 | **Telecoms Statistics page is empty** | `/telecoms-statistics` | Key data transparency obligation not being met |
| 6 | **"Vote Now" popup still showing** | Homepage (modal) | Outdated campaign that blocks content |

### 🟡 Priority 2 — Significant Problems

| # | Issue | Details |
|---|-------|---------|
| 7 | **FAQs reference old BTA domain** | FAQs still point users to "www.bta.org.bw" (Botswana Telecommunications Authority — predecessor) for forms |
| 8 | **Broadcasting Coverage link is dead** | Footer link points back to homepage (`/broadcasting` instead of coverage data) |
| 9 | **No search results validation** | Search bar exists but returns Drupal-style raw results with no categorization |
| 10 | **BOCRA Staff Mail link exposed publicly** | Footer contains link to `office.com` — internal resource exposed to public |
| 11 | **Menu items float outside nav container** | "Type Approval" and "Register BW" buttons break out of the navigation bar visually |
| 12 | **No HTTPS on some external links** | Equipment search links to `http://customerportal.bocra.org.bw` (insecure) |
| 13 | **Duplicate navigation rendered** | The nav menu HTML is rendered 3 times in the page source (desktop, mobile, and a third copy) |

---

## Services Gap Analysis

| Service | Current State | What's Needed |
|---------|--------------|---------------|
| **Licence Application** | ❌ No online application. Page describes licence types but has no "Apply" button or form. A sidebar says "Apply For A License" but links to the complaint form | ✅ Full online application portal with document upload, fee payment, and status tracking |
| **Complaint Filing** | ❌ Form page exists but is **completely empty** (shows only footer). Text says "write to The Chief Executive by post" | ✅ Online complaint form with category selection, file uploads, complaint tracking ID, and real-time status |
| **Licence Verification** | ✅ External portal exists at `customerportal.bocra.org.bw` | ⬆️ Integrate directly into main site; currently redirects to separate domain |
| **Type Approval** | ✅ External portal exists at `typeapproval.bocra.org.bw` | ⬆️ Integrate; provide clearer guidance on requirements |
| **.bw Domain Registration** | ⚠️ Redirects to `nic.net.bw` (external site) | ⬆️ Embed domain search/check tool on BOCRA site |
| **Cybersecurity Advisories** | ⚠️ Single descriptive page about bw CIRT. No actual advisories, alerts, or incident reporting | ✅ Live cybersecurity dashboard, incident reporting form, advisory feed |
| **Broadcasting Regulations** | ⚠️ Text description only. Links to a single NBB Audience Survey PDF | ✅ List of licenced broadcasters, compliance status, content obligations tracker |
| **Postal Services** | ⚠️ Text description of licensing framework. No interactive tools | ✅ Licensed operator directory, service coverage map, complaint form for postal issues |
| **Consumer Protection Tools** | ❌ No IMEI checker, no coverage checker, no price comparison tool | ✅ IMEI checker (like Kenya CA), interactive coverage map, tariff comparison tool |
| **Public Consultations** | ❌ No section for active consultations or public comment periods | ✅ Consultation portal where public can view, comment on, and track regulatory proposals |
| **Telecoms Statistics** | ❌ Page exists but is **completely empty** — no statistics shown | ✅ Interactive dashboard with charts for subscribers, penetration rates, market share, QoS data |
| **ASMS/Spectrum Management** | ✅ External portal at `registration.bocra.org.bw` | ⬆️ Better integration and onboarding flow |
| **Newsletter/Reports** | ⚠️ Single newsletter PDF linked from News section. No subscription mechanism | ✅ Newsletter subscription, annual report archive, downloadable data |
| **Tariff Information** | ❌ **404 error** — page doesn't exist | ✅ Searchable tariff database with comparison tools |
| **QoS Monitoring** | ⚠️ External link to `dqos.bocra.org.bw` exists but poorly promoted | ✅ Embedded QoS dashboard, real-time network performance data |

---

## UX Problems Found

### Homepage Issues

````carousel
![BOCRA Desktop Homepage — Cluttered navigation with 15+ links across multiple rows, "Type Approval" and "Register BW" floating outside nav container](/Users/thabisoseleke/.gemini/antigravity/brain/2a1861a4-28f7-4f9b-9119-5e7a8921341f/bocra_homepage_initial_1773839185697.png)
<!-- slide -->
![BOCRA Footer — OpenStreetMap widget takes excessive vertical space, dated social media icons, "File a Complaint" button with no working form](/Users/thabisoseleke/.gemini/antigravity/brain/2a1861a4-28f7-4f9b-9119-5e7a8921341f/bocra_homepage_footer_1773839588046.png)
<!-- slide -->
![BOCRA Mobile View — Search bar overlaps body text, tabs overlap each other, content is unreadable](/Users/thabisoseleke/.gemini/antigravity/brain/2a1861a4-28f7-4f9b-9119-5e7a8921341f/bocra_mobile_header_broken_1773839802873.png)
````

### Detailed UX Issue List

1. **Intrusive "Vote Now!" Modal Popup**
   - A large popup appears on every page load promoting an ITU candidate vote
   - This is outdated content from a past election campaign
   - Blocks the entire page until dismissed

2. **COVID-19 Section Still Prominent**
   - A "Together We Can Beat COVID 19" section with link to `/covid19-information` is displayed mid-homepage
   - This is 2026 — completely out of date
   - Signals zero active content management

3. **Navigation Overload**
   - Header contains 15+ links spread across 3-4 horizontal rows
   - Mixed color coding: maroon bar, teal buttons, dark blue buttons, white text links
   - No consistent visual language for "internal page" vs "external portal" links
   
4. **"Apply For A License" Sidebar — Misleading**
   - Appears on every page in the sidebar
   - When clicked, it links to the **complaint form** (`/form/file-complaint-form`), NOT a license application
   - The complaint form itself is empty

5. **Inconsistent URL Patterns**
   - Some pages use `&` in URLs: `/news&events`, `/documents&legislation`
   - Some use `-`: `/word-chief-executive`
   - Some use encoded characters: `/documents%26legislation`
   - Footer links use different patterns: `/form/tariffs` vs `/tariffs`

6. **Information Architecture Confusion**
   - "Mandate" contains regulatory areas (Telecoms, Broadcasting, etc.)
   - "Documents" contains legislation
   - But "Legislation" also exists as a page under "Mandate"
   - Duplication and confusion between where to find regulatory info

7. **No Breadcrumbs**
   - Deep pages have no breadcrumb trail
   - Users get lost navigating the hierarchy

8. **No "Back to Top" Button**
   - Long pages require excessive scrolling with no quick return

9. **Poor Typography**
   - Default Drupal theme fonts with minimal hierarchy
   - Body text is dense with no visual breaks

10. **No Dark Mode / Theme Options**
    - No user preference support

---

## Content Gaps

### Missing Content That Citizens Need

| Content Gap | Why It Matters |
|-------------|---------------|
| **Tariff comparison tool** | Consumers need to compare mobile data, voice, and SMS pricing across operators (Mascom, Orange, BTC) |
| **Licensed operator directory** | No searchable list of all licensed telecom, broadcasting, and postal operators in Botswana |
| **Network coverage maps** | "Mobile Coverage" is a link to a static PDF. No interactive map showing 2G/3G/4G/5G coverage |
| **Active public consultations** | Stakeholders cannot see what regulatory proposals are open for comment |
| **Annual reports** | No annual report archive visible on the website |
| **Board meeting minutes/decisions** | No transparency on regulatory decisions |
| **Consumer rights information** | "Consumer Education and Advice" section exists but content is minimal |
| **Numbering plan searchable database** | Only a static description; no way to look up allocated number ranges |
| **Spectrum allocation map** | "Frequency Plan" is a static PDF link; no interactive visualization |
| **Emergency/outage notifications** | No real-time feed of network outages or service disruptions |
| **Cybersecurity alerts** | bw CIRT page is informational only — no actual security advisories or threat alerts |
| **Tender results/awards** | Tenders page shows open tenders but no archive of awarded contracts |
| **Complaint resolution statistics** | No data on how many complaints received, resolved, average resolution time |
| **Digital literacy resources** | No educational content for citizens on online safety, digital skills |

### Outdated Content That Needs Removal/Update

| Content | Issue |
|---------|-------|
| COVID-19 homepage section | Still displayed prominently in 2026 |
| "Vote Now!" popup | Outdated ITU election campaign |
| FAQ references to "www.bta.org.bw" | BTA has been BOCRA since 2013 — 13 years ago |
| Broadcasting page | Only lists 3 radio stations and 1 TV station — the market has evolved significantly |
| News & Events | 21 pages of news but no dates visible on the listing page; content appears unsorted |

---

## Competitor Features BOCRA Should Have

### Visual Comparison

````carousel
![ICASA Homepage (South Africa) — Clean modern design, bold hero headline, prominent search bar, "5G Huddle" industry engagement tab](/Users/thabisoseleke/.gemini/antigravity/brain/2a1861a4-28f7-4f9b-9119-5e7a8921341f/icasa_homepage_1773840111307.png)
<!-- slide -->
![Kenya CA Homepage — Live chat widget ("How can we help?"), accessibility toolbar (wheelchair icon top-right), phone number prominently displayed, modern hero slider](/Users/thabisoseleke/.gemini/antigravity/brain/2a1861a4-28f7-4f9b-9119-5e7a8921341f/ca_kenya_homepage_1773840546785.png)
````

### Feature-by-Feature Comparison

| Feature | BOCRA🇧🇼 | ICASA🇿🇦 | Kenya CA🇰🇪 | Estonia TTJA🇪🇪 | EU BEREC🇪🇺 |
|---------|---------|---------|-----------|--------------|-----------|
| **Mobile Responsive** | ❌ Broken | ✅ Fully responsive | ✅ Fully responsive | ✅ Exceptional (e-Gov standard) | ✅ Fully responsive |
| **Digital Services & E-ID** | ❌ None | ❌ None | ❌ None | ✅ National e-ID integrated via X-Road | ❌ None |
| **Live Chat/Support** | ❌ None | ❌ None | ✅ Tawk.to chat widget | ✅ E-service portal integration | ❌ None |
| **Accessibility Tools** | ❌ None | ⚠️ Footer commitment | ✅ Pojo A11y full toolbar | ✅ Universal Design & high contrast | ✅ Comprehensive A11y statement |
| **Consumer Complaints** | ❌ Empty form | ✅ Consumer CRM | ✅ Online Complaint | ✅ DSA Dispute Body ecosystem | ⚠️ Delegates to national regulators |
| **Public Registers/Databases** | ⚠️ External portal | ✅ Searchable list | ✅ Full register | ✅ Digital Registry | ✅ Multiple public database tools |
| **Open Data APIs** | ❌ None | ⚠️ Limited | ⚠️ Limited | ✅ X-Road interoperability | ✅ Info Sharing Portal (ISP), CSV/XLSX |
| **Comparison Tools** | ❌ 404 Error page | ⚠️ Limited | ⚠️ Limited | ✅ Mandatory e-commerce guidelines | ✅ Mandated via EECC |
| **Coverage Maps** | ❌ Static PDF | ❌ None | ✅ ICT Geo-Portal | ✅ Interactive mapping | ✅ Interactive maps & QoS data |
| **Search Quality** | ⚠️ Basic Drupal | ✅ Prominent hero | ✅ Clean search | ✅ Excellent semantic search | ✅ Advanced document search |

---

## Integration Gaps

### Systems Mentioned / Referenced

| System | Status | Gap |
|--------|--------|-----|
| **BOCRA Portal** (`op-web.bocra.org.bw`) | External link | No SSO; separate login. Purpose unclear to users |
| **QOS Monitoring** (`dqos.bocra.org.bw`) | External link | No embedded dashboards or data on main site |
| **ASMS-WebCP** (`registration.bocra.org.bw`) | External link | Spectrum management — not integrated |
| **Customer Portal** (`customerportal.bocra.org.bw`) | External link | Licence verification only. No self-service |
| **Type Approval Portal** (`typeapproval.bocra.org.bw`) | External link | Separate branding and UX from main site |
| **NIC.net.bw** (.bw domain registration) | External redirect | Different organization's site entirely |

### Partner Organizations Linked

- ITU (International Telecommunication Union)
- Commercial radio stations: Yarona FM, Duma FM, Gabz FM, eBotswana
- Commonwealth Telecommunications Organisation (CTO)
- MITRE / Carnegie Mellon (cybersecurity strategy development)

### Missing Integrations

| Integration | Value |
|-------------|-------|
| **Payment gateway** | Enable online fee payment for licenses, type approvals |
| **SMS/WhatsApp notifications** | Alert citizens on complaint status, licence expiry |
| **Open data API** | Expose telecom statistics as machine-readable data |
| **Unified authentication** | Single sign-on across all BOCRA portals |
| **Document management API** | Auto-publish gazette notices, regulatory decisions |
| **Social media feeds** | Live Twitter/Facebook feeds on homepage |
| **Google Analytics / Hotjar** | User behavior tracking for continuous improvement |

---

## Data Governance & Privacy Compliance (BDPA 2024)

### The Botswana Data Protection Act 2024 Implications
With the **Botswana Data Protection Act 2024 (BDPA)** officially taking effect on January 14, 2025, BOCRA's website is now subject to strict data governance requirements aligning closely with the EU's GDPR. As a regulatory authority, BOCRA needs to be the gold standard in demonstrating compliance.

| Area | Current BOCRA Website Status | Regulatory Requirement (BDPA 2024) | Gap / Hackathon Opportunity |
|------|------------------------------|------------------------------------|-----------------------------|
| **Privacy Notice** | ⚠️ Static privacy policies and terms exist, referenced primarily in the footer. | Clear, accessible communication of what, why, and how data is processed under the "Right to Be Informed". | **Implement Dynamic Consent:** Build contextual consent pop-ups explaining data usage precisely at the point of data entry. |
| **Data Collection** | ❌ Consumer complaint forms are broken/empty. | Data minimisation and purpose limitation (collect only what's necessary, explicitly stated purpose). | **Secure Complaint Portal** that strictly follows data minimization, with explicit consent checkboxes before submission. |
| **Data Subject Rights**| ❌ No self-service functionality for users. | Right to access, correct, delete, or object to data processing. | **"My Data" Dashboards:** Create a citizen portal where individuals can view their submitted data and request deletion. |
| **Cross-Border Transfers & Integration** | ⚠️ Disconnected external portals with varying security. | Strict prohibitions on unverified external data transfers unless explicit conditions are met. | **Unified Authentication & Security:** Implement Single Sign-On (SSO) ensuring explicit data transfer acknowledgments. |
| **Privacy by Design**| 🚨 Exposes internal `office.com` mail link in footer. | Must deploy technical safeguards protecting personal data from loss or unauthorized access from the outset. | **Role-Based Access Control (RBAC)** embedded directly in the design. Remove exposed internal systems. |

> [!CAUTION]
> **Data Breach Potential:** BDPA 2024 requires notification to the newly established Information and Data Protection Commission (IDPC) within 72 hours of any data breach. The current 2013-era infrastructure and unencrypted external links (e.g., HTTP customer portals) pose a significant non-compliance risk. The hackathon project should heavily emphasize encrypted databases and security-by-design.

---

## Accessibility Audit

### WCAG Compliance Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| **No accessibility toolbar** | High | No text resize, contrast toggle, or screen reader assistance (Kenya CA has full Pojo A11y toolbar) |
| **Missing alt text on images** | High | Hero image and logo have minimal descriptive alt text |
| **Poor color contrast** | Medium | Teal text on white backgrounds in some navigation elements fails AA contrast ratio |
| **No skip navigation link** | Medium | `#main-content` anchor exists but is not visually accessible |
| **Form labels missing** | High | The complaint form (when it works) and search bar lack proper `<label>` elements |
| **No keyboard navigation indicators** | Medium | No visible focus styles on interactive elements |
| **Map widget not accessible** | High | OpenStreetMap in footer has no text alternative |
| **No language attribute** | Low | Page `lang` attribute may be missing for screen readers |
| **PDF-only documents** | High | Many regulatory documents are only available as PDF with no HTML alternative |
| **No mobile hamburger menu** | Critical | On mobile, the full desktop navigation is just squished — no responsive menu |
| **Social media icons lack text labels** | Medium | Footer social icons are image-only with no screen reader text |

### Mobile Responsiveness Assessment

> [!WARNING]
> **The site is NOT mobile-responsive.** At 375px width (standard smartphone):
> - Search bar floats over body text, making both unreadable
> - Navigation tabs ("Internet", "Broadcasting", etc.) overlap
> - Content columns clip and overflow horizontally
> - Users must pinch-zoom to read any text
> - Map widget breaks out of the viewport

---

## Recommendations for the New Platform

### 🏆 Prioritized Feature List (by Hackathon Impact)

#### Tier 1 — Must-Have (Will win the hackathon)

| # | Feature | Why |
|---|---------|-----|
| 1 | **Fully responsive, mobile-first design** | Solves the #1 problem; demonstrates basic modern competency |
| 2 | **Online complaint filing with tracking** | Core mission of BOCRA; currently completely broken |
| 3 | **Interactive telecoms statistics dashboard** | Replaces empty page with WOW-factor data visualization |
| 4 | **Self-service licence application portal** | Transforms a multi-day office visit into a digital process |
| 5 | **Searchable licensed operator directory** | Transparency tool that benefits consumers and industry |

#### Tier 2 — Should-Have (Differentiators)

| # | Feature | Why |
|---|---------|-----|
| 6 | **IMEI device checker** | High-value consumer tool (proven by Kenya CA) |
| 7 | **Interactive network coverage map** | Replaces static PDF with real geographic data |
| 8 | **Accessibility toolbar** | Shows commitment to inclusion; matches best-in-class competitors |
| 9 | **Live chat / AI chatbot** | "How can I get a licence?" — instant answers |
| 10 | **Public consultation platform** | Enables digital participation in regulatory process |

#### Tier 3 — Nice-to-Have (Polish)

| # | Feature | Why |
|---|---------|-----|
| 11 | **Tariff comparison tool** | Citizens can compare operator pricing |
| 12 | **Newsletter subscription system** | Build ongoing engagement |
| 13 | **Cybersecurity advisory feed** | Real-time security alerts for public |
| 14 | **Multi-language support** (English/Setswana) | Inclusive access |
| 15 | **Dark mode** | Modern UX expectation |

---

## Quick Win Opportunities

> [!TIP]
> These are features that would **immediately impress hackathon judges** because they solve visible, painful problems with the current site.

### 1. 📊 **Live Statistics Dashboard** (replaces empty statistics page)
Build an interactive dashboard showing:
- Mobile subscribers by operator (Mascom, Orange, BTC) with market share pie chart
- Internet penetration rate over time (line chart)
- Broadcasting reach per station
- Postal service volumes
- **Why it wins:** Judges will compare your live charts against BOCRA's empty page. Night and day.

### 2. 📝 **Smart Complaint System** (replaces broken form)
- Category-based complaint submission (Billing, Service Quality, Coverage, etc.)
- Auto-assign to relevant operator for first response
- Complaint tracking with unique reference number
- SMS/email status updates
- **Why it wins:** This is BOCRA's core public-facing function and it's *currently broken*. Fixing it demonstrates impact.

### 3. 📱 **"Check Your Operator" Consumer Tools**
- IMEI checker: Is my phone legitimate?
- Coverage checker: Enter your area, see which networks cover it and at what quality
- Tariff lookup: Compare operator pricing for your usage
- **Why it wins:** These tools don't exist at all on the current site. Immediate citizen value.

### 4. 🤖 **AI-Powered FAQ Chatbot**
- Train on all BOCRA FAQs, legislation, and procedures
- "How do I apply for a radio licence?" → step-by-step answer
- "What are Orange's data prices?" → tariff lookup
- **Why it wins:** Transforms 13-year-old FAQ content into a modern conversational interface. Massive wow factor.

### 5. 🗺️ **Interactive Coverage & Frequency Map**
- Replace static PDF maps with Mapbox/Leaflet interactive maps
- Toggle layers: Mobile 2G/3G/4G/5G, broadcasting FM/TV, postal outlets
- Click any location to see available services
- **Why it wins:** Visual, interactive, and immediately useful. The current site has a static PDF from unknown date.

### 6. 🔔 **Real-Time Notification Center**
- Active public consultations with comment deadlines
- Tender openings and results
- Regulatory decisions and orders
- Network outage reports
- **Why it wins:** Shows the site as a living, dynamic platform rather than a static brochure.

---

## Technical Architecture Notes for Developers

### Current Site Technology
- **CMS:** Drupal 7 (based on URL patterns like `/node/62812`, class structures, and form paths)
- **Map:** Leaflet with OpenStreetMap tiles
- **Hosting:** Standard web hosting (no CDN observed)
- **Design:** Custom Drupal theme, not responsive
- **SSL:** HTTPS on main site; some external portals use HTTP

### Recommended New Stack
- **Frontend:** Next.js or Vite + React with Tailwind CSS
- **Charts:** Chart.js, Recharts, or D3.js for statistics dashboard
- **Maps:** Mapbox GL JS or Leaflet with modern tileset
- **Chat:** Tawk.to integration or custom AI chatbot (OpenAI/Gemini API)
- **Accessibility:** A11y toolkit, WCAG 2.1 AA compliance
- **Backend:** Node.js API or Python FastAPI for complaint management
- **Database:** PostgreSQL for structured data (licences, complaints, operators)
- **Search:** Algolia or Meilisearch for instant document search

---

## Appendix: All URLs Audited

### Working Pages
| URL | Status |
|-----|--------|
| `/` (Homepage) | ✅ Loaded (with issues) |
| `/profile` | ✅ Content present |
| `/word-chief-executive` | ✅ Referenced |
| `/history-of-communication-regulation` | ✅ Referenced |
| `/organogram` | ✅ Referenced |
| `/board-of-directors` | ✅ Referenced |
| `/executive-management` | ✅ Referenced |
| `/careers` | ✅ Content present |
| `/legislation` | ✅ Content present |
| `/telecommunications` | ✅ Referenced |
| `/broadcasting` | ✅ Content present |
| `/postal` | ✅ Content present |
| `/internet` | ✅ Referenced |
| `/bw-cctld` | ✅ Content present |
| `/bw-cirt` | ✅ Content present |
| `/electronic-evidence` | ✅ Referenced |
| `/electronic-communications-transactions` | ✅ Referenced |
| `/licensing` | ✅ Content present |
| `/complaints` | ✅ Content present |
| `/consumer-education-and-advice` | ✅ Referenced |
| `/registering-complaints` | ✅ Referenced |
| `/news&events` | ✅ Content present (21 pages) |
| `/speeches` | ✅ Referenced |
| `/tenders` | ✅ Content present |
| `/faqs` | ✅ Content present (but outdated) |
| `/projects` | ✅ Referenced |
| `/privacy-notice` | ✅ Referenced |
| `/links` | ✅ Referenced |

### Broken/Problem Pages
| URL | Issue |
|-----|-------|
| `/tariffs` | ❌ **404 Not Found** |
| `/form/file-complaint-form` | ⚠️ **Empty page** — only footer renders |
| `/telecoms-statistics` | ⚠️ **Empty page** — no statistics content |
| `/covid19-information` | ⚠️ Outdated — should be removed |
| `/broadcasting` (Coverage link) | ⚠️ Points to homepage, not coverage data |

### External Portals
| Portal | URL | Status |
|--------|-----|--------|
| BOCRA Portal | `op-web.bocra.org.bw` | ⚠️ Separate system |
| QOS Monitoring | `dqos.bocra.org.bw` | ⚠️ Separate system |
| ASMS-WebCP | `registration.bocra.org.bw` | ⚠️ Separate system |
| Customer Portal | `customerportal.bocra.org.bw` | ⚠️ Separate system |
| Type Approval | `typeapproval.bocra.org.bw` | ⚠️ Separate system |
| .bw Domains | `nic.net.bw` | ⚠️ External organization |

---

> [!IMPORTANT]
> **Bottom Line for the Hackathon:** The current BOCRA website has so many fundamental problems that almost ANY well-designed, mobile-responsive replacement with working complaint filing, a statistics dashboard, and proper navigation will be a dramatic improvement. Focus on the **Quick Wins** above and you will have a compelling demo. The bar is low — exceed it by building something that actually serves Botswana's citizens.
