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
      <footer className="py-6 mt-auto text-center border-t border-[var(--color-border)] bg-[var(--color-bg2)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          © {new Date().getFullYear()} Việc Làm KCN. All rights reserved.<br/>
          Thông tin được tổng hợp tự động, ứng viên vui lòng tự xác minh trước khi ứng tuyển.
        </p>
      </footer>
    </div>
  );
}
