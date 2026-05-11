"use client"

const TESTIMONIALS = [
  { quote: "I went from 45% to 82% in three weeks. UNILAG I'm coming 🔥", name: "Chukwuemeka A.", school: "Targeting UNILAG" },
  { quote: "The daily quiz streak is genuinely addictive. Missed one day and I was so pained 😭", name: "Adaeze O.", school: "Targeting UI" },
  { quote: "Finally a prep app with actual OAU questions. The explanations are 10/10 fr", name: "Biodun F.", school: "Targeting OAU" },
  { quote: "I used to think CBT was hard. PassAm made me realise I just wasn't practising right", name: "Emeka T.", school: "Targeting UNIBEN" },
  { quote: "My score jumped 30 points. My parents think I just read harder. Lmao 😂", name: "Fatima M.", school: "Targeting UI" },
  { quote: "The leaderboard competition with my friend pushed me like nothing else did", name: "Segun A.", school: "Targeting UNILAG" },
  { quote: "No dulling — the questions are exactly what showed up in my actual exam", name: "Amaka E.", school: "Targeting UNIPORT" },
  { quote: "This app is the AFIT secret weapon nobody's talking about yet", name: "Abdullahi I.", school: "Targeting AFIT" },
]

function Card({ quote, name, school }: { quote: string; name: string; school: string }) {
  return (
    <div className="mx-3 w-72 shrink-0 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <p className="text-sm leading-relaxed text-white/90">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/40 text-xs font-black text-white">
          {name.split(" ").map(n => n[0]).join("").toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-bold text-white">{name}</p>
          <p className="text-[11px] text-white/50">{school}</p>
        </div>
      </div>
    </div>
  )
}

export function TestimonialMarquee() {
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS]

  return (
    <div className="overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
      <div className="flex animate-marquee w-max">
        {doubled.map((t, i) => (
          <Card key={i} {...t} />
        ))}
      </div>
    </div>
  )
}
