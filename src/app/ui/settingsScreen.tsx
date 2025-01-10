'use client'

import { useState, useEffect } from 'react'
import { UserCircle, Bell, Settings, Phone, Check } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { debugAudioState } from '@/lib/call'
import { type UserData } from "../types/chat"

interface SettingsScreenProps {
  userData: Partial<UserData>;
}


type SipSecurityInfo = {
  protocol: string
  port: string
  socket: string
  server: string
}

const settingsMenu = [
  { id: 'profile', name: 'Profile', icon: UserCircle },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'general', name: 'General', icon: Settings },
  { id: 'call', name: 'Call', icon: Phone }
]

export default function SettingsScreen({ userData }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState('profile')
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
    const savedPassword = localStorage.getItem('sipPassword')
    const savedSecurityInfo = JSON.parse(localStorage.getItem('sipSecurityInfo') || '{}')

    if (savedPassword) setSavedSipPassword(savedPassword)
    if (savedSecurityInfo) setSavedSipSecurityInfo(savedSecurityInfo)

    if (userData.email) {
        localStorage.setItem('sipUsername', userData.email)
        const serverFromEmail = userData.email.split('@')[1]
        setSipSecurityInfo(prev => ({ ...prev, server: serverFromEmail }))
      }
  }, [userData.email])

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
    if (!userData.email) {
      console.warn('Email is not available')
      return
    }

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
    <div className="flex h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="w-full"
      >
        <div className="flex">
          <TabsList className="w-52 flex-col justify-start border-r h-[80vh] space-y-1 rounded-none bg-muted/30 p-0">
            {settingsMenu.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="w-full justify-start gap-2 px-4 py-2 font-normal"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1">
            <ScrollArea className="h-[80vh]">
              <div className="p-6">
                <TabsContent value="profile" className="mt-0 border-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">Profile Settings</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage your account settings and preferences.
                      </p>
                    </div>
                    <Separator />
                    <Card>
                      <CardHeader>
                        <CardTitle>User Information</CardTitle>
                        <CardDescription>Your account details and information.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <Label>User ID</Label>
                          <p className="text-sm text-muted-foreground">{userData.uid}</p>
                        </div>
                        <div className="space-y-1">
                          <Label>Email</Label>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                        </div>
                        <div className="space-y-1">
                          <Label>Display Name</Label>
                          <p className="text-sm text-muted-foreground">
                            {userData.displayName || 'Not set'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-0 border-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
                      <p className="text-sm text-muted-foreground">
                        Configure how you receive notifications.
                      </p>
                    </div>
                    <Separator />
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Email Notifications</CardTitle>
                          <CardDescription>Configure your email notification preferences.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Add email notification settings here */}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Push Notifications</CardTitle>
                          <CardDescription>Configure your push notification preferences.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Add push notification settings here */}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="general" className="mt-0 border-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">General Settings</h2>
                      <p className="text-sm text-muted-foreground">
                        Customize your application preferences.
                      </p>
                    </div>
                    <Separator />
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Language</CardTitle>
                          <CardDescription>Choose your preferred language.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Add language settings here */}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Theme</CardTitle>
                          <CardDescription>Customize the application appearance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Add theme settings here */}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="call" className="mt-0 border-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">Call Settings</h2>
                      <p className="text-sm text-muted-foreground">
                        Configure your call and audio preferences.
                      </p>
                    </div>
                    <Separator />
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Audio Settings</CardTitle>
                          <CardDescription>Configure microphone and speaker settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={debugAudioState}
                          >
                            Debug Audio
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>SIP Account</CardTitle>
                          <CardDescription>Manage your SIP credentials.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="sipUsername">SIP Username</Label>
                            <Input id="sipUsername" value={userData.email} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sipPassword">SIP Password</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="sipPassword"
                                type="password"
                                value={sipPassword}
                                onChange={(e) => setSipPassword(e.target.value)}
                                placeholder="Enter your SIP password"
                              />
                              <Button onClick={handleSavePassword} size="sm">
                                Save
                              </Button>
                              <Button 
                                onClick={handleDeletePassword} 
                                variant="destructive"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </div>
                            {savedSipPassword && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                Password saved
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>SIP Security</CardTitle>
                          <CardDescription>Configure SIP security settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="sipProtocol">SIP Protocol</Label>
                            <Select 
                              onValueChange={(value: 'udp' | 'tcp' | 'tls') => 
                                setSipSecurityInfo(prev => ({...prev, protocol: value}))
                              }
                            >
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

                          <div className="space-y-2">
                            <Label htmlFor="sipSocket">WebSocket Protocol</Label>
                            <Select 
                              onValueChange={(value) => 
                                setSipSecurityInfo(prev => ({...prev, socket: value}))
                              }
                            >
                              <SelectTrigger id="sipSocket">
                                <SelectValue placeholder="Select WebSocket protocol" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ws">WS (WebSocket)</SelectItem>
                                <SelectItem value="wss">WSS (WebSocket Secure)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor="sipServer">SIP Server</Label>
                              <Input
                                id="sipServer"
                                value={sipSecurityInfo.server}
                                disabled
                                placeholder="SIP Server is set automatically"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sipPort">SIP Port</Label>
                              <Select 
                                onValueChange={(value) => 
                                  setSipSecurityInfo(prev => ({...prev, port: value}))
                                }
                              >
                                <SelectTrigger id="sipPort">
                                  <SelectValue placeholder="Port" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="6050">6050</SelectItem>
                                  <SelectItem value="6051">6051</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-2">
                            <Button onClick={handleSaveSipSecurityInfo}>
                              Save Settings
                            </Button>
                            <Button 
                              onClick={handleDeleteSipSecurityInfo} 
                              variant="destructive"
                            >
                              Reset
                            </Button>
                          </div>

                          {savedSipSecurityInfo && (
                            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                              <div className="font-medium text-foreground mb-2">Saved Configuration</div>
                              <div className="grid gap-1">
                                <div>Protocol: {savedSipSecurityInfo.protocol}</div>
                                <div>Server: {savedSipSecurityInfo.server}</div>
                                <div>Port: {savedSipSecurityInfo.port}</div>
                                <div>Socket: {savedSipSecurityInfo.socket}</div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

