import React from 'react';

export default function TrustBanners() {
  return (
    <section className="py-4 bg-[var(--color-bg2)] border-b border-[var(--color-border)]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-green-dim)] border border-[rgba(34,197,94,0.2)]">
            <div className="text-xl flex-shrink-0 leading-snug">⚡</div>
            <div>
              <strong className="block text-[13px] font-bold text-[var(--color-text-main)] mb-[3px]">
                Cơ hội việc làm mới mỗi ngày
              </strong>
              <p className="text-xs text-[var(--color-text-sub)] leading-relaxed">
                Hàng trăm công việc được cập nhật liên tục từ các khu công nghiệp. Chọn vị trí phù hợp và kết nối trực tiếp với nhà tuyển dụng.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-yellow-dim)] border border-[rgba(245,158,11,0.2)]">
            <div className="text-xl flex-shrink-0 leading-snug">🎯</div>
            <div>
              <strong className="block text-[13px] font-bold text-[var(--color-text-main)] mb-[3px]">
                Mức lương & đãi ngộ cạnh tranh
              </strong>
              <p className="text-xs text-[var(--color-text-sub)] leading-relaxed">
                Rất nhiều vị trí có đi kèm phụ cấp, hỗ trợ chuyên cần, tăng ca... Cơ hội gia tăng thu nhập tốt cho ứng viên sẵn sàng nhận việc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
