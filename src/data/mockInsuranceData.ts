import { 
  UserProfile, 
  InsurancePolicy, 
  InsuranceProduct, 
  InsuranceClaim, 
  PolicyRenewal, 
  VerificationDocument, 
  ConsultationSession, 
  KYCRecord, 
  PolicyProposal, 
  AuditLog 
} from '../types/insurance';

export const mockUsers: Record<string, UserProfile> = {
  customer: {
    id: 'CUST-88219',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@example.com',
    phone: '+91 98201 44512',
    role: 'customer',
    designation: 'Policyholder',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBME2LBP-wcf9EeuJP-kdl4illa9biMzhpQSEJxoJY5I-qDHX2f3dXaWFZB20qRNkE6jj42BVREdRgHWE5f3AMjJjkicW2xcWFToZgap7YoW5ez4pcFe9IogZlCiygfBA60lqP-AVjNlfAlmul60Xl46xrM3HNXh8ZF0U_k8atCtmCi6BHjKXA5plHyLDqa9zPg9kUejha1nTYO1SjarSvF1UqimJkiMWHKRo0I0DrGn_OYNlGgU2dngA',
    branch: 'Mumbai Central Branch',
    assignedAdvisor: 'Amit Sharma (Senior Advisor)',
    assignedOfficer: 'Officer S. Sharma (Verification Head)',
    protectionScore: 84
  },
  advisor: {
    id: 'ADV-4021',
    name: 'Amit Sharma',
    email: 'amit.sharma@indiafirstlife.com',
    phone: '+91 98112 00982',
    role: 'advisor',
    designation: 'Senior Insurance Advisor',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNEGX8bmqilq0VlUb2o3tp1LSBUPKWh96OqmcmhSWMVd5o7nJ9S9FxTe1_3yhUNS55ZGO9vxJCfKXrbxcsuNlpvuEWzQlD9ev0DGHlFMBNOC21MWzu2jscgogqwJIbx6WkDPNlbRNVWqrJOLtqVOnUfTyy9ROs8QoUj2zc3Xsi2fYdS77_0U4a7FHovqo0euXbp8b6OkFR1h25ChUmcl3sJxxPfPnv4x6oNleNi-lygKcwkeiYMmSR-g',
    branch: 'Mumbai Regional HQ'
  },
  officer: {
    id: 'OFF-1092',
    name: 'Officer S. Sharma',
    email: 's.sharma@indiafirstlife.com',
    phone: '+91 99300 88210',
    role: 'officer',
    designation: 'Verification Head & Underwriting Officer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSSWk3Jptr81ouKOXxP5sg-YrXLl-5B0MClkcp_RQapAz78HIB1rGGlIDqZibKUkNz3auPZpCEya1Fg3LrdtEyaDMzTVtCBRYvom-7ulLPoBz3cksd0_8-KuMPV16a_A7E_hz1hR1IwYOkobvn68iuhXn4EzyBSkpLPN_7PliFVxXAdB3sG0w2aCyLOEAAuKsbR2QyeGqUuQ-XiS6K3HQo8-ZTwrMst0mTpI8Ik-8cEVvZ0wzlzIUJ5A',
    branch: 'IndiaFirst Life Corporate Office'
  },
  admin: {
    id: 'ADM-0001',
    name: 'Enterprise Admin',
    email: 'admin.portal@indiafirstlife.com',
    phone: '+91 22 6822 0000',
    role: 'admin',
    designation: 'Super Administrator',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC57SMEw5lIOBkQEoiXLgqWHeYkdsyEbaLalr2RksHebc0Rik6KRVU-gzdGOLtPPYKuirgcSUzfjlXIZpKoNZD4hrW5D4ifCy1FWJaX2cK7tzEP_FtQ7fB2-GBwEmol2MKJaayiNPl3GmE9_kYzIgbFYCwLKQd5-jpwWOQn0uqA5u5ZDSF9syX3X_3xskLet37_LbxCcptka5yG35itSMN0UW70Ozx_-Sxm4EqCaHb9RvtHjMgavX-TfQ',
    branch: 'Headquarters, BKC Mumbai'
  }
};

export const mockPolicies: InsurancePolicy[] = [
  {
    id: 'POL-1',
    policyNumber: 'IFL-992384',
    policyName: 'IndiaFirst Term Protect Plus',
    type: 'Term Insurance',
    coverageAmount: 5000000,
    premiumAmount: 12400,
    frequency: 'Yearly',
    termYears: 25,
    status: 'Active',
    nomineeName: 'Priya Sharma',
    nomineeRelation: 'Spouse',
    issueDate: '2021-09-05',
    nextRenewalDate: '2026-09-05',
    benefits: ['Full Life Cover up to age 75', 'Terminal Illness Rider included', 'Tax Savings under 80C & 10(10D)'],
    customerName: 'Rajesh Sharma',
    customerId: 'CUST-88219',
    advisorName: 'Amit Sharma',
    officerName: 'Officer S. Sharma',
    riskLevel: 'Low'
  },
  {
    id: 'POL-2',
    policyNumber: 'IFL-883412',
    policyName: 'IndiaFirst Smart Save Plan',
    type: 'Savings Plan',
    coverageAmount: 2500000,
    premiumAmount: 5000,
    frequency: 'Monthly',
    termYears: 15,
    status: 'Active',
    nomineeName: 'Rahul Sharma',
    nomineeRelation: 'Son',
    issueDate: '2022-08-12',
    nextRenewalDate: '2026-08-12',
    benefits: ['Guaranteed Additions every policy year', 'Flexible Payout Options', 'Accidental Death Rider'],
    customerName: 'Rajesh Sharma',
    customerId: 'CUST-88219',
    advisorName: 'Amit Sharma',
    officerName: 'Officer S. Sharma',
    riskLevel: 'Low'
  },
  {
    id: 'POL-3',
    policyNumber: 'IFL-774120',
    policyName: 'IndiaFirst Health Secure Shield',
    type: 'Family Health',
    coverageAmount: 1500000,
    premiumAmount: 18200,
    frequency: 'Yearly',
    termYears: 5,
    status: 'Active',
    nomineeName: 'Priya Sharma',
    nomineeRelation: 'Spouse',
    issueDate: '2023-02-20',
    nextRenewalDate: '2027-02-20',
    benefits: ['Cashless Treatment in 10,000+ Hospitals', 'No Claim Bonus up to 100%', 'Annual Health Check-up'],
    customerName: 'Rajesh Sharma',
    customerId: 'CUST-88219',
    advisorName: 'Amit Sharma',
    officerName: 'Officer S. Sharma',
    riskLevel: 'Low'
  },
  {
    id: 'POL-4',
    policyNumber: 'IFL-TERM-4921',
    policyName: 'IndiaFirst Smart Term Plan Plus',
    type: 'Term Insurance',
    coverageAmount: 10000000,
    premiumAmount: 28800,
    frequency: 'Yearly',
    termYears: 30,
    status: 'Under Review',
    nomineeName: 'Kavita Kumar',
    nomineeRelation: 'Spouse',
    issueDate: '2026-07-15',
    nextRenewalDate: '2027-07-15',
    benefits: ['₹1 Crore Pure Protection Cover', 'Critical Illness Rider', 'Waiver of Premium'],
    customerName: 'Rajesh Kumar',
    customerId: 'CUST-88220',
    advisorName: 'Amit Sharma',
    officerName: 'Officer S. Sharma',
    riskLevel: 'Critical'
  },
  {
    id: 'POL-5',
    policyNumber: 'IFL-ULIP-8812',
    policyName: 'IndiaFirst Wealth Creator ULIP',
    type: 'ULIP',
    coverageAmount: 3500000,
    premiumAmount: 10000,
    frequency: 'Monthly',
    termYears: 10,
    status: 'Pending',
    nomineeName: 'Aarav Iyer',
    nomineeRelation: 'Son',
    issueDate: '2026-07-28',
    nextRenewalDate: '2026-08-28',
    benefits: ['Multiple Fund Options', 'Zero Premium Allocation Charge after Year 5', 'Tax Free Returns'],
    customerName: 'Ananya Iyer',
    customerId: 'CUST-88225',
    advisorName: 'Anjali Mehta',
    officerName: 'Officer S. Sharma',
    riskLevel: 'Medium'
  },
  {
    id: 'POL-6',
    policyNumber: 'IFL-RETR-1122',
    policyName: 'IndiaFirst Guaranteed Pension Plan',
    type: 'Retirement Plan',
    coverageAmount: 5000000,
    premiumAmount: 120000,
    frequency: 'Yearly',
    termYears: 20,
    status: 'Verified',
    nomineeName: 'Suman Deep',
    nomineeRelation: 'Self',
    issueDate: '2026-06-10',
    nextRenewalDate: '2027-06-10',
    benefits: ['Guaranteed Lifetime Annuity', 'Joint Life Option with Spouse', 'Lump Sum Withdrawal'],
    customerName: 'Suman Deep',
    customerId: 'CUST-88240',
    advisorName: 'Amit Sharma',
    officerName: 'Officer S. Sharma',
    riskLevel: 'Low'
  }
];

export const mockProducts: InsuranceProduct[] = [
  {
    id: 'PROD-1',
    name: 'IndiaFirst Smart Term Plan Plus',
    type: 'Term Insurance',
    tagline: 'High sum assured life protection for total family financial security.',
    minCoverage: 2500000,
    maxCoverage: 50000000,
    minPremiumMonthly: 1200,
    minAge: 18,
    maxAge: 65,
    waitingPeriod: 'Instant cover on issuance (Accidental on Day 1)',
    eligibility: 'Resident Indians, Salaried or Self-Employed with income proof',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Income Tax Returns (3 yrs) / Salary Slip', 'Medical Health Checkup'],
    benefits: ['Life Cover up to 80 Years', 'Terminal Illness Early Benefit', 'Tax Exemptions under Sec 80C & 10(10D)'],
    popular: true
  },
  {
    id: 'PROD-2',
    name: 'IndiaFirst Health Secure Shield',
    type: 'Health Insurance',
    tagline: 'Comprehensive hospitalization and cashless health coverage.',
    minCoverage: 500000,
    maxCoverage: 20000000,
    minPremiumMonthly: 1500,
    minAge: 18,
    maxAge: 70,
    waitingPeriod: '30 days initial waiting period; 24 months for specified illnesses',
    eligibility: 'All Indian citizens with standard health declaration',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Recent Medical Examination (if age > 45)'],
    benefits: ['10,000+ Network Hospitals', 'No Sub-limits on ICU Room Rent', 'Pre & Post Hospitalization Cover'],
    popular: true
  },
  {
    id: 'PROD-3',
    name: 'IndiaFirst Family Health Optima',
    type: 'Family Health',
    tagline: 'Floater health protection covering self, spouse, and children under one premium.',
    minCoverage: 1000000,
    maxCoverage: 25000000,
    minPremiumMonthly: 2200,
    minAge: 18,
    maxAge: 65,
    waitingPeriod: '30 days initial; 36 months for pre-existing conditions',
    eligibility: 'Family group up to 2 Adults + 3 Children',
    documentsRequired: ['PAN Card', 'Aadhaar Card of Primary Proposer', 'Birth Certificates for Children'],
    benefits: ['Maternity & Newborn Cover', 'Organ Donor Expenses Covered', 'Automatic Restoration of Sum Insured']
  },
  {
    id: 'PROD-4',
    name: 'IndiaFirst Critical Illness Rider Plan',
    type: 'Critical Illness',
    tagline: 'Lump sum payout upon diagnosis of 36 major critical illnesses.',
    minCoverage: 500000,
    maxCoverage: 10000000,
    minPremiumMonthly: 800,
    minAge: 18,
    maxAge: 60,
    waitingPeriod: '90 days waiting period; 30 days survival period after diagnosis',
    eligibility: 'Existing IndiaFirst policyholders or stand-alone life insured',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Medical Diagnosis Record'],
    benefits: ['Lump sum payment on first diagnosis', 'Waiver of future premiums', 'Covers Heart Attack, Cancer, Stroke']
  },
  {
    id: 'PROD-5',
    name: 'IndiaFirst Wealth Creator ULIP',
    type: 'ULIP',
    tagline: 'Dual benefit of market-linked wealth creation and life cover protection.',
    minCoverage: 1000000,
    maxCoverage: 30000000,
    minPremiumMonthly: 3000,
    minAge: 18,
    maxAge: 60,
    waitingPeriod: '5 Years Lock-in Period as per IRDAI guidelines',
    eligibility: 'Investors seeking long-term capital growth with life protection',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Cancelled Cheque', 'Bank Statement (6 Months)'],
    benefits: ['Choice of 8 Equity & Debt Funds', '4 Free Fund Switches per year', 'Return of Mortality Charges'],
    popular: true
  },
  {
    id: 'PROD-6',
    name: 'IndiaFirst Child Future Builder',
    type: 'Child Plan',
    tagline: 'Guaranteed milestone funding for your child higher education and dreams.',
    minCoverage: 1500000,
    maxCoverage: 20000000,
    minPremiumMonthly: 2500,
    minAge: 21,
    maxAge: 50,
    waitingPeriod: 'None; immediate coverage for proposer',
    eligibility: 'Parents or Legal Guardians with children aged 0 to 15 years',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Child Birth Certificate', 'Income Proof'],
    benefits: ['Inbuilt Waiver of Premium on parent passing', 'Guaranteed Annual Educational Payouts', 'Bonus Additions']
  },
  {
    id: 'PROD-7',
    name: 'IndiaFirst Guaranteed Pension Plan',
    type: 'Retirement Plan',
    tagline: 'Secure a regular, lifelong income stream after your working years.',
    minCoverage: 2000000,
    maxCoverage: 50000000,
    minPremiumMonthly: 5000,
    minAge: 30,
    maxAge: 70,
    waitingPeriod: 'Deferment Period chosen from 1 to 10 years',
    eligibility: 'Individuals planning retirement funding',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Age Proof', 'Bank Account Details'],
    benefits: ['Guaranteed Annuity Rate fixed at purchase', 'Option for Joint Annuity with Spouse', '100% Death Benefit Payout']
  },
  {
    id: 'PROD-8',
    name: 'IndiaFirst Smart Save Assurance',
    type: 'Savings Plan',
    tagline: 'Traditional non-participating endowment plan with guaranteed maturity returns.',
    minCoverage: 1000000,
    maxCoverage: 15000000,
    minPremiumMonthly: 2000,
    minAge: 18,
    maxAge: 55,
    waitingPeriod: 'Standard 30 days',
    eligibility: 'Salaried or business professionals seeking capital safety',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Address Proof'],
    benefits: ['Guaranteed Additions accrued yearly', 'Loans against policy available', 'Tax-free maturity under Sec 10(10D)']
  }
];

export const mockClaims: InsuranceClaim[] = [
  {
    id: 'CLM-101',
    claimNumber: 'IFL-CLM-3309',
    policyNumber: 'IFL-774120',
    policyName: 'IndiaFirst Health Secure Shield',
    customerName: 'Mohit Singh',
    customerId: 'CUST-88231',
    type: 'Hospitalization Reimbursement',
    claimAmount: 245000,
    hospitalName: 'Apollo Hospitals, Mumbai',
    incidentDate: '2026-07-02',
    submissionDate: '2026-07-05',
    status: 'Officer Verification',
    settlementProgress: 65,
    documents: ['Discharge Summary', 'Hospital Final Bill', 'Pharmacy Receipts', 'Doctor Prescription'],
    remarks: 'Medical officer verified line items. Pending final sanction by Officer S. Sharma.'
  },
  {
    id: 'CLM-102',
    claimNumber: 'IFL-CLM-3310',
    policyNumber: 'IFL-992384',
    policyName: 'IndiaFirst Term Protect Plus',
    customerName: 'Rajesh Sharma',
    customerId: 'CUST-88219',
    type: 'Critical Illness Benefit',
    claimAmount: 500000,
    hospitalName: 'Fortis Escorts, Delhi NCR',
    incidentDate: '2026-06-18',
    submissionDate: '2026-06-20',
    status: 'Approved',
    settlementProgress: 90,
    documents: ['Angiography Medical Report', 'Cardiologist Opinion', 'PAN & Bank Details'],
    remarks: 'Claim approved by Underwriting Committee. Direct bank transfer scheduled.'
  },
  {
    id: 'CLM-103',
    claimNumber: 'IFL-CLM-3311',
    policyNumber: 'IFL-883412',
    policyName: 'IndiaFirst Smart Save Plan',
    customerName: 'Priya Singh',
    customerId: 'CUST-88225',
    type: 'Maturity Payout Claim',
    claimAmount: 850000,
    hospitalName: 'N/A (Endowment Claim)',
    incidentDate: '2026-07-01',
    submissionDate: '2026-07-01',
    status: 'Settled',
    settlementProgress: 100,
    documents: ['Original Policy Document', 'Cancelled Cheque', 'Identity Proof'],
    remarks: 'Funds credited to beneficiary account via NEFT Ref #NEFT99281230.'
  }
];

export const mockRenewals: PolicyRenewal[] = [
  {
    id: 'REN-1',
    policyNumber: 'IFL-883412',
    policyName: 'IndiaFirst Smart Save Plan',
    customerName: 'Rajesh Sharma',
    dueDate: '2026-08-12',
    premiumAmount: 5000,
    status: 'Due',
    autoDebitEnabled: true,
    paymentMethod: 'Auto Debit (HDFC Bank e-NACH)'
  },
  {
    id: 'REN-2',
    policyNumber: 'IFL-992384',
    policyName: 'IndiaFirst Term Protect Plus',
    customerName: 'Rajesh Sharma',
    dueDate: '2026-09-05',
    premiumAmount: 12400,
    status: 'Due',
    autoDebitEnabled: false
  },
  {
    id: 'REN-3',
    policyNumber: 'IFL-774120',
    policyName: 'IndiaFirst Health Secure Shield',
    customerName: 'Rajesh Sharma',
    dueDate: '2027-02-20',
    premiumAmount: 18200,
    status: 'Paid',
    autoDebitEnabled: true,
    lastPaymentDate: '2026-02-18'
  }
];

export const mockDocuments: VerificationDocument[] = [
  {
    id: 'DOC-1',
    documentType: 'PAN',
    documentNumber: 'ABCPS9821K',
    uploadDate: '2026-01-15',
    status: 'Verified',
    fileUrl: '/docs/pan_card_rajesh.pdf',
    fileSize: '1.2 MB',
    verifiedBy: 'Officer S. Sharma',
    comments: 'PAN matched with NSDL Income Tax Database.'
  },
  {
    id: 'DOC-2',
    documentType: 'Aadhaar',
    documentNumber: 'XXXX-XXXX-8821',
    uploadDate: '2026-01-15',
    status: 'Verified',
    fileUrl: '/docs/aadhaar_rajesh.pdf',
    fileSize: '2.4 MB',
    verifiedBy: 'Officer S. Sharma',
    comments: 'Aadhaar XML verified with UIDAI OTP.'
  },
  {
    id: 'DOC-3',
    documentType: 'Medical Report',
    uploadDate: '2026-06-12',
    status: 'Verified',
    fileUrl: '/docs/blood_report_rajesh.pdf',
    fileSize: '3.8 MB',
    verifiedBy: 'Dr. V. Kulkarni (Medical Panel)',
    comments: 'All health parameters within normal range.'
  },
  {
    id: 'DOC-4',
    documentType: 'Health Declaration',
    uploadDate: '2026-07-10',
    status: 'Verified',
    fileUrl: '/docs/health_declaration.pdf',
    fileSize: '850 KB',
    verifiedBy: 'Amit Sharma'
  },
  {
    id: 'DOC-5',
    documentType: 'Proposal Form',
    uploadDate: '2026-07-20',
    status: 'Pending',
    fileUrl: '/docs/proposal_form_88219.pdf',
    fileSize: '1.9 MB',
    comments: 'Awaiting signature verification on Page 4.'
  },
  {
    id: 'DOC-6',
    documentType: 'Cancelled Cheque',
    uploadDate: '2026-07-22',
    status: 'Verified',
    fileUrl: '/docs/cancelled_cheque.pdf',
    fileSize: '920 KB',
    verifiedBy: 'Officer S. Sharma'
  }
];

export const mockSessions: ConsultationSession[] = [
  {
    id: 'SESS-101',
    title: 'New Policy Briefing & Underwriting Review',
    customerName: 'Rajesh Sharma',
    advisorName: 'Amit Sharma',
    officerName: 'Officer S. Sharma',
    dateTime: 'Today at 10:30 AM',
    status: 'Live',
    type: 'Video Consultation',
    locationOrUrl: 'Three-Way Video Room #IFL-CONF-8821',
    notes: 'Discussion regarding addition of Critical Illness rider and nominee verification.'
  },
  {
    id: 'SESS-102',
    title: 'Claim Settlement & Verification Meeting',
    customerName: 'D. Sharma',
    advisorName: 'Amit Sharma',
    officerName: 'Officer S. Sharma',
    dateTime: 'Tomorrow at 02:00 PM',
    status: 'Upcoming',
    type: 'In-Person',
    locationOrUrl: 'IndiaFirst Life Head Office - Conference Room B',
    notes: 'Review medical bill original physical receipts.'
  },
  {
    id: 'SESS-103',
    title: 'ULIP Portfolio & Switch Guidance',
    customerName: 'Priya Singh',
    advisorName: 'Anjali Mehta',
    officerName: 'Officer S. Sharma',
    dateTime: 'Yesterday at 04:30 PM',
    status: 'Completed',
    type: 'Video Consultation',
    locationOrUrl: 'Three-Way Room #IFL-CONF-7712',
    notes: 'Reallocated 20% equity funds into debt funds.'
  }
];

export const mockKYCRecords: KYCRecord[] = [
  {
    id: 'KYC-88219',
    customerId: 'CUST-88219',
    customerName: 'Rajesh Sharma',
    panNumber: 'ABCPS9821K',
    panStatus: 'Verified',
    aadhaarNumberMasked: 'XXXX-XXXX-8821',
    aadhaarStatus: 'Verified',
    addressStatus: 'Verified',
    otpVerified: true,
    overallStatus: 'Verified',
    submittedDate: '2026-01-15',
    verifiedByOfficer: 'Officer S. Sharma',
    remarks: 'Full KYC completed and verified against Government portals.'
  },
  {
    id: 'KYC-88225',
    customerId: 'CUST-88225',
    customerName: 'Priya Singh',
    panNumber: 'BKPPS1029L',
    panStatus: 'Verified',
    aadhaarNumberMasked: 'XXXX-XXXX-1029',
    aadhaarStatus: 'Pending',
    addressStatus: 'Pending',
    otpVerified: false,
    overallStatus: 'Pending Review',
    submittedDate: '2026-07-28',
    remarks: 'Aadhaar OTP verification pending customer input.'
  },
  {
    id: 'KYC-88240',
    customerId: 'CUST-88240',
    customerName: 'Anil Mehta',
    panNumber: 'AMZPM4412Q',
    panStatus: 'Verified',
    aadhaarNumberMasked: 'XXXX-XXXX-4412',
    aadhaarStatus: 'Verified',
    addressStatus: 'Verified',
    otpVerified: true,
    overallStatus: 'Verified',
    submittedDate: '2026-06-10',
    verifiedByOfficer: 'Officer S. Sharma'
  }
];

export const mockProposals: PolicyProposal[] = [
  {
    id: 'PROP-201',
    proposalNumber: 'IFL-PROP-9021',
    customerName: 'Rajesh Kumar',
    advisorName: 'Amit Sharma',
    productName: 'IndiaFirst Smart Term Plan Plus',
    coverageAmount: 10000000,
    calculatedPremium: 28800,
    termYears: 30,
    createdDate: '2026-07-25',
    status: 'Shared',
    taxBenefit80C: 28800
  },
  {
    id: 'PROP-202',
    proposalNumber: 'IFL-PROP-9022',
    customerName: 'Ananya Iyer',
    advisorName: 'Amit Sharma',
    productName: 'IndiaFirst Wealth Creator ULIP',
    coverageAmount: 3500000,
    calculatedPremium: 120000,
    termYears: 10,
    createdDate: '2026-07-28',
    status: 'Draft',
    taxBenefit80C: 120000
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'AUD-1',
    timestamp: 'Today, 14:22:10',
    administrator: 'Rajesh Kumar (Advisor)',
    action: 'Policy Document Upload',
    resource: '#IFL-2024-8822',
    ipAddress: '10.0.42.181',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-2',
    timestamp: 'Today, 13:58:45',
    administrator: 'System Auth Engine',
    action: 'API Key Rotation',
    resource: 'Gateway_Main',
    ipAddress: 'Internal Cloud',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-3',
    timestamp: 'Today, 13:12:02',
    administrator: 'Ananya Sharma (Officer)',
    action: 'Claim Approval Override',
    resource: '#IFL-CLM-9031',
    ipAddress: '10.0.12.55',
    status: 'MFA REQ'
  },
  {
    id: 'AUD-4',
    timestamp: 'Today, 12:45:33',
    administrator: 'Officer S. Sharma',
    action: 'Manual KYC Approval',
    resource: 'CUST-88219 (PAN Verified)',
    ipAddress: '192.168.1.5',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-5',
    timestamp: 'Today, 11:20:18',
    administrator: 'Vikram Singh (Admin)',
    action: 'Role Permission Group Update',
    resource: 'Region_West_Team',
    ipAddress: '10.0.42.92',
    status: 'SUCCESS'
  }
];
