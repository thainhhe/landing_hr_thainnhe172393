import React from 'react';

export default function Header({ jobCount = 0 }: { jobCount?: number }) {
  return (
    <header className="sticky top-0 z-50 h-16 bg-[rgba(8,16,30,0.92)] backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[var(--color-orange)] to-[#FF4500] flex items-center justify-center text-lg flex-shrink-0 shadow-[0_4px_12px_rgba(255,107,53,0.4)]">
            ⚡
          </div>
          <div className="flex flex-col gap-[1px]">
            <h1 className="text-[17px] font-extrabold text-[var(--color-text-main)] tracking-tight leading-tight">
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
