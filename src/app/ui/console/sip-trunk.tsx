'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, Server, Shield, Globe, Network, KeyRound, AlertCircle, CheckCircle2, RefreshCw, Power } from 'lucide-react'

export function SipTrunk() {
  return (
    <ScrollArea className="h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">SIP Trunk Configuration</h1>
            <p className="text-muted-foreground">
              Configure your SIP trunk settings and manage server connections
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden md:inline-flex gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              System Active
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Connected</div>
              <p className="text-xs text-muted-foreground">Last checked 2 minutes ago</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
              <Network className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24/50</div>
              <p className="text-xs text-muted-foreground">48% utilization</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registration</CardTitle>
              <Server className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">Expires in 45 minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Mode</AlertTitle>
          <AlertDescription>
            Changes will be applied immediately after saving. Please ensure all settings are correct before saving.
          </AlertDescription>
        </Alert>

        {/* Main Configuration */}
        <Tabs defaultValue="connection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Server className="h-5 w-5 text-primary" />
                  Server Configuration
                </CardTitle>
                <CardDescription>
                  Configure your SIP server connection details and protocols
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sipDomain">SIP Domain</Label>
                      <Input 
                        id="sipDomain" 
                        placeholder="sip.example.com"
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        The domain name of your SIP server
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Select defaultValue="6050">
                        <SelectTrigger id="port">
                          <SelectValue placeholder="Select port" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6050">6050 (Default)</SelectItem>
                          <SelectItem value="6051">6051 (Alternative)</SelectItem>
                          <SelectItem value="5060">5060 (Standard SIP)</SelectItem>
                          <SelectItem value="5061">5061 (TLS)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[0.8rem] text-muted-foreground">
                        The port number for SIP communication
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Transport Protocol</Label>
                      <Select defaultValue="udp">
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="udp">UDP (Recommended)</SelectItem>
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="tls">TLS (Encrypted)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Protocol used for SIP signaling
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>WebSocket Protocol</Label>
                      <Select defaultValue="wss">
                        <SelectTrigger>
                          <SelectValue placeholder="Select WebSocket type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wss">WSS - Secure WebSocket</SelectItem>
                          <SelectItem value="ws">WS - Standard WebSocket</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Protocol for real-time communication
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Server Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure authentication and registration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="authUser">Authentication Username</Label>
                      <Input 
                        id="authUser" 
                        placeholder="Enter SIP username"
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        Username for SIP authentication
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authPassword">Authentication Password</Label>
                      <Input 
                        id="authPassword" 
                        type="password" 
                        placeholder="Enter password"
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        Secure password for authentication
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Registration Expiry</Label>
                      <Select defaultValue="3600">
                        <SelectTrigger>
                          <SelectValue placeholder="Select expiry time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1800">30 Minutes</SelectItem>
                          <SelectItem value="3600">1 Hour (Recommended)</SelectItem>
                          <SelectItem value="7200">2 Hours</SelectItem>
                          <SelectItem value="14400">4 Hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[0.8rem] text-muted-foreground">
                        How often to refresh registration
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Registration Retry Interval</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue placeholder="Select retry interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 Seconds</SelectItem>
                          <SelectItem value="30">30 Seconds (Recommended)</SelectItem>
                          <SelectItem value="60">1 Minute</SelectItem>
                          <SelectItem value="120">2 Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Time between registration attempts
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" className="gap-2">
                  <Power className="h-4 w-4" />
                  Test Connection
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}

