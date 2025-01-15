'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

export function SipTrunk() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">SIP Trunk Configuration</h1>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SIP Security Configuration</CardTitle>
          <CardDescription>
            Configure your SIP server connection and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SIP Server Configuration */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sipServer">SIP Server</Label>
              <Input 
                id="sipServer" 
                placeholder="sip.example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sipPort">Port</Label>
              <Input 
                id="sipPort" 
                placeholder="5060"
                type="number"
              />
            </div>
          </div>

          {/* Protocol Selection */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select>
                <SelectTrigger id="protocol">
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="tls">TLS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websocket">WebSocket</Label>
              <Select>
                <SelectTrigger id="websocket">
                  <SelectValue placeholder="Select WebSocket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ws">WS (WebSocket)</SelectItem>
                  <SelectItem value="wss">WSS (Secure WebSocket)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Authentication */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="SIP username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="outboundProxy">Outbound Proxy (Optional)</Label>
              <Input 
                id="outboundProxy" 
                placeholder="proxy.example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input 
                id="domain" 
                placeholder="sip.domain.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}