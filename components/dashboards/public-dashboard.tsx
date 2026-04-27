"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Users, DollarSign, Activity, ExternalLink, MapPin } from "lucide-react"
import { getPublicStats, getRecentTransactions, getDisasterStats } from "@/lib/api"
import { NavigationArrows } from "@/components/NavigationArrows"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function PublicDashboard() {
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalDisbursed: 0,
    totalVictims: 0,
    activeClaims: 0,
    totalDonors: 0,
  })
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [disasterData, setDisasterData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPublicStats(), getRecentTransactions(), getDisasterStats()]).then(
      ([statsData, txData, disasterStatsData]) => {
        setStats(statsData)
        setRecentTx(txData)
        setDisasterData(disasterStatsData)
        setLoading(false)
      },
    )
  }, [])

  const monthlyData = [
    { month: "Jan", donations: 45000, disbursements: 42000 },
    { month: "Feb", donations: 52000, disbursements: 48000 },
    { month: "Mar", donations: 48000, disbursements: 45000 },
    { month: "Apr", donations: 61000, disbursements: 58000 },
    { month: "May", donations: 55000, disbursements: 52000 },
    { month: "Jun", donations: 67000, disbursements: 63000 },
  ]

  if (loading) {
    return <div className="p-6">Loading public dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public Dashboard</h1>
          <p className="text-gray-600">Transparent view of disaster relief fund flows</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{stats.totalDonations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funds Disbursed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{stats.totalDisbursed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.totalDisbursed / stats.totalDonations) * 100).toFixed(1)}% of donations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Victims Helped</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalVictims}</div>
              <p className="text-xs text-muted-foreground">Across all disasters</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Claims</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.activeClaims}</div>
              <p className="text-xs text-muted-foreground">Under review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalDonors}</div>
              <p className="text-xs text-muted-foreground">Unique contributors</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="disasters">Disaster Breakdown</TabsTrigger>
            <TabsTrigger value="transparency">Transparency</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Fund Flow</CardTitle>
                  <CardDescription>Donations vs Disbursements over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, ""]} />
                      <Line type="monotone" dataKey="donations" stroke="#3B82F6" strokeWidth={2} name="Donations" />
                      <Line
                        type="monotone"
                        dataKey="disbursements"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Disbursements"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Disaster Type Distribution</CardTitle>
                  <CardDescription>Breakdown of relief by disaster type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={disasterData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {disasterData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Blockchain Transactions</CardTitle>
                <CardDescription>Latest donations and disbursements on Polygon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTx.map((tx: any) => (
                    <div key={tx.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge className={tx.type === "donation" ? "bg-blue-500" : "bg-green-500"}>
                            {tx.type.toUpperCase()}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{tx.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{tx.disasterType}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{tx.location}</span>
                        </div>
                        <a
                          href={`https://mumbai.polygonscan.com/tx/${tx.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          View on Blockchain <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disasters">
            <Card>
              <CardHeader>
                <CardTitle>Disaster Impact Analysis</CardTitle>
                <CardDescription>Breakdown of relief efforts by disaster type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={disasterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Relief Amount"]} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transparency">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Verification</CardTitle>
                  <CardDescription>All transactions are publicly verifiable</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Smart Contract Address</span>
                      <a
                        href="https://mumbai.polygonscan.com/address/0x..."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Contract
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Transactions</span>
                      <span className="font-semibold">{recentTx.length + 150}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Network</span>
                      <Badge>Polygon Mumbai</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Transparency Score</span>
                      <Badge className="bg-green-500">100%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fund Utilization</CardTitle>
                  <CardDescription>How donated funds are being used</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Direct Relief</span>
                        <span className="text-sm">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Platform Operations</span>
                        <span className="text-sm">10%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "10%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Reserve Fund</span>
                        <span className="text-sm">5%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "5%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Navigation Arrows */}
      <NavigationArrows prevPage="/" nextPage="/victim-dashboard" />
    </div>
  )
}
