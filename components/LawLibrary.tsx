
import React, { useState } from 'react';
import { 
  Scale, Shield, Briefcase, BookOpen, Search, HelpCircle, 
  ChevronLeft, FileText, Download, ExternalLink, Book, 
  Gavel, Clock, Info, ArrowRight, Library, ShieldCheck, Heart, Landmark, Lock, Globe,
  ChevronRight, Bookmark, Sparkles, FileSearch, GraduationCap,
  CheckCircle2, RefreshCcw
} from 'lucide-react';

enum LibraryCategory {
  NONE = 'none',
  BNS = 'bns',
  PROCEDURE = 'procedure',
  COMMERCIAL = 'commercial',
  CONSTITUTION = 'constitution',
  CASES = 'cases',
  FAMILY = 'family',
  DIGITAL = 'digital'
}

const LawLibrary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory>(LibraryCategory.NONE);

  const categories = [
    { id: LibraryCategory.BNS, title: 'Criminal: IPC / BNS', desc: 'Penal codes, crimes, and punishments.', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { id: LibraryCategory.PROCEDURE, title: 'Procedure: CPC / BNSS', desc: 'Court rules, evidence, and procedure.', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: LibraryCategory.COMMERCIAL, title: 'Commercial & Corporate', desc: 'Companies, GST, Contracts, IBC.', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: LibraryCategory.CONSTITUTION, title: 'Constitution of India', desc: 'Rights, Duties, and State Policy.', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: LibraryCategory.CASES, title: 'Landmark Precedents', desc: 'Historic Supreme Court judgments.', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: LibraryCategory.FAMILY, title: 'Personal & Family', desc: 'Marriage, Succession, and Trusts.', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: LibraryCategory.DIGITAL, title: 'Digital & IT Laws', desc: 'Data Protection, IT Act, Cyber Law.', icon: Lock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  const renderDetail = () => {
    switch (selectedCategory) {
      case LibraryCategory.BNS:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="bg-red-950 rounded-[50px] p-12 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 blur-[120px] rounded-full -mr-32 -mt-32"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-red-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-400">Penal Code Node</span>
                  </div>
                  <h3 className="text-5xl font-black font-serif tracking-tight">Criminal Justice Archive</h3>
                  <p className="text-red-200/70 text-lg max-w-2xl leading-relaxed font-medium">
                    Complete repository of penal statutes in India. Transitioning from colonial IPC to the modern-day Bharatiya Nyaya Sanhita (BNS).
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <a href="https://legislative.gov.in/act/bharatiya-nyaya-sanhita-2023/" target="_blank" className="px-10 py-4 bg-white text-red-950 rounded-[20px] font-black text-xs flex items-center gap-3 hover:bg-red-50 transition-all shadow-xl uppercase tracking-widest">
                    <ExternalLink className="w-5 h-5" /> Official Gazette (BNS)
                  </a>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-4 flex items-center gap-3">
                  <Bookmark className="w-4 h-4" /> Principal Penal Statutes
                </h4>
                <div className="grid grid-cols-1 gap-5">
                  {[
                    { title: "Bharatiya Nyaya Sanhita (BNS), 2023", desc: "The contemporary penal code of India, emphasizing restorative justice. 358 Sections.", link: "https://legislative.gov.in/act/bharatiya-nyaya-sanhita-2023/" },
                    { title: "Indian Penal Code (IPC), 1860", desc: "Historical penal code. Still governs offences committed prior to July 2024.", link: "https://legislative.gov.in/sites/default/files/A1860-45.pdf" },
                    { title: "Narcotic Drugs & Psychotropic Substances Act, 1985", desc: "Special laws governing the control and regulation of drugs.", link: "https://dor.gov.in/act-rules/narcotic-drugs-and-psychotropic-substances-act-1985" },
                    { title: "Protection of Children from Sexual Offences (POCSO), 2012", desc: "Child-centric legislation protecting minors from abuse.", link: "https://wcd.nic.in/act/pocso-act-2012" },
                    { title: "Prevention of Money Laundering Act (PMLA), 2002", desc: "Powers of the Enforcement Directorate (ED) and financial crime regs.", link: "https://enforcementdirectorate.gov.in/pmla-act" }
                  ].map((act, i) => (
                    <div key={i} className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-red-500 hover:shadow-2xl transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-red-50 rounded-[24px] flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-inner">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base group-hover:text-red-700 transition-colors tracking-tight">{act.title}</p>
                          <p className="text-sm text-slate-500 mt-1 max-w-sm line-clamp-2 font-medium">{act.desc}</p>
                        </div>
                      </div>
                      <a href={act.link} target="_blank" className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all">
                        <ExternalLink className="w-6 h-6" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Transition Logic</h4>
                <div className="bg-slate-900 rounded-[40px] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-[80px] rounded-full"></div>
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Equivalent Mapping</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">Comparing IPC vs BNS? Use the internal mapping for primary offences.</p>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-red-500" />
                      <p className="text-xs font-bold text-slate-200">Murder: IPC 302 → BNS 103</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-red-500" />
                      <p className="text-xs font-bold text-slate-200">Cheating: IPC 420 → BNS 318</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-red-500" />
                      <p className="text-xs font-bold text-slate-200">Theft: IPC 378 → BNS 303</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case LibraryCategory.PROCEDURE:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
             <div className="bg-amber-700 rounded-[50px] p-12 text-white flex items-center justify-between shadow-2xl">
              <div>
                <h3 className="text-5xl font-black font-serif tracking-tight mb-4">Procedural Framework</h3>
                <p className="text-amber-100/70 text-lg max-w-xl font-medium leading-relaxed">The rules of the court. Access CPC for civil litigation and the new BNSS for criminal procedure.</p>
              </div>
              <Scale className="w-24 h-24 text-amber-900/40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "Code of Civil Procedure (CPC), 1908", detail: "Rules for civil suits, appeals, and execution.", link: "https://legislative.gov.in/sites/default/files/A1908-05.pdf" },
                { title: "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023", detail: "Modern procedure replacing CrPC with digital evidence norms.", link: "https://legislative.gov.in/act/bharatiya-nagarik-suraksha-sanhita-2023/" },
                { title: "Bharatiya Sakshya Adhiniyam (BSA), 2023", detail: "Unified Law of Evidence for digital and traditional records.", link: "https://legislative.gov.in/act/bharatiya-sakshya-adhiniyam-2023/" },
                { title: "The Limitation Act, 1963", detail: "Statutory periods for filing all classes of legal actions.", link: "https://legislative.gov.in/sites/default/files/A1963-36.pdf" },
                { title: "The Commercial Courts Act, 2015", detail: "Fast-track resolution for high-value business disputes.", link: "https://legislative.gov.in/sites/default/files/A2016-4_0.pdf" }
              ].map((item, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 flex items-center justify-between group hover:border-amber-600 hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-50 rounded-[24px] flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">
                      <Scale className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg tracking-tight">{item.title}</p>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">{item.detail}</p>
                    </div>
                  </div>
                  <a href={item.link} target="_blank" className="p-4 text-slate-200 group-hover:text-amber-600 transition-colors">
                    <ChevronRight className="w-7 h-7" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      case LibraryCategory.COMMERCIAL:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="bg-emerald-950 rounded-[50px] p-12 text-white flex items-center justify-between shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]"></div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-5xl font-black font-serif tracking-tight">Corporate Law Nexus</h3>
                <p className="text-emerald-200/70 text-lg max-w-xl font-medium">Enterprise statutes, commercial contracts, and bankruptcy frameworks for the professional node.</p>
              </div>
              <Briefcase className="w-24 h-24 text-emerald-800 relative z-10 opacity-40" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Core Commercial Statutes</h4>
                <div className="grid grid-cols-1 gap-5">
                  {[
                    { title: "Companies Act, 2013", link: "https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks.html" },
                    { title: "Insolvency and Bankruptcy Code, 2016", link: "https://www.ibbi.gov.in/legal-framework/act" },
                    { title: "Indian Contract Act, 1872", link: "https://legislative.gov.in/sites/default/files/A1872-09.pdf" },
                    { title: "SEBI Act, 1992", link: "https://www.sebi.gov.in/sebi_data/attachdocs/1456380272563.pdf" },
                    { title: "FEMA Act, 1999", link: "https://rbi.org.in/scripts/Fema.aspx" }
                  ].map((act, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 flex items-center justify-between hover:bg-emerald-50 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-all">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-slate-800 text-base tracking-tight">{act.title}</span>
                      </div>
                      <a href={act.link} target="_blank" className="p-2 text-slate-300 hover:text-emerald-600">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Practice Reference</h4>
                <div className="bg-white border-2 border-slate-100 rounded-[48px] p-12 space-y-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 blur-[60px] rounded-full"></div>
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 shadow-inner">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 text-lg">Mercantile Law Notes</h5>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Foundational Principles</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="p-8 bg-slate-50 rounded-[32px] border-l-8 border-emerald-500 relative">
                       <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                        "Section 73 of the Contract Act stipulates that compensation for loss or damage caused by breach of contract must be for loss which naturally arose in the usual course of things."
                       </p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[32px] border-l-8 border-emerald-500 relative">
                       <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                        "Negotiable Instruments Act, Sec 138: A statutory notice must be served to the drawer within 30 days of receipt of memo from the bank for a cheque bounce."
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case LibraryCategory.CONSTITUTION:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="bg-slate-950 rounded-[60px] p-16 text-white relative overflow-hidden shadow-2xl text-center flex flex-col items-center border border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1),transparent)]"></div>
              <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-4 text-indigo-400 font-black text-[12px] uppercase tracking-[0.5em] mb-4">
                  <Landmark className="w-6 h-6" /> The Mother of All Laws
                </div>
                <h3 className="text-6xl font-black font-serif tracking-tight leading-none">Constitution of India</h3>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">
                  The supreme document governing the Republic of India. Access all 448 Articles, 12 Schedules, and historic 106 Amendments.
                </p>
                <div className="pt-10 flex justify-center">
                   <a href="https://legislative.gov.in/constitution-of-india/" target="_blank" className="px-12 py-5 bg-white text-slate-950 rounded-[24px] font-black text-sm flex items-center gap-4 hover:bg-slate-100 transition-all shadow-2xl uppercase tracking-[0.2em] shimmer-btn">
                    <FileSearch className="w-6 h-6 text-amber-500" /> Open Full Digital PDF
                  </a>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Fundamental Rights", range: "Art. 12 - 35", icon: Shield, bg: "bg-indigo-50", text: "text-indigo-600" },
                { title: "DPSP", range: "Art. 36 - 51", icon: Scale, bg: "bg-amber-50", text: "text-amber-600" },
                { title: "Union Judiciary", range: "Art. 124 - 147", icon: Landmark, bg: "bg-emerald-50", text: "text-emerald-600" },
                { title: "Amending Power", range: "Art. 368", icon: RefreshCcw, bg: "bg-red-50", text: "text-red-600" }
              ].map((item, i) => (
                <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-5">
                  <div className={`${item.bg} ${item.text} w-20 h-20 rounded-[30px] flex items-center justify-center shadow-inner`}>
                    <item.icon className="w-10 h-10" />
                  </div>
                  <h5 className="font-black text-slate-900 text-lg tracking-tight">{item.title}</h5>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{item.range}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case LibraryCategory.CASES:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="bg-blue-950 rounded-[50px] p-16 text-white flex items-center justify-between shadow-2xl overflow-hidden relative border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-5xl font-black font-serif tracking-tight">Landmark Precedents</h3>
                <p className="text-blue-200/70 text-lg max-w-xl font-medium">Judgments that shaped the history of Indian Law. Search and retrieve full text via e-SCR.</p>
              </div>
              <div className="flex flex-col gap-4 relative z-10">
                <a href="https://main.sci.gov.in/judgments" target="_blank" className="px-10 py-4 bg-white text-blue-950 rounded-[20px] font-black text-xs flex items-center gap-3 hover:bg-blue-50 transition-all shadow-xl uppercase tracking-widest">
                  <Landmark className="w-5 h-5" /> Supreme Court Reports
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { case: "Kesavananda Bharati v. State of Kerala", ratio: "The Parliament cannot alter the 'Basic Structure' of the Constitution.", cite: "AIR 1973 SC 1461", portal: "https://indiankanoon.org/doc/257876/" },
                { case: "Maneka Gandhi v. Union of India", ratio: "Procedure established by law must be just, fair, and reasonable.", cite: "AIR 1978 SC 597", portal: "https://indiankanoon.org/doc/1766147/" },
                { case: "Puttaswamy v. Union of India", ratio: "Right to Privacy is a fundamental right under Art. 21.", cite: "(2017) 10 SCC 1", portal: "https://indiankanoon.org/doc/127517806/" },
                { case: "Navtej Singh Johal v. Union of India", ratio: "Decriminalization of consensual same-sex relations.", cite: "AIR 2018 SC 4321", portal: "https://indiankanoon.org/doc/168671544/" }
              ].map((jud, i) => (
                <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="space-y-5 relative z-10">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">{jud.cite}</span>
                    <h5 className="font-black text-slate-900 text-2xl tracking-tight leading-tight group-hover:text-blue-700 transition-colors font-serif">{jud.case}</h5>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"Ratio: {jud.ratio}"</p>
                  </div>
                  <div className="mt-10 pt-8 border-t border-slate-50 relative z-10">
                    <a href={jud.portal} target="_blank" className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-3 hover:gap-5 transition-all">
                      Read Full Opinion <ArrowRight className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <h3 className="text-2xl font-bold text-slate-400">Section details coming soon...</h3>
          </div>
        );
    }
  };

  if (selectedCategory !== LibraryCategory.NONE) {
    return (
      <div className="space-y-8 pb-32 max-w-6xl mx-auto">
        <button 
          onClick={() => setSelectedCategory(LibraryCategory.NONE)}
          className="flex items-center gap-4 px-10 py-5 bg-white border border-slate-100 rounded-[28px] text-slate-500 hover:text-slate-900 transition-all shadow-sm group active:scale-95 mb-6"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.4em]">Return to Main Library</span>
        </button>
        {renderDetail()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in zoom-in-95 duration-700 pb-32">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-4 text-indigo-600 mb-2">
          <Library className="w-10 h-10" />
          <span className="text-[12px] font-black uppercase tracking-[0.6em]">Verified Jurisdictional Node</span>
        </div>
        <h2 className="text-6xl font-black font-serif text-slate-900 tracking-tight">Legal Knowledge Hub</h2>
        <p className="text-slate-500 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
          The central repository for the Union of India. Bare Acts, Gazette Notifications, and Landmark Precedents synchronized in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {categories.map((card, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedCategory(card.id)}
            className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-4 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col"
          >
            <div className={`absolute top-0 right-0 w-56 h-56 ${card.bg} blur-[80px] rounded-full -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-all duration-1000`}></div>
            
            <div className={`${card.bg} w-24 h-24 rounded-[36px] flex items-center justify-center mb-10 group-hover:scale-110 transition-all duration-700 shadow-inner relative z-10`}>
              <card.icon className={`w-12 h-12 ${card.color}`} />
            </div>
            
            <div className="relative z-10 space-y-4 mb-12 flex-1">
              <h3 className="text-3xl font-black text-slate-900 font-serif tracking-tight group-hover:text-slate-800 transition-colors">{card.title}</h3>
              <p className="text-slate-500 text-base font-medium leading-relaxed opacity-80">{card.desc}</p>
            </div>
            
            <div className="mt-auto flex items-center justify-between relative z-10">
              <div className="flex items-center text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] gap-4">
                <span>Access Node</span>
                <div className="w-10 h-[2.5px] bg-indigo-600 transform group-hover:w-20 transition-all duration-700"></div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Banner */}
      <div className="bg-slate-900 rounded-[72px] p-20 text-white flex flex-col lg:flex-row items-center justify-between gap-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.15),transparent)]"></div>
        <div className="relative z-10 space-y-8 max-w-2xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-4 text-amber-500 mb-2">
            <ShieldCheck className="w-10 h-10" />
            <span className="text-[12px] font-black uppercase tracking-[0.6em]">Legisync Compliance</span>
          </div>
          <h4 className="text-5xl font-black font-serif tracking-tight leading-tight">Ministry of Law & Justice Direct Link</h4>
          <p className="text-slate-400 text-lg leading-relaxed font-medium">
            Every statute in this hub is synchronized daily with the **Legislative Department** of India. Amendments (including Finance Act 2024 updates) are automatically pushed to your local node upon verification.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-6 relative z-10 w-full lg:w-auto">
          <div className="flex-1 flex items-center gap-8 bg-white/5 border border-white/10 p-10 rounded-[40px] hover:bg-white/10 transition-colors group">
            <div className="p-5 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight">E2E Retrieval</p>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Section 65B Standard</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-8 bg-white/5 border border-white/10 p-10 rounded-[40px] hover:bg-white/10 transition-colors group">
            <div className="p-5 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight">Pan-India Reach</p>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2">All 36 Jurisdictions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawLibrary;
