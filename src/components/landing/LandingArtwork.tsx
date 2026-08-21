import { BriefcaseBusiness, Clock3, MapPin, Search, Sparkles } from "lucide-react";

const blue = "#178FC8";
const blueDeep = "#0B5F8A";
const blueSoft = "#DDF4FF";
const cream = "#F8F4EA";
const ink = "#15202B";
const yellow = "#FFD85A";
const coral = "#F28B67";
const mint = "#BDEBD6";

export function HeroWorkspace() {
  return (
    <div className="relative mx-auto aspect-[1.08/1] w-full max-w-[620px]">
      <div className="absolute inset-[4%_2%_2%_8%] overflow-hidden rounded-[2.2rem] bg-[#CDEEFF] shadow-[0_34px_80px_rgba(14,95,138,0.16)]">
        <div className="absolute inset-x-0 top-0 h-[44%] bg-[#DFF5FF]" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[#E8D2B6]" />
        <div className="absolute left-[6%] top-[8%] h-[30%] w-[28%] rounded-[1.4rem] border-[10px] border-white/80 bg-[#BFE6F7]">
          <div className="absolute inset-x-[8%] top-1/2 h-2 bg-white/70" />
          <div className="absolute inset-y-[8%] left-1/2 w-2 bg-white/70" />
        </div>

        <div className="absolute right-[7%] top-[11%] h-[20%] w-[27%] rotate-3 rounded-[1.1rem] bg-white shadow-md">
          <div className="absolute left-[9%] top-[13%] h-2 w-[46%] rounded bg-[#A3D9EE]" />
          <div className="absolute left-[9%] top-[28%] h-2 w-[70%] rounded bg-[#D8E8ED]" />
          <div className="absolute left-[9%] top-[43%] h-2 w-[58%] rounded bg-[#D8E8ED]" />
          <div className="absolute bottom-[13%] right-[10%] h-6 w-6 rounded-full bg-[#FFD85A]" />
        </div>

        <div className="absolute bottom-[12%] left-[5%] h-[29%] w-[17%]">
          <div className="absolute bottom-0 left-[20%] h-[34%] w-[58%] rounded-b-[1rem] rounded-t-[0.35rem] bg-[#E8F2F2]" />
          <div className="absolute bottom-[26%] left-[45%] h-[55%] w-[10%] rounded-full bg-[#3C7A5D]" />
          <div className="absolute bottom-[39%] left-[5%] h-[24%] w-[50%] -rotate-[28deg] rounded-[100%_0] bg-[#65B77D]" />
          <div className="absolute bottom-[53%] right-[3%] h-[22%] w-[45%] rotate-[28deg] rounded-[0_100%] bg-[#65B77D]" />
          <div className="absolute bottom-[66%] left-[22%] h-[21%] w-[45%] -rotate-[12deg] rounded-[100%_0] bg-[#80C98F]" />
        </div>

        <div className="absolute bottom-[7%] left-[18%] right-[7%] h-[15%] rounded-[1.2rem] bg-[#C79E72] shadow-[0_10px_25px_rgba(92,66,36,0.18)]" />
        <div className="absolute bottom-[10%] left-[25%] h-[6%] w-[15%] rounded-full bg-[#F8F4EA]" />
        <div className="absolute bottom-[11.5%] left-[29%] h-[3%] w-[8%] rounded-full border-2 border-[#B9A184]" />

        <div className="absolute bottom-[20%] right-[10%] h-[55%] w-[58%] rotate-[-1.5deg] rounded-[1.4rem] border-[9px] border-[#116D9A] bg-[#178FC8] shadow-[0_24px_45px_rgba(14,95,138,0.28)]">
          <div className="absolute inset-[5%] overflow-hidden rounded-[0.75rem] bg-white">
            <div className="flex h-[13%] items-center gap-2 border-b border-[#D7E8EF] px-[5%]">
              <span className="h-2 w-2 rounded-full bg-[#F28B67]" />
              <span className="h-2 w-2 rounded-full bg-[#FFD85A]" />
              <span className="h-2 w-2 rounded-full bg-[#79CFA4]" />
            </div>
            <div className="p-[7%]">
              <div className="text-[clamp(10px,1.1vw,14px)] font-extrabold tracking-[-0.04em] text-[#15202B]">
                Product Designer
              </div>
              <div className="mt-[4%] flex gap-1.5">
                <span className="rounded-full bg-[#E4F5FD] px-2 py-1 text-[8px] font-bold text-[#0B6F9E]">Remote</span>
                <span className="rounded-full bg-[#FFF2C4] px-2 py-1 text-[8px] font-bold text-[#775E00]">Contract</span>
              </div>
              <div className="mt-[7%] h-2 w-[80%] rounded bg-[#E7EEF1]" />
              <div className="mt-[3%] h-2 w-[58%] rounded bg-[#E7EEF1]" />
              <div className="mt-[8%] flex items-center justify-between rounded-lg bg-[#F5F8FA] p-[5%]">
                <span className="text-[8px] font-semibold text-[#5D6A74]">£1,200 – £1,600</span>
                <span className="rounded-full bg-[#178FC8] px-3 py-1.5 text-[8px] font-extrabold text-white">Apply</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-[11%] left-[-9%] right-[-9%] h-[13%] rounded-[0.7rem_0.7rem_1.7rem_1.7rem] bg-[#D8E2E6] shadow-[0_10px_18px_rgba(21,32,43,0.16)]">
            <div className="mx-auto mt-[3%] h-[28%] w-[18%] rounded-b-xl bg-[#AAB8BF]" />
          </div>
        </div>

        <div className="absolute right-[2%] top-[36%] rotate-6 rounded-xl bg-[#FFD85A] px-3 py-2 font-[cursive] text-[11px] font-bold text-[#5E4A00] shadow-md">
          dream job?
        </div>
        <div className="absolute left-[28%] top-[13%] -rotate-3 rounded-lg bg-white px-3 py-2 font-[cursive] text-[10px] font-bold text-[#0B5F8A] shadow-sm">
          you’ve got this!
        </div>
      </div>
      <div className="absolute -left-[2%] top-[22%] hidden rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_16px_35px_rgba(21,32,43,0.14)] backdrop-blur sm:block">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#15202B]">
          <Sparkles size={14} className="text-[#F5A623]" />
          New roles daily
        </div>
      </div>
    </div>
  );
}

export function NotebookSteps() {
  const steps = [
    ["01", "Find", "Browse opportunities that fit your skills."],
    ["02", "Apply", "Send your application without unnecessary friction."],
    ["03", "Move forward", "If you’re selected, take the next step."]
  ];

  return (
    <div className="relative mx-auto w-full max-w-[920px]">
      <div className="absolute -left-[3%] top-[15%] h-24 w-20 rotate-[-8deg] rounded-xl bg-[#FFD85A] shadow-md sm:h-28 sm:w-24" />
      <div className="absolute -right-[2%] bottom-[12%] h-20 w-20 rotate-6 rounded-full bg-[#BDEBD6] shadow-md" />
      <div className="relative rotate-[-1deg] rounded-[2rem] border border-[#D9D0C1] bg-[#FFFDF7] p-5 shadow-[0_28px_70px_rgba(80,64,42,0.16)] sm:p-8">
        <div className="absolute left-1/2 top-0 h-full w-px bg-[#E7DDCF]" />
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(([n, title, copy], index) => (
            <div key={title} className="relative rounded-[1.4rem] bg-[#F8F4EA] p-6">
              <div className="font-[cursive] text-lg font-bold text-[#178FC8]">{n}</div>
              <div className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#15202B]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[#65727E]">{copy}</p>
              {index < 2 && (
                <div className="absolute -right-5 top-1/2 hidden h-1 w-10 -translate-y-1/2 bg-[#178FC8] md:block" />
              )}
            </div>
          ))}
        </div>
        <svg className="pointer-events-none absolute inset-x-[8%] bottom-[8%] hidden h-10 w-[84%] md:block" viewBox="0 0 1000 80" aria-hidden="true">
          <path d="M15 52 C160 6, 265 74, 410 38 S670 16, 820 45 S935 53,985 24" fill="none" stroke="#178FC8" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 16" />
        </svg>
      </div>
    </div>
  );
}

export function CategoryFolders() {
  const folders = [
    { label: "TECH", tone: "#168FC8", x: "0%", y: "10%", r: "-5deg" },
    { label: "DESIGN", tone: "#BFEAF8", x: "20%", y: "1%", r: "3deg" },
    { label: "MARKETING", tone: "#FFD85A", x: "41%", y: "12%", r: "-2deg" },
    { label: "OPERATIONS", tone: "#0B5F8A", x: "61%", y: "3%", r: "4deg" },
    { label: "SUPPORT", tone: "#BDEBD6", x: "79%", y: "13%", r: "-4deg" }
  ];

  return (
    <div className="relative h-[330px] w-full sm:h-[390px]">
      {folders.map((folder) => (
        <div
          key={folder.label}
          className="absolute top-0 w-[25%] min-w-[112px] transition duration-300 hover:-translate-y-3"
          style={{ left: folder.x, top: folder.y, transform: `rotate(${folder.r})` }}
        >
          <div className="h-10 w-[58%] rounded-t-2xl" style={{ background: folder.tone }} />
          <div
            className="relative -mt-1 aspect-[0.82/1] rounded-[0_1.4rem_1.4rem_1.4rem] p-4 shadow-[0_18px_35px_rgba(21,32,43,0.16)] sm:p-5"
            style={{ background: folder.tone }}
          >
            <div className={`text-[10px] font-black tracking-[0.18em] ${folder.tone === blueDeep ? "text-white" : "text-[#15202B]"}`}>
              {folder.label}
            </div>
            <div className={`mt-5 h-2 w-3/4 rounded-full ${folder.tone === blueDeep ? "bg-white/30" : "bg-white/60"}`} />
            <div className={`mt-2 h-2 w-1/2 rounded-full ${folder.tone === blueDeep ? "bg-white/25" : "bg-white/50"}`} />
            <div className={`absolute bottom-4 right-4 rounded-full p-2 ${folder.tone === blueDeep ? "bg-white text-[#0B5F8A]" : "bg-white/80 text-[#15202B]"}`}>
              <BriefcaseBusiness size={16} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FinalWorkspace() {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[2.2rem] bg-[#CDEEFF]">
      <div className="absolute inset-x-0 top-0 h-[44%] bg-[#E0F5FF]" />
      <div className="absolute inset-x-0 bottom-0 h-[36%] bg-[#DDBF98]" />
      <div className="absolute right-[6%] top-[7%] h-[31%] w-[30%] rounded-2xl border-[8px] border-white/80 bg-[#B9E2F4]">
        <div className="absolute left-1/2 top-0 h-full w-2 bg-white/70" />
        <div className="absolute left-0 top-1/2 h-2 w-full bg-white/70" />
      </div>
      <div className="absolute bottom-[9%] left-[6%] right-[6%] h-[16%] rounded-2xl bg-[#B98D62]" />
      <div className="absolute bottom-[19%] left-[34%] h-[51%] w-[45%] rotate-[-2deg] rounded-[1.2rem] border-[8px] border-[#0B5F8A] bg-[#178FC8] shadow-[0_20px_35px_rgba(11,95,138,0.28)]">
        <div className="absolute inset-[6%] rounded-lg bg-white p-[6%]">
          <div className="text-[11px] font-black tracking-tight text-[#15202B]">Open opportunities</div>
          <div className="mt-[7%] space-y-2">
            <div className="rounded-lg bg-[#F1F7F9] p-2">
              <div className="h-2 w-[70%] rounded bg-[#9ED7EB]" />
              <div className="mt-2 h-1.5 w-[42%] rounded bg-[#D8E5E9]" />
            </div>
            <div className="rounded-lg bg-[#F1F7F9] p-2">
              <div className="h-2 w-[58%] rounded bg-[#9ED7EB]" />
              <div className="mt-2 h-1.5 w-[48%] rounded bg-[#D8E5E9]" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[16%] left-[9%] h-[42%] w-[18%]">
        <div className="absolute bottom-0 left-[18%] h-[35%] w-[63%] rounded-xl bg-[#EEF6F4]" />
        <div className="absolute bottom-[25%] left-[46%] h-[58%] w-[9%] rounded-full bg-[#3F7D5F]" />
        <div className="absolute bottom-[42%] left-[4%] h-[24%] w-[48%] -rotate-[28deg] rounded-[100%_0] bg-[#72BE7C]" />
        <div className="absolute bottom-[58%] right-[2%] h-[20%] w-[46%] rotate-[25deg] rounded-[0_100%] bg-[#72BE7C]" />
      </div>
      <div className="absolute left-[12%] top-[13%] -rotate-3 rounded-xl bg-[#FFD85A] px-4 py-3 font-[cursive] text-sm font-bold text-[#604B00] shadow-md">
        next move →
      </div>
    </div>
  );
}

export function JobCard({
  title,
  rate,
  type,
  location,
  accent = blue
}: {
  title: string;
  rate: string;
  type: string;
  location: string;
  accent?: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[1.7rem] border border-[#DCE6EA] bg-white p-5 shadow-[0_14px_40px_rgba(30,78,104,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(30,78,104,0.14)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full bg-[#ECF7FB] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0B6F9E]">
            Featured
          </div>
          <h3 className="mt-4 text-xl font-extrabold tracking-[-0.04em] text-[#15202B]">{title}</h3>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F2F7F9] text-[#178FC8]">
          <BriefcaseBusiness size={19} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#5D6A74]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6F7F4] px-3 py-2">
          <MapPin size={13} /> {location}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6F7F4] px-3 py-2">
          <Clock3 size={13} /> {type}
        </span>
      </div>
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#E7ECEE] pt-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#89949C]">Pay</div>
          <div className="mt-1 font-extrabold text-[#15202B]">{rate}</div>
        </div>
        <button type="button" className="rounded-full bg-[#15202B] px-4 py-2.5 text-xs font-extrabold text-white transition group-hover:bg-[#178FC8]">
          View role
        </button>
      </div>
    </article>
  );
}

export function SearchPanel() {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/95 p-3 shadow-[0_20px_55px_rgba(16,74,101,0.14)] backdrop-blur sm:p-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_.75fr_auto]">
        <label className="flex min-h-14 items-center gap-3 rounded-xl bg-[#F4F7F8] px-4">
          <Search size={18} className="shrink-0 text-[#178FC8]" />
          <span className="text-sm font-semibold text-[#7C8992]">Role or skill</span>
        </label>
        <label className="flex min-h-14 items-center gap-3 rounded-xl bg-[#F4F7F8] px-4">
          <MapPin size={18} className="shrink-0 text-[#178FC8]" />
          <span className="text-sm font-semibold text-[#7C8992]">Remote</span>
        </label>
        <button type="button" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#178FC8] px-5 text-sm font-extrabold text-white transition hover:bg-[#0B6F9E]">
          Find jobs
          <Search size={16} />
        </button>
      </div>
    </div>
  );
}

export const palette = { blue, blueDeep, blueSoft, cream, ink, yellow, coral, mint };
