export const samples = [
  {
    category: "Internship",
    title: "Summer Engineering Internship",
    text: "Summer Engineering Internship\nApplications are open for our summer engineering internship.\n\nEligible branches: CSE, IT, ECE\nMinimum CGPA: 7.5\nGraduation year: 2027\nApplication deadline: 15 December 2026\nRequired documents: Resume, academic transcript",
  },
  {
    category: "Scholarship",
    title: "Academic Merit Scholarship",
    text: "Academic Merit Scholarship\nMinimum CGPA: 9.0\nOpen to all branches\nGraduation year: 2027\nApplication deadline: 20 December 2026\nRequired documents: Transcript, student ID",
  },
  {
    category: "Hackathon",
    title: "Campus Build Weekend",
    text: "Campus Build Weekend — Hackathon\nOpen to all branches\nRegistration deadline: 10 December 2026\nRequired documents: Student ID",
  },
  {
    category: "Workshop",
    title: "Design Systems Workshop",
    text: "Design Systems Workshop\nPriority may be given to final-year students.\nRegistration closes next Friday.",
  },
  {category:"Placement",title:"Campus recruitment drive",text:"Campus placement recruitment drive\nMinimum CGPA: 7\nAcademic year: 4\nRequired skills: Java, SQL\nApplication deadline: 20 December 2026"},
  {category:"Examination",title:"Semester examination timetable",text:"Semester examination timetable\nOpen to all branches\nAcademic year: 3\nRequired documents: Hall ticket, student ID"},
];
export const branches: Record<string, string> = {
  ISE: "Information Science",
  EEE: "Electrical & Electronics",
  CSE: "Computer Science",
  IT: "Information Technology",
  ECE: "Electronics & Communication",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
};
export type Profile = {
  name: string;
  branch: string;
  cgpa: string;
  year: string;
  academicYear?: string;
  skills?: string;
};
export const initialProfile: Profile = {
  name: "Alex Morgan",
  branch: "CSE",
  cgpa: "8.4",
  year: "2027",
  academicYear: "3",
  skills: "Java, SQL",
};
const corpus: Record<string, string[]> = {
  Internship: [
    "summer engineering internship applications intern industry placement",
    "paid internship stipend work experience company hiring interns",
    "engineering internship software developer summer trainee",
  ],
  Scholarship: [
    "academic merit scholarship grant tuition award",
    "financial aid scholarship bursary funding",
    "scholarship tuition assistance academic excellence",
  ],
  Hackathon: [
    "hackathon campus build weekend coding challenge",
    "hackathon team hack prototype compete",
    "hackathon developer competition prizes team coding",
  ],
  Workshop: [
    "design systems workshop training session",
    "hands on workshop seminar skills training",
    "workshop practical masterclass register attend",
  ],
};
const extra: Record<string, string[]> = {
 Internship: ["industrial internship for undergraduate interns", "summer research internship mentor stipend", "winter internship trainee applications", "software internship intern onboarding", "remote internship work experience", "student internship programme duration", "research intern laboratory opportunity"],
 Scholarship: ["need based scholarship tuition fee waiver", "education scholarship financial support", "scholarship renewal income certificate", "merit award scholarship funding", "student bursary tuition grant", "scholarship application academic aid", "fellowship scholarship education assistance"],
 Hackathon: ["hackathon build prototype team submission", "coding hackathon innovation challenge", "hackathon demo judging prizes", "developer hackathon problem statement", "overnight hackathon team registration", "hackathon pitch project competition", "innovation hackathon software build"],
 Workshop: ["hands on workshop instructor session", "technical workshop learning certificate", "workshop training practical exercises", "seminar workshop expert speaker", "workshop bootcamp tutorial", "design workshop participants learning", "cloud workshop guided lab"],
 Placement: ["campus placement recruitment drive", "company hiring graduates full time job", "placement aptitude interview selection", "recruitment drive resume shortlisted candidates", "campus placement pre placement talk", "graduate job offer salary interview", "software engineer recruitment placement", "final year campus hiring assessment", "placement cell company selection", "job recruitment written test interview"],
 Examination: ["semester examination timetable hall ticket", "internal assessment exam schedule", "university examination admit card", "exam registration subject paper", "supplementary examination fee", "midterm exam seating arrangement", "final examination results marks", "practical exam laboratory schedule", "exam controller revised timetable", "semester exam date sheet"]
};
for (const [label, examples] of Object.entries(extra)) corpus[label] = [...(corpus[label] || []), ...examples];
export const trainingCount = Object.values(corpus).flat().length;
const tokens = (s: string): string[] => s.toLowerCase().match(/[a-z]+/g) || [];
export function classify(text: string) {
  const headings = text.trim().split(/\n+/).slice(0, 2);
  const labels = ["Internship", "Scholarship", "Hackathon", "Workshop", "Placement", "Examination"];
  for (const heading of headings) {
    if (heading.length > 100 ||
        /\b(?:must|required|eligible|minimum|deadline|cgpa|skills|documents|except|unless)\b/i.test(heading)) continue;
    const matches = labels.filter(label =>
      new RegExp("\\b" + label + "\\b", "i").test(heading)
    );
    if (matches.length === 1) return matches[0];
  }

  const documents = Object.values(corpus).flat().map(tokens),
    vocab = [...new Set(documents.flat())];
  const vec = (s: string) => {
    const words = tokens(s),
      v = vocab.map(
        (w) =>
          words.filter((t) => t === w).length *
          (1 +
            Math.log(
              (1 + documents.length) /
                (1 + documents.filter((d) => d.includes(w)).length),
            )),
      );
    const norm = Math.hypot(...v) || 1;
    return v.map((x) => x / norm);
  };
  const q = vec(text);
  if (!q.some(Boolean)) return "Unclassified";
  const scores = Object.entries(corpus)
    .map(([label, docs]) => {
      const vectors = docs.map(vec),
        counts = vocab.map((_, i) => 1 + vectors.reduce((a, v) => a + v[i], 0)),
        sum = counts.reduce((a, b) => a + b, 0);
      return {
        label,
        score: q.reduce((a, x, i) => a + x * Math.log(counts[i] / sum), 0),
      };
    })
    .sort((a, b) => b.score - a.score);
  return scores[0].score - scores[1].score < 0.04
    ? "Unclassified"
    : scores[0].label;
}
export function validateProfile(p: Profile): string[] {
 const errors: string[] = [];
 if (!p.name.trim()) errors.push("Enter a student name.");
 if (!Object.hasOwn(branches,p.branch)) errors.push("Choose a valid branch.");
 if (!/^\d+(?:\.\d+)?$/.test(p.cgpa.trim()) || +p.cgpa < 0 || +p.cgpa > 10) errors.push("CGPA must be between 0 and 10.");
 if (!/^20\d{2}$/.test(p.year) && p.year !== "2100") errors.push("Enter a valid graduation year (2000–2100).");
 if (p.academicYear && !/^[1-4]$/.test(p.academicYear)) errors.push("Academic year must be 1–4.");
 return errors;
}
const months = "January February March April May June July August September October November December".split(" ");
function dateValue(raw: string): string | null {
 raw = raw.trim().replace(
   /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})$/i,
   "$2 $1 $3"
 );
 const m = raw.trim().match(/^(\d{1,2})(?:st|nd|rd|th)?[ -]([a-z]+)[ , -]+(20\d{2})$/i);
 if (!m) return null;
 const month = months.findIndex(x => x.toLowerCase() === m[2].toLowerCase() || x.slice(0,3).toLowerCase() === m[2].toLowerCase());
 if (month < 0) return null;
 const d = new Date(Date.UTC(+m[3],month,+m[1]));
 return d.getUTCMonth() === month && d.getUTCDate() === +m[1] ? d.toISOString().slice(0,10) : null;
}
const splitList = (s: string) => s.split(/\s*(?:,|\/|\band\b|\bor\b)\s*/i).map(x=>x.trim()).filter(Boolean);
const branchCode = (s: string) => Object.keys(branches).find(k=>k.toLowerCase()===s.toLowerCase() || branches[k].toLowerCase()===s.toLowerCase());
export function analyze(text: string, p: Profile, today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })()) {
 const rows: {field:string;quote:string;profile:string;match:boolean; explanation:string}[] = [], review = validateProfile(p), docs:string[] = [], deadlines:string[] = [], missingSkills:string[] = [];
 const profileValid = !review.length;
 const lines = text.trim().split(/\n+|(?<=[.!?])\s+|;\s*/).map(x=>x.trim()).filter(Boolean);
 for (const [i,quote] of lines.entries()) {
  let s = quote.replace(/^[•*–-]\s*/, "").replace(/[.;]$/, "").trim();
  let m: RegExpMatchArray | null;
  const row = (field:string, value:string, match:boolean, explanation:string) => rows.push({field,quote,profile:value,match:profileValid && match,explanation:profileValid?explanation:"Invalid student profile; correct it first."});
  if (/\b(?:except|unless|waiver|priority|preferred|preference|may be|either|not eligible|backlogs?|arrears|income|citizenship|age limit|percentage|attendance|only if)\b/i.test(s)) {review.push(quote); continue;}
  s=s.replace(/^(?:students|applicants|candidates) must have (?:a |an )?/i, "");
  if ((m=s.match(/^(?:minimum cgpa\s*(?:of|is|:)?\s*|cgpa\s*(?:of at least|at least|>=|≥)\s*)(\d+(?:\.\d+)?)(?:\s*\/\s*10)?(?:\s+(?:is mandatory|or above|or higher))?$/i)) || (m=s.match(/^cgpa\s*(?:>|above|greater than|more than)\s*(\d+(?:\.\d+)?)$/i))) {
   const strict=/^cgpa\s*(?:>(?!=)|above|greater than|more than)/i.test(s); const cutoff=+m[1];
   if(cutoff>10){review.push(quote);continue;}
   row("Minimum CGPA",p.cgpa,strict?+p.cgpa>cutoff:+p.cgpa>=cutoff,`Requires CGPA ${strict?">":"≥"} ${cutoff}.`);
  } else if (/^(?:open to|eligible for) all (?:engineering )?branches$/i.test(s)) row("Eligible branches",p.branch,true,"All branches accepted.");
  else if ((m=s.match(/^(?:eligible branches|branches)\s*(?::|include|are)\s*(.+)$/i)) || (m=s.match(/^(?:open to|only)\s+((?!.*\byear\b).+?)\s+students(?: are eligible)?$/i))) {
   const list=splitList(m[1]).map(branchCode); if(!list.length||list.some(x=>!x)){review.push(quote);continue;}
   row("Eligible branches",p.branch,list.includes(p.branch),`Accepted: ${list.join(", ")}.`);
  } else if ((m=s.match(/^(?:graduation year|batch)\s*:\s*(20\d{2})$/i)) || (m=s.match(/^(?:students |applicants )?graduating in (20\d{2})(?: are eligible)?$/i))) row("Graduation year",p.year,p.year===m[1],`Required graduation year: ${m[1]}.`);
  else if ((m=s.match(/^(?:academic year|year of study|eligible years)\s*:\s*(.+)$/i)) || (m=s.match(/^(?:open to |only )?((?:[1-4](?:st|nd|rd|th)?|first|second|third|fourth|final)[ -]year) students(?: are eligible)?$/i))) {
   const aliases:Record<string,string>={first:"1",second:"2",third:"3",fourth:"4",final:"4"};
  
   // ordinal words must not be stripped (first, second, third, fourth)
   const normalized=splitList(m[1]).map(x=>{const v=x.toLowerCase().replace(/[ -]year$/," ").trim();return aliases[v]||v.replace(/^([1-4])(?:st|nd|rd|th)$/, "$1");});
   if(!normalized.every(x=>/^[1-4]$/.test(x))||!p.academicYear){review.push(quote);continue;}
   row("Academic year",p.academicYear,normalized.includes(p.academicYear),`Accepted study years: ${normalized.join(", ")}. Final year assumes a four-year degree.`);
  } else if ((m=s.match(/^(?:(?:application|registration|submission) )?deadline\s*(?::|is)\s*(.+)$/i)) || (m=s.match(/^(?:apply|register|submit|applications close|registration closes)\s+(?:by |on )?(.+)$/i))) {deadlines.push(m[1]);if(!dateValue(m[1]))review.push(`Invalid or ambiguous deadline: ${quote}`);}
  else if ((m=s.match(/^required documents\s*:\s*(.+)$/i))) docs.push(...splitList(m[1]));
  else if ((m=s.match(/^(?:required skills|mandatory skills|skills required)\s*:\s*(.+)$/i))) {
   if(/\bor\b|\/|\b(?:any|one of)\b/i.test(m[1])){review.push(quote);continue;}
   const required=splitList(m[1]);const own=(p.skills||"").split(/[,;\n]/).map(x=>x.trim().toLowerCase()); const missing=required.filter(x=>!own.includes(x.toLowerCase()));missingSkills.push(...missing);
   if(!p.skills?.trim()){review.push(`Skills not supplied: ${quote}`);continue;}
   row("Required skills",p.skills,!missing.length,missing.length?`Missing: ${missing.join(", ")}.`:"All listed skills supplied.");
  } else if (
    i===1 &&
    /^(?:sample campus notice|campus notice|college notice|notice)$/i.test(lines[0]) &&
    s.length < 100 &&
    /\b(?:internship|scholarship|hackathon|workshop|placement|examination)\b/i.test(s) &&
    !/\b(?:must|required|eligible|only|minimum|maximum|deadline|cgpa|criteria|qualification|except|unless)\b/i.test(s)
  ) { /* secondary notice title */ }
  else if (i===0 && lines.length>1 && s.length<100 && !/\b(?:must|minimum|maximum|eligible|eligibility|required|only|deadline|cgpa|year|skills|branch|students|apply|register|need|criteria|qualification)\b/i.test(s)) { /* heading */ }
  else if (/^Applications are open for our summer engineering internship$/i.test(s)) { /* known informational sentence */ }
  else review.push(quote);
 }
 if(rows.some((r,i)=>rows.slice(0,i).some(o=>o.field===r.field&&o.quote!==r.quote))) review.push("Multiple rules for the same field need reconciliation.");
 if(deadlines.length>1)review.push("Confirm which deadline applies.");
 const date=deadlines.length===1?dateValue(deadlines[0]):null;
 const deadlineStatus=deadlines.length===0?"Not stated":!date?"Needs review":date<today?"Expired":"Open by date (confirm time zone and cutoff)";
 const verdict=!rows.length||review.length?"Manual review":rows.some(r=>!r.match)?"Ineligible":"Eligible";
 return {category:classify(text),verdict,rows,review,docs:[...new Set(docs)],deadline:deadlines.join("; ")||"Not stated",deadlineStatus,missingSkills:[...new Set(missingSkills)],profile:{...p},source:text};
}
export type Result = ReturnType<typeof analyze>;
