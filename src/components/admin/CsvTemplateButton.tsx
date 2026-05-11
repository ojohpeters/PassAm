"use client"

import { Download } from "lucide-react"

export function CsvTemplateButton() {
  function download() {
    const header = "text,schoolId,subjectId,optA,optB,optC,optD,correct,explanation,year"
    const example = [
      `"What is the capital of Nigeria?",SCHOOL_UUID_HERE,SUBJECT_UUID_HERE,Lagos,Abuja,Kano,Ibadan,B,"Abuja became Nigeria's capital in 1991.",1990`,
      `"Which gas makes up the most of Earth's atmosphere?",SCHOOL_UUID_HERE,SUBJECT_UUID_HERE,Oxygen,Nitrogen,Carbon Dioxide,Hydrogen,B,"Nitrogen makes up about 78% of Earth's atmosphere.",2020`,
    ].join("\n")

    const blob = new Blob([header + "\n" + example], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url
    a.download = "passam_questions_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.98]"
    >
      <Download className="h-4 w-4" />
      Download Template CSV
    </button>
  )
}
