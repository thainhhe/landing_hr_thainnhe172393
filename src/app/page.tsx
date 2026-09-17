import Header from '@/components/Header';
import TrustBanners from '@/components/TrustBanners';
import SearchFilter from '@/components/SearchFilter';
import { fetchJobs } from '@/lib/googleSheets';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const jobs = await fetchJobs();

  return (
    <div className="flex flex-col min-h-screen">
      <Header jobCount={jobs.length} />
      <TrustBanners />
      <SearchFilter initialJobs={jobs} />
      
      {/* Footer */}
      <footer className="mt-auto border-t border-[rgba(255,107,53,0.1)] bg-gradient-to-b from-white to-orange-50/70">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
          <div className="mb-7 flex flex-col items-center text-center">
             <p className="text-[13px] font-bold text-[var(--color-text-sub)] uppercase tracking-wider mb-2">Bộ phận hỗ trợ ứng viên</p>
             <div className="flex items-center gap-2.5 mb-5 text-[var(--color-orange)]">
               <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
               </svg>
               <p className="text-3xl font-black">0326.872.895</p>
             </div>
             <a href="https://zalo.me/0326872895" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0068FF] text-white text-[15px] font-bold shadow-[0_4px_16px_rgba(0,104,255,0.3)] hover:bg-[#0054d6] hover:-translate-y-0.5 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
               Nhắn tin Zalo ngay
             </a>
          </div>
          
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-[rgba(255,107,53,0.2)] to-transparent mb-6"></div>

          <p className="text-xs text-[var(--color-text-muted)] text-center leading-relaxed">
            © {new Date().getFullYear()} Việc Làm KCN. All rights reserved.<br/>
            Thông tin được tổng hợp tự động, ứng viên vui lòng tự xác minh trước khi ứng tuyển.
          </p>
        </div>
      </footer>
    </div>
  );
}
