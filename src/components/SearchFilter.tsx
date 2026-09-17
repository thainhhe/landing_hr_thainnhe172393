'use client';

import React, { useState, useMemo } from 'react';
import type { Job } from '../lib/googleSheets';
import JobCard from './JobCard';

function normalize(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export default function SearchFilter({ initialJobs }: { initialJobs: Job[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ kcn: '', salary: '', gender: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  const activeFiltersCount = (filters.kcn ? 1 : 0) + (filters.salary ? 1 : 0) + (filters.gender ? 1 : 0);

  const kcnList = useMemo(() => {
    const set = new Set<string>();
    initialJobs.forEach(job => {
      if (job.industrial_park) set.add(job.industrial_park);
    });
    return Array.from(set).sort();
  }, [initialJobs]);

  const filteredJobs = useMemo(() => {
    const normSearch = normalize(searchQuery);
    return initialJobs.filter(job => {
      if (normSearch) {
        const haystack = normalize(`${job.company || ''} ${job.position || ''}`);
        if (!haystack.includes(normSearch)) return false;
      }
      if (filters.kcn && job.industrial_park !== filters.kcn) return false;
      if (filters.gender && job.gender !== filters.gender) return false;
      if (filters.salary) {
        const threshold = parseFloat(filters.salary);
        const max = job.salary_max;
        const min = job.salary_min;
        if (max === null && min === null) return false;
        const effectiveMax = max !== null ? max : min;
        if (effectiveMax !== null && effectiveMax < threshold) return false;
      }
      return true;
    });
  }, [initialJobs, searchQuery, filters]);

  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => {
    setFilters({ kcn: '', salary: '', gender: '' });
    setSearchQuery('');
  };

  return (
    <>
      <section className="sticky top-16 z-40 bg-[var(--color-bg)] py-5 pb-3 border-b border-[var(--color-border)]">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 mb-1 sm:mb-3 sm:block">
            <div className="relative flex items-center flex-1">
              <span className="absolute left-3.5 text-base pointer-events-none z-10">🔍</span>
              <input
                type="text"
                className="w-full h-12 pl-11 pr-11 bg-[var(--color-card)] border-[1.5px] border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] text-sm font-medium outline-none transition-colors duration-250 focus:border-[var(--color-orange)] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] placeholder:text-[var(--color-text-muted)] placeholder:font-normal"
                placeholder="Tìm theo tên công việc, công ty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 w-7 h-7 rounded-full bg-[var(--color-border)] text-[var(--color-text-muted)] text-xs flex items-center justify-center hover:bg-[var(--color-red-dim)] hover:text-[var(--color-red)] transition-colors"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
            
            <button
              className={`sm:hidden relative flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl border-[1.5px] transition-colors ${activeFiltersCount > 0 || isExpanded ? 'border-[var(--color-orange)] bg-[var(--color-orange-dim)] text-[var(--color-orange)]' : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)]'}`}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label="Bộ lọc"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              {activeFiltersCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[var(--color-red)] rounded-full border-2 border-[var(--color-bg)]"></span>
              )}
            </button>
          </div>

          <div className={`${isExpanded ? 'grid mt-3' : 'hidden'} sm:flex sm:mt-0 grid-cols-2 sm:flex-wrap gap-2.5 sm:gap-2 items-end`}>
            <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-[130px] w-full min-w-0">
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide pl-0.5 truncate" title="Khu công nghiệp">Khu công nghiệp</label>
              <select
                className="h-10 px-3 w-full bg-[var(--color-card)] border-[1.5px] border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] text-[13px] font-medium outline-none cursor-pointer focus:border-[var(--color-orange)] transition-colors appearance-none pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
                value={filters.kcn}
                onChange={(e) => handleFilterChange('kcn', e.target.value)}
              >
                <option value="">Tất cả KCN</option>
                {kcnList.map(kcn => (
                  <option key={kcn} value={kcn}>{kcn}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-[130px] w-full min-w-0">
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide pl-0.5 truncate" title="Mức lương (tối thiểu)">Mức lương (tối thiểu)</label>
              <select
                className="h-10 px-3 w-full bg-[var(--color-card)] border-[1.5px] border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] text-[13px] font-medium outline-none cursor-pointer focus:border-[var(--color-orange)] transition-colors appearance-none pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
                value={filters.salary}
                onChange={(e) => handleFilterChange('salary', e.target.value)}
              >
                <option value="">Mọi mức lương</option>
                <option value="8">Từ 8 triệu</option>
                <option value="10">Từ 10 triệu</option>
                <option value="15">Từ 15 triệu</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 sm:flex-1 sm:min-w-[130px] w-full min-w-0">
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide pl-0.5 truncate" title="Giới tính">Giới tính</label>
              <select
                className="h-10 px-3 w-full bg-[var(--color-card)] border-[1.5px] border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] text-[13px] font-medium outline-none cursor-pointer focus:border-[var(--color-orange)] transition-colors appearance-none pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Nam/Nữ">Nam/Nữ (Không Y/C)</option>
              </select>
            </div>

            <button
              className="h-10 px-3.5 w-full sm:w-auto rounded-xl border-[1.5px] border-[var(--color-red-dim)] bg-[var(--color-red-dim)] text-[var(--color-red)] text-xs font-semibold whitespace-nowrap hover:bg-[var(--color-red)] hover:text-white transition-all sm:self-end"
              onClick={resetFilters}
            >
              Đặt lại
            </button>
          </div>
        </div>
      </section>

      <main className="py-5 pb-12 min-h-[50vh]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="text-[15px] font-bold text-[var(--color-text-main)]">
              Tìm thấy {filteredJobs.length} công việc phù hợp
            </span>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <div className="text-5xl leading-none">🔍</div>
              <div className="text-xl font-bold text-[var(--color-text-main)]">Không tìm thấy công việc</div>
              <div className="text-sm text-[var(--color-text-muted)]">Thử bỏ bớt bộ lọc hoặc gõ từ khóa khác xem sao.</div>
              <button
                className="mt-1 px-6 py-3 rounded-xl bg-gradient-to-br from-[var(--color-orange)] to-[#FF4500] text-white text-sm font-bold shadow-[0_4px_16px_rgba(255,107,53,0.35)]"
                onClick={resetFilters}
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
