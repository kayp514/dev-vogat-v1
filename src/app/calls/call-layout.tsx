import { CallService } from "./call-service"
import type { UserData, CallerInfo } from "../type"

interface CallLayoutProps {
    userData: UserData
    onCall: (phoneNumber: string, callerInfo: CallerInfo, calleeInfo: CallerInfo) => void
}

export function CallLayout({ userData, onCall }: CallLayoutProps) {
    return (
    <div className="flex h-full">
        <CallService userData={userData} onCall={onCall} />
    </div>
    )
  }