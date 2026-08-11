export type PortalRole = 'customer' | 'advisor' | 'officer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PortalRole;
  designation: string;
  avatar: string;
  branch?: string;
  assignedAdvisor?: string;
  assignedOfficer?: string;
  protectionScore?: number;
}

export type PolicyType = 
  | 'Term Insurance' 
  | 'Health Insurance' 
  | 'Family Health' 
  | 'Critical Illness' 
  | 'ULIP' 
  | 'Child Plan' 
  | 'Retirement Plan' 
  | 'Savings Plan';

export type PolicyStatus = 'Active' | 'Pending' | 'Due' | 'Lapsed' | 'Verified' | 'Under Review';

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  policyName: string;
  type: PolicyType;
  coverageAmount: number; // e.g. 5000000 for 50 Lakhs
  premiumAmount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  termYears: number;
  status: PolicyStatus;
  nomineeName: string;
  nomineeRelation: string;
  issueDate: string;
  nextRenewalDate: string;
  benefits: string[];
  customerName: string;
  customerId: string;
  advisorName: string;
  officerName: string;
  riskLevel?: 'Low' | 'Medium' | 'Critical';
}

export interface InsuranceProduct {
  id: string;
  name: string;
  type: PolicyType;
  tagline: string;
  minCoverage: number;
  maxCoverage: number;
  minPremiumMonthly: number;
  minAge: number;
  maxAge: number;
  waitingPeriod: string;
  eligibility: string;
  documentsRequired: string[];
  benefits: string[];
  popular?: boolean;
}

export type ClaimStatus = 'Submitted' | 'Under Medical Review' | 'Officer Verification' | 'Approved' | 'Rejected' | 'Settled';

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  policyName: string;
  customerName: string;
  customerId: string;
  type: string;
  claimAmount: number;
  hospitalName: string;
  incidentDate: string;
  submissionDate: string;
  status: ClaimStatus;
  settlementProgress: number; // percentage 0 - 100
  documents: string[];
  remarks: string;
}

export interface PolicyRenewal {
  id: string;
  policyNumber: string;
  policyName: string;
  customerName: string;
  dueDate: string;
  premiumAmount: number;
  status: 'Due' | 'Paid' | 'Overdue';
  autoDebitEnabled: boolean;
  paymentMethod?: string;
  lastPaymentDate?: string;
}

export interface VerificationDocument {
  id: string;
  documentType: 'PAN' | 'Aadhaar' | 'Medical Report' | 'Health Declaration' | 'Proposal Form' | 'Policy Document' | 'Nominee Form' | 'Cancelled Cheque';
  documentNumber?: string;
  uploadDate: string;
  status: 'Verified' | 'Pending' | 'Rejected' | 'Resubmission Required';
  fileUrl?: string;
  fileSize?: string;
  verifiedBy?: string;
  comments?: string;
}

export interface ConsultationSession {
  id: string;
  title: string;
  customerName: string;
  advisorName: string;
  officerName: string;
  dateTime: string;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
  type: 'Video Consultation' | 'In-Person' | 'Policy Briefing';
  locationOrUrl: string;
  notes?: string;
}

export interface KYCRecord {
  id: string;
  customerId: string;
  customerName: string;
  panNumber: string;
  panStatus: 'Verified' | 'Pending' | 'Failed';
  aadhaarNumberMasked: string;
  aadhaarStatus: 'Verified' | 'Pending' | 'Failed';
  addressStatus: 'Verified' | 'Pending' | 'Failed';
  otpVerified: boolean;
  overallStatus: 'Verified' | 'Pending Review' | 'Action Required';
  submittedDate: string;
  verifiedByOfficer?: string;
  remarks?: string;
}

export interface PolicyProposal {
  id: string;
  proposalNumber: string;
  customerName: string;
  advisorName: string;
  productName: string;
  coverageAmount: number;
  calculatedPremium: number;
  termYears: number;
  createdDate: string;
  status: 'Draft' | 'Shared' | 'Approved' | 'Rejected';
  taxBenefit80C: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  administrator: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'SUCCESS' | 'MFA REQ' | 'FAILED';
}
