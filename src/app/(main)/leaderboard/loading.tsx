import { BookLoader } from "@/components/shared/BookLoader"

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <BookLoader />
    </div>
  )
}
