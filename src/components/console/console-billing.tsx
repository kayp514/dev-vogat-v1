'use client'

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Download, Receipt, Clock, DollarSign, BarChart3, ArrowUpRight, Plus, CheckCircle2, AlertCircle, FileText, Calendar } from 'lucide-react'
import { cn } from "@/lib/utils"

// Sample data
const invoices = [
  {
    id: "INV-001",
    date: "2024-01-15",
    amount: 299.00,
    status: "paid",
    description: "Monthly Subscription - Enterprise Plan",
  },
  {
    id: "INV-002",
    date: "2024-01-01",
    amount: 599.00,
    status: "pending",
    description: "Additional User Licenses (5)",
  },
  {
    id: "INV-003",
    date: "2023-12-15",
    amount: 299.00,
    status: "paid",
    description: "Monthly Subscription - Enterprise Plan",
  },
]

const paymentMethods = [
  {
    id: 1,
    type: "credit_card",
    last4: "4242",
    expiry: "12/24",
    brand: "Visa",
    isDefault: true,
  },
  {
    id: 2,
    type: "credit_card",
    last4: "5555",
    expiry: "08/25",
    brand: "Mastercard",
    isDefault: false,
  },
]

const usageStats = [
  {
    name: "Minutes Used",
    value: "2,345",
    change: "+12.3%",
    target: "3,000",
  },
  {
    name: "SMS Sent",
    value: "12,543",
    change: "+8.2%",
    target: "15,000",
  },
  {
    name: "Active DIDs",
    value: "23",
    change: "0%",
    target: "25",
  },
]

export function ConsoleBilling() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Usage</h2>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$299.00</div>
            <p className="text-xs text-muted-foreground">
              Next billing date: Feb 1, 2024
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Plan
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Enterprise</div>
            <p className="text-xs text-muted-foreground">
              Unlimited calls & messaging
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Payment Status
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Auto-pay</div>
            <p className="text-xs text-muted-foreground">
              Next payment: $299.00
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usage Status
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Of monthly allocation
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {usageStats.map((stat) => (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <Badge 
                    variant={stat.change.startsWith('+') ? 'default' : 'secondary'}
                    className="font-normal"
                  >
                    {stat.change}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="mt-4 h-2 rounded-full bg-secondary">
                    <div 
                      className="h-2 rounded-full bg-primary" 
                      style={{ 
                        width: `${(parseInt(stat.value.replace(/,/g, '')) / parseInt(stat.target.replace(/,/g, ''))) * 100}%` 
                      }} 
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Target: {stat.target}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Breakdown</CardTitle>
              <CardDescription>
                Your service usage for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Minutes Used */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Minutes Used</span>
                    <span className="text-muted-foreground">2,345 / 3,000</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div 
                      className="h-2 rounded-full bg-primary" 
                      style={{ width: '78%' }} 
                    />
                  </div>
                </div>
                {/* SMS Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">SMS Usage</span>
                    <span className="text-muted-foreground">12,543 / 15,000</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div 
                      className="h-2 rounded-full bg-primary" 
                      style={{ width: '83%' }} 
                    />
                  </div>
                </div>
                {/* DID Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">DID Usage</span>
                    <span className="text-muted-foreground">23 / 25</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div 
                      className="h-2 rounded-full bg-primary" 
                      style={{ width: '92%' }} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="month">Filter by Month</Label>
                    <Select defaultValue="january">
                      <SelectTrigger id="month" className="h-8 w-[180px]">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January 2024</SelectItem>
                        <SelectItem value="december">December 2023</SelectItem>
                        <SelectItem value="november">November 2023</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {invoice.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(invoice.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {invoice.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className={cn(
                            "font-normal",
                            invoice.status === 'paid' && "bg-green-500/15 text-green-600",
                            invoice.status === 'pending' && "bg-yellow-500/15 text-yellow-600"
                          )}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8"
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download invoice</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing preferences
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-secondary p-2">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.brand} ending in {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {method.expiry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Separator className="my-4" />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Billing Address</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Enter name" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Enter company name" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="Enter address" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Enter city" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="Enter state" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="Enter ZIP code" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

