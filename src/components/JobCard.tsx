'use client';

import React from 'react';
import type { Job } from '../lib/googleSheets';

function escapeAttr(str: string | null) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}

function buildUpdatedText(dateStr: string | null) {
  if (!dateStr) return '';
  try {
    let d;
    const match = dateStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      d = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    } else {
      d = new Date(dateStr);
    }
    
    if (isNaN(d.getTime())) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(d);
    jobDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Cập nhật hôm nay';
    if (diffDays === 1) return 'Cập nhật hôm qua';
    if (diffDays <= 3)  return `Cập nhật ${diffDays} ngày trước`;

    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `Cập nhật ${day}/${month}`;
  } catch {
    return '';
  }
}

export default function JobCard({ job }: { job: Job }) {
  const urgent = job.urgent === true;
  const hasSource = !!job.source_link;

  const total = job.total_slots;
  const filled = job.filled_slots || 0;
  const showSlots = total !== null && total > 0;
  const left = showSlots ? Math.max(0, total - filled) : 0;
  const percentage = showSlots ? Math.min(100, Math.max(0, (filled / total) * 100)) : 0;

  const tags = [];
  if (job.gender) tags.push(job.gender);
  if (job.age) tags.push(job.age);
  if (job.shift) tags.push(job.shift);
  if (job.experience && job.experience.toLowerCase() !== 'không yêu cầu') {
    tags.push('KN: ' + job.experience);
  }

  const locationParts = [];
  if (job.industrial_park) locationParts.push(job.industrial_park);
  if (job.location) locationParts.push(job.location);
  const locationText = locationParts.join(' · ');

  const type = (job.hr_contact_type || '').toLowerCase();
  let href = '#';
  switch (type) {
    case 'zalo':
      href = `https://zalo.me/${job.hr_contact}`;
      break;
    case 'messenger':
      href = job.hr_contact && job.hr_contact.startsWith('http')
        ? job.hr_contact
        : `https://m.me/${job.hr_contact}`;
      break;
    case 'phone':
      href = `tel:${job.hr_contact}`;
      break;
    default:
      href = job.hr_contact || '#';
  }

  return (
    <article className={`bg-[var(--color-card)] border-[1.5px] rounded-2xl p-4 flex flex-col gap-3 shadow-[0_2px_16px_rgba(0,0,0,0.5)] transition-all duration-250 relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)] ${urgent ? 'border-[rgba(255,107,53,0.3)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`} id={`job-${job.id}`}>
      
      {/* Top border highlight */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-250 ${urgent ? 'opacity-100 bg-gradient-to-r from-[var(--color-orange)] to-[#FF4500]' : 'opacity-0 bg-gradient-to-r from-transparent via-[var(--color-orange)] to-transparent group-hover:opacity-100'}`}></div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[var(--color-text-sub)] truncate">
              {job.company || ''}
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap flex-shrink-0">
          {urgent && (
            <span className="inline-flex items-center gap-[3px] px-2 py-[3px] rounded-full text-[10px] font-bold tracking-[0.3px] whitespace-nowrap bg-[var(--color-orange-dim)] text-[var(--color-orange)] border border-[rgba(255,107,53,0.25)] animate-[pulse-badge_2s_infinite]">
              🔥 TUYỂN GẤP
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-[17px] font-extrabold text-[var(--color-text-main)] leading-snug tracking-tight">
          {job.position || ''}
        </h2>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-sm flex-shrink-0">💰</span>
          <span className="text-base font-bold text-[var(--color-orange)]">{job.salary_text || 'Thỏa thuận'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-sm flex-shrink-0">📍</span>
          <span className="font-medium text-[var(--color-text-sub)] truncate">{locationText}</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-[5px]">
          {tags.map((t, idx) => (
            <span key={idx} className="px-2.5 py-[3px] bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-full text-[11px] font-medium text-[var(--color-text-sub)]">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {showSlots && (
          <div className="mt-1">
            <div className="flex justify-between text-[11px] font-semibold text-[var(--color-text-sub)] mb-1">
              <span>Đã tuyển: {filled}/{total}</span>
              <span className="text-[var(--color-red)]">Còn {left} chỗ</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--color-bg2)] rounded-md overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--color-red)] to-[var(--color-orange)] rounded-md transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <span className="text-[11px] text-[var(--color-text-muted)] italic">
            {buildUpdatedText(job.updated_at)}
          </span>
        </div>

        <div className="flex flex-col gap-[7px]">
          <a
            href={href}
            target={type !== 'phone' ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl bg-gradient-to-br from-[var(--color-orange)] to-[#FF4500] text-white text-sm font-bold tracking-[0.1px] shadow-[0_4px_16px_rgba(255,107,53,0.35)] hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(255,107,53,0.45)] hover:brightness-105 transition-all duration-150"
          >
            💬 Liên hệ HR
          </a>
          {hasSource && (
            <button
              onClick={() => {
                if (job.source_link) window.open(job.source_link, '_blank');
              }}
              className="flex items-center justify-center gap-[5px] w-full h-9 rounded-xl border-[1.5px] border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] text-xs font-semibold hover:border-[var(--color-blue)] hover:text-[var(--color-blue)] hover:bg-[var(--color-blue-dim)] transition-all duration-150"
            >
              🔗 Xem nguồn tuyển dụng ↗
            </button>
          )}
        </div>

        <a
          href="#"
          onClick={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã báo cáo. Tính năng sẽ sớm được cập nhật.'); }}
          className="flex items-center justify-center gap-1 text-[11px] text-[var(--color-text-muted)] py-0.5 hover:text-[var(--color-red)] transition-colors duration-150"
        >
          🚩 Báo tin sai / hết hạn
        </a>
      </div>
    </article>
  );
}
