import React from 'react';

export default function Header({ jobCount = 0 }: { jobCount?: number }) {
  return (
    <header className="sticky top-0 z-50 h-16 bg-[rgba(248,250,252,0.92)] backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-[42px] h-[42px] rounded-[14px] bg-gradient-to-br from-[var(--color-orange)] to-[#FF4500] flex items-center justify-center flex-shrink-0 shadow-[0_4px_16px_rgba(255,107,53,0.4)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
              <path d="M17 18h1"></path>
              <path d="M12 18h1"></path>
              <path d="M7 18h1"></path>
            </svg>
          </div>
          <div className="flex flex-col gap-[2px]">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-orange)] to-[#FF4500] tracking-tight leading-tight">
              Việc Làm KCN
            </h1>
            <span className="text-[10px] font-medium text-[var(--color-text-muted)] hidden sm:block">
              Việc làm mới nhất • Có nguồn tuyển dụng
            </span>
          </div>
        </div>
        <div className="text-[13px] font-semibold text-[var(--color-orange)] whitespace-nowrap">
          {jobCount} việc
        </div>
      </div>
    </header>
  );
}
