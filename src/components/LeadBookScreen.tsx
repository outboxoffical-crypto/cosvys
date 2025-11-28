import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit, BookOpen, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface Lead {
  id: string;
  date: string;
  name: string;
  phone_number: string;
  town_area: string;
  central_local: string;
  lead_id: string;
  status: string;
  quotation_value: number;
  nps: number | null;
  drop_reason_remarks: string | null;
  approval_status: string;
  approved_by: string | null;
}

const LeadBookScreen = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leadStats, setLeadStats] = useState({ total: 0, converted: 0, dropped: 0, pending: 0 });
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [monthlyConversionData, setMonthlyConversionData] = useState({ total: 0, converted: 0, percentage: 0 });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: "",
    phone_number: "",
    town_area: "",
    central_local: "Local",
    lead_id: "",
    status: "Pending",
    quotation_value: "" as string | number,
    nps: null as number | null,
    drop_reason_remarks: "",
    approval_status: "Pending",
    approved_by: "",
  });

  useEffect(() => {
    fetchLeads();
    fetchLeadStats();
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth && leads.length > 0) {
      calculateMonthlyConversion(selectedMonth);
    }
  }, [selectedMonth, leads]);

  const calculateMonthlyConversion = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthLeads = leads.filter(lead => {
      const leadDate = new Date(lead.date);
      return leadDate.getFullYear() === parseInt(year) && 
             leadDate.getMonth() + 1 === parseInt(monthNum);
    });

    const total = monthLeads.length;
    const converted = monthLeads.filter(l => l.status === "Converted").length;
    const percentage = total > 0 ? Math.round((converted / total) * 100) : 0;

    setMonthlyConversionData({ total, converted, percentage });
  };

  const getLast12Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel });
    }
    return months;
  };

  const fetchLeadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: leadsData, error } = await supabase
        .from("leads")
        .select("status, approval_status")
        .eq("user_id", user.id);

      if (error) throw error;

      const stats = {
        total: leadsData?.length || 0,
        converted: leadsData?.filter(l => l.status === "Converted").length || 0,
        dropped: leadsData?.filter(l => l.status === "Dropped").length || 0,
        pending: leadsData?.filter(l => l.approval_status === "Pending").length || 0,
      };

      setLeadStats(stats);
    } catch (error: any) {
      console.error("Failed to fetch lead stats:", error.message);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view leads");
        return;
      }

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return; // Prevent duplicate submissions
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to add/edit leads");
        return;
      }

      const leadData = {
        ...formData,
        user_id: user.id,
        nps: formData.nps === null ? null : Number(formData.nps),
        quotation_value: formData.quotation_value === "" ? 0 : Number(formData.quotation_value),
      };

      if (editingLead) {
        const { error } = await supabase
          .from("leads")
          .update(leadData)
          .eq("id", editingLead.id);

        if (error) throw error;
        toast.success("Lead updated successfully");
      } else {
        const { error } = await supabase
          .from("leads")
          .insert([leadData]);

        if (error) throw error;
        toast.success("Lead added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchLeads();
      fetchLeadStats();
    } catch (error: any) {
      toast.error("Failed to save lead: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Lead deleted successfully");
      fetchLeads();
      fetchLeadStats();
    } catch (error: any) {
      toast.error("Failed to delete lead: " + error.message);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      date: new Date(lead.date).toISOString().split('T')[0],
      name: lead.name,
      phone_number: lead.phone_number,
      town_area: lead.town_area,
      central_local: lead.central_local,
      lead_id: lead.lead_id,
      status: lead.status,
      quotation_value: lead.quotation_value,
      nps: lead.nps,
      drop_reason_remarks: lead.drop_reason_remarks || "",
      approval_status: lead.approval_status,
      approved_by: lead.approved_by || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      name: "",
      phone_number: "",
      town_area: "",
      central_local: "Local",
      lead_id: "",
      status: "Pending",
      quotation_value: "",
      nps: null,
      drop_reason_remarks: "",
      approval_status: "Pending",
      approved_by: "",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Lead Book</h1>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:mr-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                <div>
                  <Label htmlFor="lead_id">Lead ID</Label>
                  <Input
                    id="lead_id"
                    value={formData.lead_id}
                    onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="town_area">Town / Area</Label>
                  <Input
                    id="town_area"
                    value={formData.town_area}
                    onChange={(e) => setFormData({ ...formData, town_area: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="central_local">Central / Local</Label>
                  <Select
                    value={formData.central_local}
                    onValueChange={(value) => setFormData({ ...formData, central_local: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Central">Central</SelectItem>
                      <SelectItem value="Local">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Converted / Dropped</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quotation_value">Quotation Value</Label>
                  <Input
                    id="quotation_value"
                    type="number"
                    placeholder="0"
                    value={formData.quotation_value}
                    onChange={(e) => setFormData({ ...formData, quotation_value: e.target.value ? parseFloat(e.target.value) : "" })}
                  />
                </div>
                <div>
                  <Label htmlFor="nps">NPS (1-10)</Label>
                  <Input
                    id="nps"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.nps || ""}
                    onChange={(e) => setFormData({ ...formData, nps: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                <div>
                  <Label htmlFor="approval_status">Approval Status</Label>
                  <Select
                    value={formData.approval_status}
                    onValueChange={(value) => setFormData({ ...formData, approval_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">⏳ Pending</SelectItem>
                      <SelectItem value="Approved">✅ Approved</SelectItem>
                      <SelectItem value="Rejected">❌ Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="approved_by">Approved By</Label>
                  <Input
                    id="approved_by"
                    value={formData.approved_by}
                    onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="drop_reason_remarks">Drop Reason / Remarks</Label>
                  <Textarea
                    id="drop_reason_remarks"
                    value={formData.drop_reason_remarks}
                    onChange={(e) => setFormData({ ...formData, drop_reason_remarks: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingLead ? "Update Lead" : "Add Lead"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lead Summary Statistics */}
        <Card className="eca-shadow mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Lead Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Monthly Conversion Chart */}
            <div className="flex flex-col gap-6 mb-6 pb-6 border-b">
              {/* Month Selector */}
              <div className="w-full max-w-xs mx-auto">
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Select Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-11 text-base font-medium border hover:border-primary/40 transition-colors bg-background">
                    <SelectValue>
                      {getLast12Months().find(m => m.key === selectedMonth)?.label || "Select Month"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {getLast12Months().map((month) => (
                      <SelectItem 
                        key={month.key} 
                        value={month.key}
                        className="text-sm py-2.5"
                      >
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Donut Chart */}
              <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
                {monthlyConversionData.total === 0 ? (
                  <div className="text-center">
                    <div className="mb-4 opacity-30">
                      <ResponsiveContainer width={280} height={280}>
                        <PieChart>
                          <Pie
                            data={[{ value: 100 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            fill="#e5e7eb"
                            dataKey="value"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-muted-foreground">No lead data available for this month</p>
                  </div>
                ) : (
                  <div className="relative">
                    <ResponsiveContainer width={280} height={280}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Converted', value: monthlyConversionData.converted },
                            { name: 'Not Converted', value: monthlyConversionData.total - monthlyConversionData.converted }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="url(#gradient1)" />
                          <Cell fill="#f3f4f6" />
                        </Pie>
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#E63946" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                        </defs>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-bold bg-gradient-to-r from-[#E63946] to-[#A855F7] bg-clip-text text-transparent">
                        {monthlyConversionData.percentage}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Conversion</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{leadStats.total}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">Converted</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{leadStats.converted}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-muted-foreground">Dropped</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{leadStats.dropped}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{leadStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No leads found. Add your first lead to get started.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Town/Area</TableHead>
                    <TableHead>Central/Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quotation</TableHead>
                    <TableHead>NPS</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{new Date(lead.date).toLocaleDateString()}</TableCell>
                      <TableCell>{lead.lead_id}</TableCell>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.phone_number}</TableCell>
                      <TableCell>{lead.town_area}</TableCell>
                      <TableCell>{lead.central_local}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          lead.status === "Converted" ? "bg-green-100 text-green-800" :
                          lead.status === "Dropped" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>₹{lead.quotation_value.toLocaleString()}</TableCell>
                      <TableCell>{lead.nps || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          lead.approval_status === "Approved" ? "bg-green-100 text-green-800" :
                          lead.approval_status === "Rejected" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {lead.approval_status === "Approved" ? "✅ Approved" :
                           lead.approval_status === "Rejected" ? "❌ Rejected" :
                           "⏳ Pending"}
                        </span>
                      </TableCell>
                      <TableCell>{lead.approved_by || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{lead.drop_reason_remarks || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lead)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lead.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LeadBookScreen;