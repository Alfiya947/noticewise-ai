"use client";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { analyze, initialProfile, trainingCount } from "@/lib/checker";
import { cases } from "@/lib/test-cases";
export function TestLab(){
 const [results,setResults]=useState<{name:string;expected:string;actual:string;pass:boolean}[]>([]);
 function run(){setResults(cases.map(c=>{const r=analyze(c.text,{...initialProfile,...c.profile},"2026-11-24");return {name:c.name,expected:c.expected,actual:r.verdict,pass:r.verdict===c.expected&&(!c.deadline||r.deadlineStatus===c.deadline)&&(!c.category||r.category===c.category)&&(!c.missing||JSON.stringify(r.missingSkills)===JSON.stringify(c.missing))&&r.rows.every(x=>c.text.includes(x.quote))};}));}
 return <section id="test-lab" className="card report"><div className="between"><div className="sectiontitle"><span className="tile"><FlaskConical/></span><h2>Test Lab</h2></div><button className="outline" onClick={run}>Run {cases.length} checks</button></div><p className="desc">Local classifier: {trainingCount} synthetic training examples. Tests use a fixed date of 24 November 2026 for reproducibility. These are regression checks, not real-world accuracy.</p>{results.length>0&&<><div className="verdict"><strong>{results.filter(r=>r.pass).length}/{results.length} passed</strong><span>Executed in your browser</span></div>{results.map(r=><div className="evidence" key={r.name}><div><b>{r.pass?"PASS":"FAIL"} · {r.name}</b><p>Expected: {r.expected} · Actual: {r.actual}</p></div></div>)}</>}</section>;
}
