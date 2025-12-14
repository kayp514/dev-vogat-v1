import { SignIn } from "@tern-secure/nextjs";

export default function Page() {
  return (
    <SignIn
      socialProviders={[{ name: "google", options: { mode: "redirect" } }]}
    />
  );
}
