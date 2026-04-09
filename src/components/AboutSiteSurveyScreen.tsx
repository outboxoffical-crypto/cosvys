import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Type for each category's survey data
interface CategorySurvey {
  work_type?: "fresh" | "repaint" | "partial";
  surface_condition?: "smooth" | "medium" | "rough" | "damaged";
  existing_paint?: "good" | "slightly_peeling" | "heavy_peeling" | "damp";
  preparation?: "basic_cleaning" | "scraping" | "putty" | "crack_filling";
  dampness?: "none" | "minor" | "moderate" | "severe";
  wall_height?: "normal" | "medium" | "high";
  accessibility?: "easy" | "moderate" | "difficult";
}

// Main survey data structure
interface SiteSurvey {
  project_id: string;
  interior: CategorySurvey;
  exterior: CategorySurvey;
  waterproofing: CategorySurvey;
  notes?: string;
}

export default function AboutSiteSurveyScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("interior");
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);

  // Form state – one object per category
  const [formData, setFormData] = useState<SiteSurvey>({
    project_id: projectId || "",
    interior: {},
    exterior: {},
    waterproofing: {},
    notes: "",
  });

  // Fetch allowed categories from project_type
  useEffect(() => {
    if (!projectId) return;
    const fetchProjectType = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("project_type")
        .eq("id", projectId)
        .maybeSingle();
      if (error) {
        console.error("Error fetching project type:", error);
        toast.error("Failed to load project type.");
        return;
      }
      if (data?.project_type) {
        // Parse comma-separated string to array
        const types = data.project_type.split(",").map((t: string) => t.trim().toLowerCase());
        setAllowedCategories(types);
        // Set default tab to first allowed category
        if (types.length > 0) setActiveTab(types[0]);
      }
    };
    fetchProjectType();
  }, [projectId]);

  // Load existing survey data if any (for re-editing)
  useEffect(() => {
    if (!projectId) return;
    const loadSurvey = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_surveys")
        .select("survey_data")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) {
        console.error("Error loading survey:", error);
        console.error("Supabase data:", data);
        toast.error("Failed to load existing survey data. " + (error.message || "") + " (" + error.code + ")");
      } else if (data?.survey_data) {
        // survey_data is a JSONB column containing the full SiteSurvey object (minus project_id)
        const saved = data.survey_data as Omit<SiteSurvey, "project_id">;
        setFormData((prev) => ({
          ...prev,
          interior: saved.interior || {},
          exterior: saved.exterior || {},
          waterproofing: saved.waterproofing || {},
          notes: saved.notes || "",
        }));
      }
      setLoading(false);
    };
    loadSurvey();
  }, [projectId]);

  // Helper to update a specific category field
  const updateCategoryField = (
    category: keyof Omit<SiteSurvey, "project_id" | "notes">,
    field: keyof CategorySurvey,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  // Render a radio group for a given category and field
  const renderRadioGroup = (
    category: keyof Omit<SiteSurvey, "project_id" | "notes">,
    field: keyof CategorySurvey,
    label: string,
    options: { value: string; label: string }[],
    required = true
  ) => (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={formData[category][field] as string}
        onValueChange={(value) => updateCategoryField(category, field, value)}
        className="flex flex-col space-y-1"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`${category}-${field}-${opt.value}`} />
            <Label
              htmlFor={`${category}-${field}-${opt.value}`}
              className="font-normal cursor-pointer"
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  // Render the questions for a given category
  const renderCategoryQuestions = (category: keyof Omit<SiteSurvey, "project_id" | "notes">) => (
    <div className="space-y-6">
      {renderRadioGroup(category, "work_type", "What type of painting work is this?", [
        { value: "fresh", label: "Fresh Painting (New Building)" },
        { value: "repaint", label: "Repainting" },
        { value: "partial", label: "Partial Repair Work" },
      ])}

      {renderRadioGroup(category, "surface_condition", "What is the current wall surface condition?", [
        { value: "smooth", label: "Smooth Surface" },
        { value: "medium", label: "Medium Surface" },
        { value: "rough", label: "Rough Surface" },
        { value: "damaged", label: "Damaged Surface" },
      ])}

      {renderRadioGroup(category, "existing_paint", "What is the condition of the existing paint?", [
        { value: "good", label: "Good Condition" },
        { value: "slightly_peeling", label: "Slightly Peeling" },
        { value: "heavy_peeling", label: "Heavy Peeling" },
        { value: "damp", label: "Damp or Moisture Issue" },
      ])}

      {renderRadioGroup(category, "preparation", "What preparation is required before painting?", [
        { value: "basic_cleaning", label: "Basic Cleaning" },
        { value: "scraping", label: "Scraping Required" },
        { value: "putty", label: "Putty Work Needed" },
        { value: "crack_filling", label: "Crack Filling Required" },
      ])}

      {renderRadioGroup(category, "dampness", "Is there any dampness or seepage on the walls?", [
        { value: "none", label: "No" },
        { value: "minor", label: "Minor" },
        { value: "moderate", label: "Moderate" },
        { value: "severe", label: "Severe" },
      ])}

      {renderRadioGroup(category, "wall_height", "What is the wall height?", [
        { value: "normal", label: "Normal (Below 10 ft)" },
        { value: "medium", label: "Medium (10–15 ft)" },
        { value: "high", label: "High (Above 15 ft)" },
      ])}

      {renderRadioGroup(category, "accessibility", "How easy is the site for labour work?", [
        { value: "easy", label: "Easy Access" },
        { value: "moderate", label: "Moderate Access" },
        { value: "difficult", label: "Difficult Access" },
      ])}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    // Basic validation – ensure all required fields in each category are filled
    const categories = allowedCategories as const;
    const requiredFields: (keyof CategorySurvey)[] = [
      "work_type",
      "surface_condition",
      "existing_paint",
      "preparation",
      "dampness",
      "wall_height",
      "accessibility",
    ];

    for (const cat of categories) {
      for (const field of requiredFields) {
        if (!formData[cat][field]) {
          toast.error(`Please fill in all required fields for the ${cat} category.`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      // Prepare data for upsert – store everything except project_id in a JSONB column
      const surveyData = {
        interior: formData.interior,
        exterior: formData.exterior,
        waterproofing: formData.waterproofing,
        notes: formData.notes,
      };

      console.log("Attempting to save survey data:", { projectId, surveyData });

      // Try to update first, if no rows affected, insert
      const { data: existingData, error: fetchError } = await supabase
        .from("site_surveys")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from("site_surveys")
          .update({
            survey_data: surveyData,
            updated_at: new Date().toISOString(),
          })
          .eq("project_id", projectId)
          .select();
      } else {
        // Insert new record
        result = await supabase
          .from("site_surveys")
          .insert({
            project_id: projectId,
            survey_data: surveyData,
          })
          .select();
      }

      const { data, error } = result;

      if (error) {
        console.error("Error saving survey:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast.error(`Failed to save site survey: ${error.message}`);
        return;
      }

      console.log("Survey saved successfully:", data);
      toast.success("Site survey saved!");
      navigate(`/room-measurement/${projectId}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred while saving the survey.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading survey data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">About Site Survey</h1>
            <p className="text-white/80 text-sm">
              Tell us about site conditions for each project type
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Site Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${
                  allowedCategories.length === 1 ? 'grid-cols-1' :
                  allowedCategories.length === 2 ? 'grid-cols-2' :
                  'grid-cols-3'
                }`}>
                  {allowedCategories.includes("interior") && <TabsTrigger value="interior">Interior</TabsTrigger>}
                  {allowedCategories.includes("exterior") && <TabsTrigger value="exterior">Exterior</TabsTrigger>}
                  {allowedCategories.includes("waterproofing") && <TabsTrigger value="waterproofing">Waterproofing</TabsTrigger>}
                </TabsList>

                {allowedCategories.includes("interior") && (
                  <TabsContent value="interior" className="mt-6">
                    {renderCategoryQuestions("interior")}
                  </TabsContent>
                )}

                {allowedCategories.includes("exterior") && (
                  <TabsContent value="exterior" className="mt-6">
                    {renderCategoryQuestions("exterior")}
                  </TabsContent>
                )}

                {allowedCategories.includes("waterproofing") && (
                  <TabsContent value="waterproofing" className="mt-6">
                    {renderCategoryQuestions("waterproofing")}
                  </TabsContent>
                )}
              </Tabs>

              {/* Optional notes – global for the whole project */}
              <div className="space-y-2 mt-6">
                <Label htmlFor="notes" className="text-base font-medium">
                  Additional Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any other observations about the site..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4 -mx-4">
            <Button type="submit" className="w-full h-12" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save & Continue to Room Measurements"
              )}
            </Button>
          </div>
        </form>
      </div>
      <div className="h-20" />
    </div>
  );
}

