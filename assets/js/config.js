/*
  ImproFact landing page — the ONE file to edit for environment settings.
  Changing CRM (HubSpot, Odoo, email relay…) = change webhookUrl only.
*/
window.IMPROFACT_CONFIG = {
  /* Optional: also POST a copy of every form request (JSON) to a CRM / webhook.
     The form itself sends through WhatsApp or the visitor's email app. */
  webhookUrl: "",

  /* Request timeout before the form shows retry + email fallback (ms). */
  webhookTimeoutMs: 10000,

  /* Google Analytics 4 measurement ID, e.g. "G-XXXXXXX". Empty = no analytics,
     no cookies, no cookie notice. Events are still pushed to window.dataLayer. */
  analyticsId: "",

  contactEmail: "mtaleb85@gmail.com",
  contactPhone: "+961 79 306 690",
  /* The form's "Send via WhatsApp" button writes to this number (international format, digits only). */
  whatsappNumber: "96179306690",

  linkedinUrl: "https://www.linkedin.com/company/improfact/",

  /* TODO(ImproFact): confirm the stated response time. */
  responseTime: "within 1 business day",

  /* ROI calculator reduction assumptions — shown on screen.
     TODO(ImproFact): sign off before launch. */
  calculator: {
    meetingReduction: 0.30,       // share of recurring meetings removed
    targetApprovalLayers: 2,      // approval layers after redesign
    hoursPerApprovalTouch: 0.5,   // effort per approver per request (h)
    waitDaysPerLayer: 1,          // queue time each approval layer adds (business days)
    weeksPerMonth: 4.33
  },

  /* Minimum ms between first form interaction and submit (bot check). */
  minFillTimeMs: 2500
};
