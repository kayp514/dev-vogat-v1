import { CallService } from "./call-service"
import type { UserData, CallerInfo } from "../type"

interface PageProps {
    userData: UserData
    onCall: (phoneNumber: string, callerInfo: CallerInfo, calleeInfo: CallerInfo) => void
}

export default function Page({ userData, onCall }: PageProps) {
    return (
    <div className="flex h-full">
        <CallService userData={userData} onCall={onCall} />
    </div>
    )
  }
  
  