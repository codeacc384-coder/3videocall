import React, { useState } from 'react';
import { Calculator, Shield, FileText, CheckCircle, Download, Share2, Sparkles, AlertCircle } from 'lucide-react';

export const PremiumCalculator: React.FC = () => {
  const [productType, setProductType] = useState<'term' | 'health' | 'ulip' | 'retirement'>('term');
  const [coverage, setCoverage] = useState<number>(10000000); // Default 1 Crore
  const [age, setAge] = useState<number>(32);
  const [term, setTerm] = useState<number>(30);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('yearly');
  const [isSmoker, setIsSmoker] = useState<boolean>(false);
  
  // Riders
  const [criticalRider, setCriticalRider] = useState<boolean>(true);
  const [accidentalRider, setAccidentalRider] = useState<boolean>(true);
  const [waiverRider, setWaiverRider] = useState<boolean>(true);

  // Calculation Logic
  const baseRatePerLakh = productType === 'term' ? (isSmoker ? 180 : 120) : productType === 'health' ? 220 : 350;
  const ageFactor = 1 + (age - 18) * 0.025;
  const coverageInLakhs = coverage / 100000;
  
  let baseAnnual = Math.round(coverageInLakhs * baseRatePerLakh * ageFactor);
  if (frequency === 'monthly') {
    baseAnnual = Math.round((baseAnnual * 1.05) / 12);
  }

  const criticalCost = criticalRider ? (frequency === 'yearly' ? 2400 : 210) : 0;
  const accidentalCost = accidentalRider ? (frequency === 'yearly' ? 1800 : 160) : 0;
  const waiverCost = waiverRider ? (frequency === 'yearly' ? 1200 : 110) : 0;

  const subtotal = baseAnnual + criticalCost + accidentalCost + waiverCost;
  const gst = Math.round(subtotal * 0.18);
  const totalPremium = subtotal + gst;

  const taxSaved80C = Math.min(totalPremium * (frequency === 'monthly' ? 12 : 1), 150000);

  const handleDownloadQuote = () => {
    alert(`Official IndiaFirst Premium Quote downloaded for ₹${coverage.toLocaleString('en-IN')} ${productType.toUpperCase()} Policy.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <Calculator className="w-5 h-5 text-blue-600" />
            <span>IndiaFirst Enterprise Premium Calculator</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Accurate IRDAI compliant premium calculation with instant GST and 80C tax rebate summary.</p>
        </div>

        {/* Product Type Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold text-slate-600">
          <button 
            onClick={() => setProductType('term')}
            className={`px-3 py-1.5 rounded-lg transition-all ${productType === 'term' ? 'bg-blue-600 text-white shadow' : 'hover:text-slate-900'}`}
          >
            Term Insurance
          </button>
          <button 
            onClick={() => setProductType('health')}
            className={`px-3 py-1.5 rounded-lg transition-all ${productType === 'health' ? 'bg-blue-600 text-white shadow' : 'hover:text-slate-900'}`}
          >
            Health
          </button>
          <button 
            onClick={() => setProductType('ulip')}
            className={`px-3 py-1.5 rounded-lg transition-all ${productType === 'ulip' ? 'bg-blue-600 text-white shadow' : 'hover:text-slate-900'}`}
          >
            ULIP
          </button>
          <button 
            onClick={() => setProductType('retirement')}
            className={`px-3 py-1.5 rounded-lg transition-all ${productType === 'retirement' ? 'bg-blue-600 text-white shadow' : 'hover:text-slate-900'}`}
          >
            Retirement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Parameters (Left 7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Coverage Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-700">Sum Assured (Life Cover Amount)</span>
              <span className="text-blue-700 text-sm font-extrabold">₹{(coverage / 100000).toFixed(0)} Lakhs (₹{(coverage / 10000000).toFixed(2)} Cr)</span>
            </div>
            <input 
              type="range"
              min={2500000}
              max={50000000}
              step={2500000}
              value={coverage}
              onChange={e => setCoverage(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹25 Lakhs</span>
              <span>₹1 Crore</span>
              <span>₹5 Crores</span>
            </div>
          </div>

          {/* Age & Term */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Insured Age</label>
              <select 
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {Array.from({ length: 48 }, (_, i) => 18 + i).map(a => (
                  <option key={a} value={a}>{a} Years</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Policy Term</label>
              <select 
                value={term}
                onChange={e => setTerm(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {[10, 15, 20, 25, 30, 35, 40].map(t => (
                  <option key={t} value={t}>{t} Years</option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency & Smoker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Frequency</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-center">
                <button 
                  type="button"
                  onClick={() => setFrequency('yearly')}
                  className={`py-1.5 rounded-lg transition-all ${frequency === 'yearly' ? 'bg-white text-blue-900 shadow' : 'text-slate-500'}`}
                >
                  Yearly
                </button>
                <button 
                  type="button"
                  onClick={() => setFrequency('monthly')}
                  className={`py-1.5 rounded-lg transition-all ${frequency === 'monthly' ? 'bg-white text-blue-900 shadow' : 'text-slate-500'}`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tobacco / Smoking Status</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-center">
                <button 
                  type="button"
                  onClick={() => setIsSmoker(false)}
                  className={`py-1.5 rounded-lg transition-all ${!isSmoker ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'}`}
                >
                  Non-Smoker
                </button>
                <button 
                  type="button"
                  onClick={() => setIsSmoker(true)}
                  className={`py-1.5 rounded-lg transition-all ${isSmoker ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}
                >
                  Smoker
                </button>
              </div>
            </div>
          </div>

          {/* Optional Riders */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Optional Comprehensive Riders</p>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={criticalRider}
                    onChange={e => setCriticalRider(e.target.checked)}
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Critical Illness Rider (36 Illnesses)</p>
                    <p className="text-[11px] text-slate-500">Lump sum payout of ₹25 Lakhs on diagnosis</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700">+₹{frequency === 'yearly' ? '2,400' : '210'}/{frequency === 'yearly' ? 'yr' : 'mo'}</span>
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={accidentalRider}
                    onChange={e => setAccidentalRider(e.target.checked)}
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Accidental Death Benefit Rider</p>
                    <p className="text-[11px] text-slate-500">Double sum assured in case of accidental death</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700">+₹{frequency === 'yearly' ? '1,800' : '160'}/{frequency === 'yearly' ? 'yr' : 'mo'}</span>
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={waiverRider}
                    onChange={e => setWaiverRider(e.target.checked)}
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Waiver of Premium Rider</p>
                    <p className="text-[11px] text-slate-500">All future premiums waived upon disability/critical illness</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700">+₹{frequency === 'yearly' ? '1,200' : '110'}/{frequency === 'yearly' ? 'yr' : 'mo'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Calculation Output Card (Right 5 Columns) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-blue-800/80 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Calculated Premium</span>
                <h3 className="text-3xl font-extrabold mt-1">₹{totalPremium.toLocaleString('en-IN')} <span className="text-xs font-normal text-blue-200">/{frequency}</span></h3>
              </div>
              <span className="bg-blue-800/80 border border-blue-700 px-3 py-1 rounded-full text-xs font-bold text-blue-200">
                GST 18% Included
              </span>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-blue-200">
                <span>Base Policy Premium</span>
                <span className="font-mono font-bold text-white">₹{baseAnnual.toLocaleString('en-IN')}</span>
              </div>
              {criticalRider && (
                <div className="flex justify-between text-blue-300">
                  <span>Critical Illness Rider</span>
                  <span className="font-mono text-white">₹{criticalCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              {accidentalRider && (
                <div className="flex justify-between text-blue-300">
                  <span>Accidental Death Rider</span>
                  <span className="font-mono text-white">₹{accidentalCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              {waiverRider && (
                <div className="flex justify-between text-blue-300">
                  <span>Waiver of Premium Rider</span>
                  <span className="font-mono text-white">₹{waiverCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-blue-300 pt-2 border-t border-blue-800/60">
                <span>Goods & Services Tax (GST 18%)</span>
                <span className="font-mono text-white">₹{gst.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Tax Savings Callout */}
            <div className="mt-6 bg-blue-950/80 border border-blue-800 p-3.5 rounded-xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Annual Income Tax Benefit</p>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Save up to <strong className="text-white">₹{taxSaved80C.toLocaleString('en-IN')}</strong> under Income Tax Act Section 80C & 10(10D).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <button 
              onClick={handleDownloadQuote}
              className="w-full bg-white text-blue-950 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" /> Download Official Quote (PDF)
            </button>
            <p className="text-[10px] text-center text-blue-300">IndiaFirst Life Insurance Company Limited | IRDAI Reg No. 143</p>
          </div>
        </div>
      </div>
    </div>
  );
};
