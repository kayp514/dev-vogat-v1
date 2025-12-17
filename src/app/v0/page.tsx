import { auth } from "@tern-secure/nextjs/server";
import { ClientWrapper } from "./client-wrapper";
import { createSocketConfig } from "@/ternsecure-realtime/utils/socketSessionConfig";
import { SocketProvider } from "@/ternsecure-realtime/providers/SocketProvider";

const API_KEY = process.env.TERNSECURE_REALTIME_KEY;

export default async function VzeroPage() {
  const { user, redirectToSignIn } = await auth();

  if (!user) return redirectToSignIn();

  //const socketConfig = createSocketConfig(
  //  user?.uid || "",
  //  API_KEY ?? "fake_vgt_key",
  //  {
  //    storageType: "localStorage",
  //    storageKey: "app_socket_session",
  //  }
  //);

  return (
      <ClientWrapper user={user} />
  );
}
