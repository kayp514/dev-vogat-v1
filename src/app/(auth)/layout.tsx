import { AuthHeader } from "../ui/auth-header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AuthHeader />
      <main className="pt-14">
        {children}
      </main>
    </>
  )
}