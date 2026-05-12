export function BookLoader() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="book-loader" role="status" aria-label="Loading">
        <div className="book-page-left" />
        <div className="book-page-right" />
        <div className="book-page-flip" />
        <div className="book-spine" />
      </div>
      <p className="text-sm text-muted-foreground tracking-wide">
        <span className="font-black text-primary">PrepIQ</span>
        <span className="loading-dot">.</span>
        <span className="loading-dot">.</span>
        <span className="loading-dot">.</span>
      </p>
    </div>
  )
}
