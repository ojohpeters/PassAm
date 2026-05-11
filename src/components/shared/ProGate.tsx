// Payment not yet implemented — all features are open for now
type Props = { children: React.ReactNode; feature?: string }

export async function ProGate({ children }: Props) {
  return <>{children}</>
}
