import React, { useState } from 'react';
import { BadgeCheck, CreditCard, ShieldCheck, FileCheck, CheckCircle2, Clock, AlertTriangle, Send, Lock } from 'lucide-react';
import { mockKYCRecords } from '../../data/mockInsuranceData';

export const KYCVerificationModule: React.FC = () => {
  const [panInput, setPanInput] = useState('ABCPS9821K');
  const [panVerified, setPanVerified] = useState(true);
  const [aadhaarInput, setAadhaarInput] = useState('882199201029');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('482910');
  const [aadhaarVerified, setAadhaarVerified] = useState(true);
  const [addressVerified, setAddressVerified] = useState(true);

  const handleVerifyPAN = (e: React.FormEvent) => {
    e.preventDefault();
    if (panInput.length === 10) {
      setPanVerified(true);
      alert(`PAN ${panInput.toUpperCase()} verified with NSDL Income Tax Portal database.`);
    } else {
      alert('Please enter a valid 10-character PAN number.');
    }
  };

  const handleSendAadhaarOTP = () => {
    if (aadhaarInput.length === 12) {
      setOtpSent(true);
      alert(`6-digit OTP sent to Aadhaar registered mobile ending in ****8821.`);
    } else {
      alert('Please enter a valid 12-digit Aadhaar number.');
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length === 6) {
      setAadhaarVerified(true);
      alert('Aadhaar XML verified successfully via UIDAI OTP gateway.');
    } else {
      alert('Enter 6-digit OTP.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg text-blue-950">
            <BadgeCheck className="w-6 h-6 text-blue-600" />
            <span>IndiaFirst Life Standard KYC Verification</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Regulatory compliance verification portal for PAN, Aadhaar XML, Address, and Officer approval.</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Overall Status: KYC Verified</span>
        </div>
      </div>

      {/* Grid of Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. PAN Verification Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>PAN Verification</span>
            </div>
            {panVerified ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                NSDL Verified
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Pending
              </span>
            )}
          </div>

          <form onSubmit={handleVerifyPAN} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Permanent Account Number (PAN)</label>
              <input 
                type="text"
                value={panInput}
                onChange={e => setPanInput(e.target.value.toUpperCase())}
                placeholder="ABCPS1234K"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              Verify with NSDL Database
            </button>
          </form>
          
          <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
            <p><strong>Name on PAN:</strong> RAJESH SHARMA</p>
            <p><strong>Tax Status:</strong> Individual Resident</p>
          </div>
        </div>

        {/* 2. Aadhaar OTP Verification Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Aadhaar OTP Verification</span>
            </div>
            {aadhaarVerified ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                UIDAI Verified
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Pending OTP
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">12-Digit Aadhaar Number</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={aadhaarInput}
                  onChange={e => setAadhaarInput(e.target.value)}
                  placeholder="12 digit Aadhaar"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
                <button 
                  type="button"
                  onClick={handleSendAadhaarOTP}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Get OTP
                </button>
              </div>
            </div>

            {otpSent && (
              <form onSubmit={handleVerifyOTP} className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600">Enter UIDAI 6-Digit OTP</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                  >
                    Confirm OTP
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
            <p><strong>Masked Aadhaar:</strong> XXXX-XXXX-8821</p>
            <p><strong>Address Match:</strong> 100% Match with Policy Proposal</p>
          </div>
        </div>

        {/* 3. Officer Verification & Compliance Checklist */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>IndiaFirst Officer Manual Verification</span>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Officer Approved
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-700">Identity & Name Cross-check</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-700">Permanent Address Proof</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-700">AML & PEP Sanction List Check</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-700">Medical Examination Verification</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
            <p><strong>Approved Officer:</strong> Officer S. Sharma</p>
            <p><strong>Verification Date:</strong> 15-Jan-2026 | 11:20 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
};
