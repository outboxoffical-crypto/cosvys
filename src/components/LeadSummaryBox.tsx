import { useState, useEffect } from "react";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export const LeadSummaryBox = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to add leads");
        return;
      }

      const leadData = {
        ...formData,
        user_id: user.id,
        nps: formData.nps === null ? null : Number(formData.nps),
        quotation_value: Number(formData.quotation_value),
      };

      const { error } = await supabase
        .from("leads")
        .insert([leadData]);

      if (error) throw error;
      
      toast.success("Lead added successfully");
      setShowForm(false);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to save lead: " + error.message);
    }
  };

  const resetForm = () => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Converted":
        return <Badge className="bg-green-500 text-white text-xs">Converted</Badge>;
      case "Dropped":
        return <Badge className="bg-red-500 text-white text-xs">Dropped</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  const getApprovalBadge = (approval: string) => {
    switch (approval) {
      case "Approved":
        return <Badge className="bg-green-500 text-white text-xs">✅ Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 text-white text-xs">❌ Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">⏳ Pending</Badge>;
    }
  };

  return (
    <Card className="eca-shadow min-w-[320px] max-w-[320px] h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Lead Summary Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-4"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>

        {showForm ? (
          <ScrollArea className="flex-1 pr-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="date" className="text-xs">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-xs">Customer Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone_number" className="text-xs">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="town_area" className="text-xs">Area / Location</Label>
                <Input
                  id="town_area"
                  value={formData.town_area}
                  onChange={(e) => setFormData({ ...formData, town_area: e.target.value })}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lead_id" className="text-xs">Lead ID</Label>
                <Input
                  id="lead_id"
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-xs">Converted / Dropped</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
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
                <Label htmlFor="quotation_value" className="text-xs">Quotation Value</Label>
                <Input
                  id="quotation_value"
                  type="number"
                  value={formData.quotation_value}
                  onChange={(e) => setFormData({ ...formData, quotation_value: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nps" className="text-xs">NPS (1-10)</Label>
                <Input
                  id="nps"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.nps || ""}
                  onChange={(e) => setFormData({ ...formData, nps: e.target.value ? parseInt(e.target.value) : null })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="drop_reason_remarks" className="text-xs">Remarks / Drop Reason</Label>
                <Textarea
                  id="drop_reason_remarks"
                  value={formData.drop_reason_remarks}
                  onChange={(e) => setFormData({ ...formData, drop_reason_remarks: e.target.value })}
                  className="text-sm resize-none"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="approval_status" className="text-xs">Approval (Given by Dealer App)</Label>
                <Select
                  value={formData.approval_status}
                  onValueChange={(value) => setFormData({ ...formData, approval_status: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">⏳ Pending</SelectItem>
                    <SelectItem value="Approved">✅ Approved</SelectItem>
                    <SelectItem value="Rejected">❌ Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} size="sm" className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="flex-1">
                  Save
                </Button>
              </div>
            </form>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-8">Loading...</div>
            ) : leads.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No leads yet. Click "+ Add Lead" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <Card key={lead.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {lead.lead_id}</p>
                        </div>
                        {getStatusBadge(lead.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">₹{lead.quotation_value.toLocaleString()}</p>
                        {getApprovalBadge(lead.approval_status)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
