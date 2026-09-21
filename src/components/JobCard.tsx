'use client';

import React, { useState } from 'react';
import type { Job } from '../lib/googleSheets';

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
    if (diffDays <= 3) return `Cập nhật ${diffDays} ngày trước`;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `Cập nhật ${day}/${month}`;
  } catch {
    return '';
  }
}

function extractBonusAmount(text: string): string | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|k)/i);
  if (match) {
    return `+${match[1]} ${match[2].toUpperCase()}`;
  }
  return null;
}

function parseList(text: string | null): string[] {
  if (!text) return [];
  // Split by new line, remove leading dash or bullet, trim
  return text.split(/\n/).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
}

function formatDeadlineDate(dateStr: string | null): string {
  if (!dateStr) return '';
  // Check if it's in the format Date(YYYY,MM,DD) from Google Sheets API
  const match = dateStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const y = match[1];
    // Google Sheets API returns 0-indexed months (e.g. 8 = September)
    const m = String(parseInt(match[2]) + 1).padStart(2, '0');
    const d = String(parseInt(match[3])).padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

export default function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);

  const urgent = job.urgent === true;
  const hasBonus = !!job.recruitment_bonus;

  // Badge logic
  let badgeEl = null;
  if (hasBonus) {
    const amountText = extractBonusAmount(job.recruitment_bonus!);
    badgeEl = (
      <span className="inline-flex items-center gap-[3px] px-2 py-[3px] rounded-full text-[10px] font-bold tracking-[0.3px] whitespace-nowrap bg-[#FFF4F0] text-[var(--color-orange)] border border-[rgba(255,107,53,0.3)]">
        🎁 {amountText ? amountText : 'CÓ THƯỞNG'}
      </span>
    );
  } else if (urgent) {
    badgeEl = (
      <span className="inline-flex items-center gap-[3px] px-2 py-[3px] rounded-full text-[10px] font-bold tracking-[0.3px] whitespace-nowrap bg-[var(--color-orange-dim)] text-[var(--color-orange)] border border-[rgba(255,107,53,0.25)] animate-[pulse-badge_2s_infinite]">
        🔥 TUYỂN GẤP
      </span>
    );
  }

  // Location
  const locationParts = [];
  if (job.industrial_park) locationParts.push(job.industrial_park);
  if (job.location) locationParts.push(job.location);
  const locationText = locationParts.join(' · ');

  // Requirements Tags (Collapsed)
  const allReqTags = [];
  if (job.gender) allReqTags.push(job.gender);
  if (job.experience && job.experience.toLowerCase() === 'không yêu cầu') {
    allReqTags.push('✓ Không YC kinh nghiệm');
  }
  // Add more if needed, but prioritize the above two
  const collapsedReqTags = allReqTags.slice(0, 2);

  // Benefits
  const benefitsList = parseList(job.benefits || '');
  const collapsedBenefits = benefitsList.slice(0, 2);
  const benefitsText = collapsedBenefits.join(' · ');

  // Contact href & text
  const type = (job.hr_contact_type || '').toLowerCase();
  let href = '#';
  let ctaText = '💬 Liên hệ HR';
  switch (type) {
    case 'zalo': {
      let phone = String(job.hr_contact || '').replace(/[^0-9]/g, '');
      if (phone.startsWith('84')) phone = '0' + phone.slice(2);
      if (phone && !phone.startsWith('0')) phone = '0' + phone;
      href = `https://zalo.me/${phone}`;
      ctaText = '💬 Liên hệ HR';
      break;
    }
    case 'messenger':
      href = job.hr_contact && job.hr_contact.startsWith('http')
        ? job.hr_contact
        : `https://m.me/${job.hr_contact}`;
      ctaText = '💬 Nhắn HR qua Messenger';
      break;
    case 'phone':
      href = `tel:${job.hr_contact}`;
      ctaText = '☎️ Gọi HR';
      break;
    default:
      href = job.hr_contact || '#';
  }

  const quantity = job.quantity || job.total_slots;

  return (
    <article className={`bg-[var(--color-card)] border-[1.5px] rounded-2xl p-4 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-250 relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${urgent || hasBonus ? 'border-[rgba(255,107,53,0.3)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}`} id={`job-${job.id}`}>

      {/* Top border highlight for visual feedback on hover/desktop */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-250 ${urgent || hasBonus ? 'opacity-100 bg-gradient-to-r from-[var(--color-orange)] to-[#FF4500]' : 'opacity-0 bg-gradient-to-r from-transparent via-[var(--color-orange)] to-transparent group-hover:opacity-100'}`}></div>

      {/* HEADER: Company & Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">
          {job.company || 'CÔNG TY'}
        </div>
        <div className="flex-shrink-0">
          {badgeEl}
        </div>
      </div>

      {/* TITLE & HIGHLIGHTS */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[17px] font-extrabold text-[var(--color-text-main)] leading-snug tracking-tight">
          {job.position || ''}
        </h2>
        <div className="flex items-center gap-1.5 text-[14px]">
          <span className="text-[15px] flex-shrink-0">💰</span>
          <span className="font-bold text-[var(--color-orange)]">{job.income_text || job.salary_text || 'Thỏa thuận'}</span>
        </div>
        {locationText && (
          <div className="flex items-start gap-1.5 text-[13px]">
            <span className="text-[14px] flex-shrink-0 mt-0.5">📍</span>
            <span className="font-medium text-[var(--color-text-sub)]">{locationText}</span>
          </div>
        )}
      </div>

      {/* BONUS & BENEFITS (COLLAPSED) */}
      {(hasBonus || collapsedBenefits.length > 0) && (
        <div className="flex flex-col gap-1 mt-1">
          {hasBonus && (
            <div className="text-[13px] font-semibold text-[var(--color-orange)] flex items-start gap-1.5">
              <span className="mt-0.5">🎁</span>
              <span>{job.recruitment_bonus}</span>
            </div>
          )}
          {collapsedBenefits.length > 0 && (
            <div className="text-[13px] text-[var(--color-text-sub)] flex items-start gap-1.5 font-medium">
              <span className="mt-0.5">🌟</span>
              <span>{benefitsText}</span>
            </div>
          )}
        </div>
      )}

      {/* REQUIREMENTS TAGS (COLLAPSED) */}
      {collapsedReqTags.length > 0 && (
        <div className="flex flex-wrap gap-[5px] mt-1">
          {collapsedReqTags.map((t, idx) => (
            <span key={idx} className="px-2.5 py-[3px] bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-full text-[11px] font-semibold text-[var(--color-text-sub)]">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* CTA & VIEW MORE */}
      <div className="mt-auto flex flex-col gap-3 pt-3">
        <a
          href={href}
          target={type !== 'phone' ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl bg-gradient-to-br from-[var(--color-orange)] to-[#FF4500] text-white text-sm font-bold tracking-[0.1px] shadow-[0_4px_16px_rgba(255,107,53,0.35)] active:scale-[0.98] transition-transform"
        >
          {ctaText}
        </a>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[13px] font-medium text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] transition-colors py-1 flex items-center justify-center w-full"
        >
          {expanded ? 'Thu gọn ↑' : 'Xem thêm ↓'}
        </button>
      </div>

      {/* EXPANDED SECTION */}
      <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${expanded ? 'max-h-[1500px] opacity-100 mt-2 border-t border-[var(--color-border)] pt-4' : 'max-h-0 opacity-0 m-0 p-0 border-transparent'}`}>

        {/* CHI TIẾT CÔNG VIỆC */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">CHI TIẾT CÔNG VIỆC</h3>
          <div className="flex flex-col gap-2">
            {job.gender && (
              <div className="flex items-start text-[13px]">
                <span className="w-24 text-[var(--color-text-sub)]">👤 Đối tượng</span>
                <span className="font-medium text-[var(--color-text-main)] flex-1">{job.gender}</span>
              </div>
            )}
            {job.age && (
              <div className="flex items-start text-[13px]">
                <span className="w-24 text-[var(--color-text-sub)]">🎂 Độ tuổi</span>
                <span className="font-medium text-[var(--color-text-main)] flex-1">{job.age}</span>
              </div>
            )}
            {job.shift && (
              <div className="flex items-start text-[13px]">
                <span className="w-24 text-[var(--color-text-sub)]">🕐 Ca làm</span>
                <span className="font-medium text-[var(--color-text-main)] flex-1">{job.shift}</span>
              </div>
            )}
            {job.experience && (
              <div className="flex items-start text-[13px]">
                <span className="w-24 text-[var(--color-text-sub)]">🎓 Kinh nghiệm</span>
                <span className="font-medium text-[var(--color-text-main)] flex-1">{job.experience}</span>
              </div>
            )}
            {quantity !== null && quantity > 0 && (
              <div className="flex items-start text-[13px]">
                <span className="w-24 text-[var(--color-text-sub)]">👥 Số lượng</span>
                <span className="font-medium text-[var(--color-text-main)] flex-1">{quantity} người</span>
              </div>
            )}
          </div>
        </div>

        {/* QUYỀN LỢI */}
        {benefitsList.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">QUYỀN LỢI</h3>
            <ul className="flex flex-col gap-1.5">
              {benefitsList.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-[var(--color-text-main)]">
                  <span className="text-[var(--color-orange)] mt-0.5">✓</span>
                  <span className="font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CHƯƠNG TRÌNH THƯỞNG */}
        {hasBonus && (
          <div className="mb-5">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">CHƯƠNG TRÌNH THƯỞNG</h3>
            <div className="bg-[#FFF4F0] p-3 rounded-xl border border-[rgba(255,107,53,0.15)]">
              <div className="font-bold text-[var(--color-orange)] text-[13px] flex items-start gap-1.5 mb-1">
                <span>🎁</span>
                <span>{job.recruitment_bonus}</span>
              </div>
              {job.bonus_deadline && (
                <div className="text-[12px] text-[var(--color-orange)] opacity-90 pl-6 mb-1">
                  Áp dụng đến {formatDeadlineDate(job.bonus_deadline)}
                </div>
              )}
              {job.bonus_note && (
                <div className="text-[11px] text-[var(--color-text-sub)] italic pl-6 mt-2">
                  *{job.bonus_note}
                </div>
              )}
              <div className="text-[11px] text-[var(--color-text-sub)] italic pl-6 mt-1">
                *Chính sách có thể thay đổi và sẽ báo trước 1 ngày.
              </div>
            </div>
          </div>
        )}

        {/* THÔNG TIN TIN TUYỂN DỤNG */}
        {/* <div className="mb-2">
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">THÔNG TIN TIN TUYỂN DỤNG</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-sub)]">
              <span>🔗</span>
              <span>Có nguồn tuyển dụng · {buildUpdatedText(job.updated_at)}</span>
            </div>
            {job.source_link && (
              <a href={job.source_link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-[var(--color-blue)] hover:underline inline-flex items-center gap-1 mt-1">
                Xem bài tuyển dụng gốc ↗
              </a>
            )}
          </div>
        </div> */}

        {/* REPORT */}
        <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
          {/* <button className="text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-red)] transition-colors flex items-center gap-1.5">
            🚩 Báo tin sai / hết hạn
          </button> */}

          <button
            onClick={() => setExpanded(false)}
            className="text-[13px] font-medium text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] transition-colors ml-auto"
          >
            Thu gọn ↑
          </button>
        </div>
      </div>

    </article>
  );
}

