export type Job = {
  id: string;
  company: string;
  position: string;
  salary_text: string | null;
  salary_min: number | null;
  salary_max: number | null;
  industrial_park: string | null;
  location: string | null;
  gender: string | null;
  age: string | null;
  shift: string | null;
  experience: string | null;
  urgent: boolean;
  hr_contact_type: string | null;
  hr_contact: string | null;
  source_type: string | null;
  source_link: string | null;
  updated_at: string | null;
  status: string | null;
  total_slots: number | null;
  filled_slots: number | null;
  income_text?: string | null;
  recruitment_bonus?: string | null;
  bonus_deadline?: string | null;
  bonus_note?: string | null;
  benefits?: string | null;
  quantity?: number | null;
};

const SHEET_ID = '1R-Rq2rihfBdZK5qhiLXzFq1X_iqif86ocf3KRFicpSk';
const SHEET_TAB_NAME = 'mock_data';

export async function fetchJobs(): Promise<Job[]> {
  if (!SHEET_ID) return [];

  const query = encodeURIComponent("Select * where S = 'ACTIVE'");
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_TAB_NAME)}&tq=${query}`;

  const response = await fetch(url, { next: { revalidate: 60 } }); // Cache for 60 seconds (ISR)
  if (!response.ok) throw new Error('HTTP ' + response.status);

  const text = await response.text();
  
  // Strip wrapper
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
  if (!match || !match[1]) throw new Error('Invalid gviz response format');

  const data = JSON.parse(match[1]);

  if (data.status === 'error') {
    const errMsg = data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || 'Unknown error';
    throw new Error('Google Sheets error: ' + errMsg);
  }

  const rows = data?.table?.rows || [];
  const jobs: Job[] = [];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const c = row.c || [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get = (idx: number) => (c[idx]?.v ?? null);
    const getStr = (idx: number) => {
      const v = get(idx);
      return v === null || v === undefined ? null : String(v).trim() || null;
    };
    const getNum = (idx: number) => {
      const v = get(idx);
      if (v === null || v === undefined || v === '') return null;
      const n = parseFloat(v as string);
      return isNaN(n) ? null : n;
    };
    const getBool = (idx: number) => {
      const v = getStr(idx);
      if (!v) return false;
      return v.toLowerCase() === 'true' || v === '1' || v.toLowerCase() === 'có';
    };

    const status = getStr(18);
    if (!status || status.toUpperCase() !== 'ACTIVE') continue;

    jobs.push({
      id:               getStr(0) || `row_${rowIdx + 1}`,
      company:          getStr(1) || '',
      position:         getStr(2) || '',
      salary_text:      getStr(3),
      salary_min:       getNum(4),
      salary_max:       getNum(5),
      industrial_park:  getStr(6),
      location:         getStr(7),
      gender:           getStr(8),
      age:              getStr(9),
      shift:            getStr(10),
      experience:       getStr(11),
      urgent:           getBool(12),
      hr_contact_type:  getStr(13),
      hr_contact:       getStr(14),
      source_type:      getStr(15),
      source_link:      getStr(16),
      updated_at:       c[17]?.f || getStr(17), // prioritize formatted string if available
      status:           status,
      total_slots:      getNum(19),
      filled_slots:     getNum(20),
      recruitment_bonus: getStr(21),
      bonus_deadline:   getStr(22),
      bonus_note:       getStr(23),
      benefits:         getStr(24),
    });
  }

  // Sort by updated_at DESC
  jobs.sort((a, b) => {
    let dA, dB;
    const matchA = a.updated_at?.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
    if (matchA) dA = new Date(parseInt(matchA[1]), parseInt(matchA[2]), parseInt(matchA[3]));
    else dA = new Date(a.updated_at || '2000-01-01');

    const matchB = b.updated_at?.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
    if (matchB) dB = new Date(parseInt(matchB[1]), parseInt(matchB[2]), parseInt(matchB[3]));
    else dB = new Date(b.updated_at || '2000-01-01');

    return dB.getTime() - dA.getTime();
  });

  return jobs;
}
