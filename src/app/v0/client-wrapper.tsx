import { AppLayout } from "../../components/app-layout";
import { UserData } from "../type";
import { createSocketConfig } from "@/ternsecure-realtime/utils/socketSessionConfig";
import { SocketProvider } from "@/ternsecure-realtime/providers/SocketProvider";
import { ChatProvider } from "@/ternsecure-realtime/providers/ChatProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";
import type { TernSecureUser } from "@tern-secure/nextjs";

const API_KEY = process.env.TERNSECURE_REALTIME_KEY;

type TernSecureUserServer = Omit<
  TernSecureUser,
  "delete" | "getIdToken" | "getIdTokenResult" | "reload" | "toJSON"
>;

export function ClientWrapper({ user }: { user: TernSecureUserServer }) {
  if (!user) return null;

  const baseUserData: UserData = {
    id: "me",
    name:
      user?.displayName ||
      (user?.email ? user.email.split("@")[0] : user?.uid.substring(0, 8)),
    email: user?.email || "",
    uid: user?.uid || "",
    avatar: user?.photoURL || "",
    phoneNumber: user?.phoneNumber || "+1 (647) 243-8101",
  };

  const socketConfig = createSocketConfig(
    user?.uid || "",
    API_KEY ?? "fake_vgt_key",
    {
      storageType: "localStorage",
      storageKey: "app_socket_session",
    }
  );

  const userData = {
    ...baseUserData,
  };

  return (
    <ChatProvider clientMetaData={userData}>
      <QueryProvider>
        <AppLayout userData={userData} />
      </QueryProvider>
    </ChatProvider>
  );
}
