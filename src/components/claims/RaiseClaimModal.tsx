import React, { useState } from 'react';
import { ShieldAlert, FileText, Upload, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import { InsuranceClaim, InsurancePolicy } from '../../types/insurance';

interface RaiseClaimModalProps {
  policies: InsurancePolicy[];
  onClose: () => void;
  onSubmitClaim: (newClaim: Partial<InsuranceClaim>) => void;
}

export const RaiseClaimModal: React.FC<RaiseClaimModalProps> = ({ policies, onClose, onSubmitClaim }) => {
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState(policies[0]?.policyNumber || 'IFL-774120');
  const [claimType, setClaimType] = useState('Hospitalization Reimbursement');
  const [hospitalName, setHospitalName] = useState('Apollo Hospitals, Mumbai');
  const [incidentDate, setIncidentDate] = useState('2026-07-28');
  const [claimAmount, setClaimAmount] = useState(150000);
  const [remarks, setRemarks] = useState('Emergency admission for gallbladder surgery.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPol = policies.find(p => p.policyNumber === selectedPolicyNumber);
    onSubmitClaim({
      claimNumber: `IFL-CLM-${Math.floor(1000 + Math.random() * 9000)}`,
      policyNumber: selectedPolicyNumber,
      policyName: selectedPol?.policyName || 'IndiaFirst Health Secure Shield',
      customerName: selectedPol?.customerName || 'Rajesh Sharma',
      customerId: selectedPol?.customerId || 'CUST-88219',
      type: claimType,
      claimAmount,
      hospitalName,
      incidentDate,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      settlementProgress: 15,
      documents: ['Discharge Summary', 'Hospital Final Bill'],
      remarks
    });
    alert('New claim request submitted successfully to IndiaFirst Life Claims Desk.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-6 animate-fade-in">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Raise New Insurance Claim</h3>
              <p className="text-xs text-slate-500">Official IndiaFirst Life Claims Intimation Form</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 mb-1">Select Active Insurance Policy</label>
            <select 
              value={selectedPolicyNumber}
              onChange={e => setSelectedPolicyNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
            >
              {policies.map(p => (
                <option key={p.id} value={p.policyNumber}>
                  {p.policyName} ({p.policyNumber}) — Cover: ₹{(p.coverageAmount/100000).toFixed(0)}L
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1">Claim Type</label>
              <select 
                value={claimType}
                onChange={e => setClaimType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium"
              >
                <option value="Hospitalization Reimbursement">Hospitalization Reimbursement</option>
                <option value="Cashless Treatment">Cashless Hospital Treatment</option>
                <option value="Critical Illness Benefit">Critical Illness Lump Sum Benefit</option>
                <option value="Accidental Death / Disability">Accidental Benefit</option>
                <option value="Maturity Claim">Maturity Benefit</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Estimated Claim Amount (₹)</label>
              <input 
                type="number"
                value={claimAmount}
                onChange={e => setClaimAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1">Hospital / Clinic Name</label>
              <input 
                type="text"
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
                placeholder="e.g. Apollo Hospitals"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Date of Admission / Incident</label>
              <input 
                type="date"
                value={incidentDate}
                onChange={e => setIncidentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Upload Medical Documents (Discharge Summary, Bills, Prescription)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-slate-700 font-bold">Drag and drop or click to upload PDF / Scans</p>
              <p className="text-[10px] text-slate-400">Supported formats: PDF, JPG, PNG (Max 15MB)</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Clinical Remarks / Doctor Notes</label>
            <textarea 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-normal focus:outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
            >
              Submit Claim Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
