'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, Bell, Settings, Phone } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

type UserData = {
  displayName?: string;
  email: string;
  photoURL?: string;
  uid: string;
}

type SipSecurityInfo = {
  protocol: string;
  port: string;
  socket: string;
  server: string;
}

const settingsMenu = [
  { id: 1, name: 'Profile', icon: UserCircle },
  { id: 2, name: 'Notifications', icon: Bell },
  { id: 3, name: 'General', icon: Settings },
  { id: 4, name: 'Call', icon: Phone }
]

export default function SettingsScreen({ userData }: { userData: UserData }) {
  const [selectedSetting, setSelectedSetting] = useState(settingsMenu[0])
  const [sipPassword, setSipPassword] = useState('')
  const [savedSipPassword, setSavedSipPassword] = useState('')
  const [sipSecurityInfo, setSipSecurityInfo] = useState<SipSecurityInfo>({
    protocol: '',
    port: '',
    socket: '',
    server: ''
  })
  const [savedSipSecurityInfo, setSavedSipSecurityInfo] = useState<SipSecurityInfo | null>(null)

  useEffect(() => {
    // Load saved data from localStorage when component mounts
    const savedPassword = localStorage.getItem('sipPassword')
    const savedSecurityInfo = JSON.parse(localStorage.getItem('sipSecurityInfo') || '{}')


    if (savedPassword) setSavedSipPassword(savedPassword)
    if (savedSecurityInfo) setSavedSipSecurityInfo(savedSecurityInfo)

    localStorage.setItem('sipUsername', userData.email)

    const serverFromEmail = userData.email.split('@')[1]
    setSipSecurityInfo(prev=> ({ ...prev, server: serverFromEmail}))
  }, [userData.email])

  const handleSettingClick = (setting: any) => {
    setSelectedSetting(setting)
  }

  const handleSavePassword = () => {
    setSavedSipPassword(sipPassword)
    localStorage.setItem('sipPassword', sipPassword)
    setSipPassword('')
  }

  const handleDeletePassword = () => {
    setSavedSipPassword('')
    localStorage.removeItem('sipPassword')
  }

  const handleSaveSipSecurityInfo = () => {
    const updatedSipSecurityInfo = { 
        ...sipSecurityInfo,
        server: userData.email.split('@')[1],
        port: sipSecurityInfo.port.toString()
    }
    setSavedSipSecurityInfo(updatedSipSecurityInfo)
    localStorage.setItem('sipSecurityInfo', JSON.stringify(updatedSipSecurityInfo))
  }

  const handleDeleteSipSecurityInfo = () => {
    setSavedSipSecurityInfo(null)
    setSipSecurityInfo({
      protocol: 'udp',
      port: '',
      socket: '',
      server: ''
    })
    localStorage.removeItem('sipSecurityInfo')
  }

  return (
    <div className="flex h-full max-h-full overflow-hidden">
      {/* Left side - Settings list */}
      <div className="w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="flex flex-col py-4">
          {settingsMenu.map((setting) => (
            <Button
              key={setting.id}
              variant={selectedSetting.id === setting.id ? "default" : "ghost"}
              className="justify-start rounded-none py-2 px-4"
              onClick={() => handleSettingClick(setting)}
            >
              <setting.icon className="mr-2 h-5 w-5" />
              {setting.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Right side - Settings details */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">{selectedSetting.name} Settings</h2>
            <div className="space-y-6">
              {selectedSetting.id === 1 && (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">User Information</h3>
                      <div className="space-y-2">
                        <p><strong>UID:</strong> {userData.uid}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Display Name:</strong> {userData.displayName || 'Not set'}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                      <p>Manage your account settings here.</p>
                    </CardContent>
                  </Card>
                </>
              )}
              {selectedSetting.id === 2 && (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                      <p>Manage your email notification preferences here.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
                      <p>Manage your push notification preferences here.</p>
                    </CardContent>
                  </Card>
                </>
              )}
              {selectedSetting.id === 3 && (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Language Settings</h3>
                      <p>Choose your preferred language for the application.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
                      <p>Customize the application's appearance.</p>
                    </CardContent>
                  </Card>
                </>
              )}
              {selectedSetting.id === 4 && (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Audio Settings</h3>
                      <p>Configure your microphone and speaker settings for calls.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">SIP Information</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sipUsername">SIP Username</Label>
                          <Input id="sipUsername" value={userData.email} disabled />
                        </div>
                        <div>
                          <Label htmlFor="sipPassword">SIP Password</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="sipPassword"
                              type="password"
                              value={sipPassword}
                              onChange={(e) => setSipPassword(e.target.value)}
                              placeholder="Enter your SIP password"
                            />
                            <Button onClick={handleSavePassword}>Save</Button>
                            <Button onClick={handleDeletePassword} variant="destructive">Delete</Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Password: {savedSipPassword ? savedSipPassword : 'none'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">SIP Security Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sipProtocol">SIP Protocol</Label>
                          <Select onValueChange={(value: 'udp' | 'tcp' | 'tls') => setSipSecurityInfo(prev => ({...prev, protocol: value}))}>
                            <SelectTrigger id="sipProtocol">
                              <SelectValue placeholder="Select SIP protocol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="udp">UDP</SelectItem>
                              <SelectItem value="tcp">TCP</SelectItem>
                              <SelectItem value="tls">TLS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="sipSocket">WebSocket Protocol</Label>
                          <Select onValueChange={(value) => setSipSecurityInfo({...sipSecurityInfo, socket: value})}>
                            <SelectTrigger id="sipSocket">
                              <SelectValue placeholder="Select WebSocket protocol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ws">WS (WebSocket)</SelectItem>
                              <SelectItem value="wss">WSS (WebSocket Secure)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <Label htmlFor="sipServer">SIP Server</Label>
                            <Input
                              id="sipServer"
                              value={sipSecurityInfo.server}
                              disabled
                              placeholder="Sip Server is set automatically"
                            />
                          </div>
                          <div className="w-1/3">
                            <Label htmlFor="sipPort">SIP Port</Label>
                            <Select onValueChange={(value) => setSipSecurityInfo({...sipSecurityInfo, port: value})}>
                              <SelectTrigger id="sipPort">
                                <SelectValue placeholder="Select SIP port" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6050">6050</SelectItem>
                                <SelectItem value="6051">6051</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleSaveSipSecurityInfo}>Save</Button>
                          <Button onClick={handleDeleteSipSecurityInfo} variant="destructive">Delete</Button>
                        </div>
                        {savedSipSecurityInfo && (
                          <div className="text-sm text-gray-600">
                            <p>Protocol: {savedSipSecurityInfo.protocol}</p>
                            <p>Server: {savedSipSecurityInfo.server}</p>
                            <p>Port: {savedSipSecurityInfo.port}</p>
                            <p>Socket: {savedSipSecurityInfo.socket}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}