import { BookLoader } from "@/components/shared/BookLoader"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <BookLoader />
    </div>
  )
}
