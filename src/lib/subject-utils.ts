function normalizeSubjectName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function subjectSimilarity(
  a: string,
  b: string
): "exact" | "similar" | "different" {
  const na = normalizeSubjectName(a)
  const nb = normalizeSubjectName(b)
  if (na === nb) return "exact"
  if (na.includes(nb) || nb.includes(na)) return "similar"
  return "different"
}
