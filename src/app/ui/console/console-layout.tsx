'use client'

import { useState } from "react";
import { ConsoleNavBar } from "./console-navbar";
import { SipTrunk } from "./sip-trunk";


export function ConsoleLayout(){
    const [activeTab, setActiveTab] = useState("sip-trunk")

    return (
        <div className="flex h-full">
          <ConsoleNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1 overflow-auto">
            {activeTab === 'sip-trunk' && <SipTrunk />}
            {/* Add other tabs here */}
          </div>
        </div>
      )
    }