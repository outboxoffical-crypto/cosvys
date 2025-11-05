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
  const [leadStats, setLeadStats] = useState({ total: 0, converted: 0, dropped: 0, pending: 0 });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: "",
    phone_number: "",
    town_area: "",
    central_local: "Local",
    lead_id: "",
    status: "Pending",
    quotation_value: 0,
    nps: null as number | null,
    drop_reason_remarks: "",
    approval_status: "Pending",
    approved_by: "",
  });

  useEffect(() => {
    fetchLeads();
    fetchLeadStats();
  }, []);

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
        quotation_value: Number(formData.quotation_value),
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
      quotation_value: 0,
      nps: null,
      drop_reason_remarks: "",
      approval_status: "Pending",
      approved_by: "",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Lead Book</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
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
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead_id">Lead ID</Label>
                    <Input
                      id="lead_id"
                      value={formData.lead_id}
                      onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="town_area">Town / Area</Label>
                    <Input
                      id="town_area"
                      value={formData.town_area}
                      onChange={(e) => setFormData({ ...formData, town_area: e.target.value })}
                      required
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
                      value={formData.quotation_value}
                      onChange={(e) => setFormData({ ...formData, quotation_value: parseFloat(e.target.value) || 0 })}
                      required
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
                  <Button type="submit">
                    {editingLead ? "Update Lead" : "Add Lead"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lead Summary Statistics */}
        <Card className="eca-shadow mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Lead Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            <div className="text-center py-8 text-muted-foreground">
              No leads found. Add your first lead to get started.
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