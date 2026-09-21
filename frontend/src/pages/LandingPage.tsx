import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, PlayCircle, CheckCircle2, LockKeyhole, 
  Users, FileCheck2, BarChart3 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative isolate px-4 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-20">
        <div className="absolute inset-x-0 top-0 -z-10 h-[31rem] bg-gradient-to-br from-emerald-100 via-white to-cyan-100" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
              <CheckCircle2 size={14} /> Built for modern CA practices
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Tax compliance, <span className="text-emerald-600">handled together.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              TaxMeld gives CA firms one secure place to manage clients, request documents, track filings, and deliver final acknowledgements.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
                Create your firm account <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                Sign in
              </Link>
              <Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">
                <PlayCircle size={17} /> Start free demo
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">No credit card required for the current MVP.</p>
          </div>

          <div id="demo" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/60 sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2"><img src="/taxmeld-logo.png" alt="TaxMeld" className="h-9 w-auto" /></div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Demo workspace</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[['24', 'Active clients'], ['18', 'Files received'], ['96%', 'On-time filings']].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-lg font-extrabold text-slate-900">{value}</p><p className="mt-1 text-[10px] font-medium text-slate-500">{label}</p></div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-800">Filing activity</p><span className="text-[10px] text-slate-400">Sample view</span></div>
              <div className="mt-5 flex h-24 items-end gap-2">
                {[38, 54, 42, 70, 58, 86, 74].map((height, index) => <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-emerald-600 to-cyan-400" style={{ height: `${height}%` }} />)}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-slate-400"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">One simple workflow</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Everything your practice needs to stay organised.</h2></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              [Users, 'Client workspace', 'Create a secure client portal for every filing and service.'],
              [FileCheck2, 'Document collection', 'Request, receive, review, and manage required documents in one place.'],
              [BarChart3, 'Live filing visibility', 'Track every client workflow from documents requested to final delivery.'],
            ].map(([Icon, title, description]) => {
              const FeatureIcon = Icon as typeof Users;
              return <div key={title as string} className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-lg"><div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"><FeatureIcon size={22} /></div><h3 className="mt-4 font-bold text-slate-900">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description as string}</p></div>;
            })}
          </div>
          <div className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900"><LockKeyhole size={16} className="shrink-0" /> Client access uses individual secure tracking links. Always use a dedicated object-storage service before uploading real confidential files.</div>
        </div>
      </section>
    </div>
  );
}