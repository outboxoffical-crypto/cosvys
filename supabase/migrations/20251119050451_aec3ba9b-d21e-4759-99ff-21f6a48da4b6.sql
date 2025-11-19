-- Drop the old coverage_data table and create new one with correct structure
DROP TABLE IF EXISTS public.coverage_data CASCADE;

-- Create new coverage_data table with proper structure
CREATE TABLE public.coverage_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  product_name TEXT NOT NULL,
  coats TEXT NOT NULL,
  coverage_range TEXT NOT NULL,
  unit TEXT NOT NULL,
  surface_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coverage_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Coverage data is publicly readable" 
ON public.coverage_data 
FOR SELECT 
USING (true);

-- Insert PUTTY data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, unit) VALUES
('Essential & Other', 'AP TruCare Wall Putty', '2 coats', '10–15 sq.ft per kg', 'kg'),
('Essential & Other', 'AP SmartCare Waterproof Wall Putty', '2 coats', '10–15 sq.ft per kg', 'kg');

-- Insert PRIMER data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, unit) VALUES
('Primer', 'AP TruCare Interior Wall Primer', '1 coat', '200–225 sq.ft per ltr', 'ltr'),
('Primer', 'AP TruCare Exterior Wall Primer', '1 coat', '120–140 sq.ft per ltr', 'ltr'),
('Primer', 'AP SmartCare Damp Sheath Interior Primer', '1 coat', '180–200 sq.ft per ltr', 'ltr'),
('Primer', 'AP SmartCare Damp Sheath Exterior Primer', '1 coat', '45–60 sq.ft per ltr', 'ltr'),
('Primer', 'AP Apex Ultima Protek Base Coat', '1 coat', '55–60 sq.ft per ltr', 'ltr'),
('Primer', 'AP Apex Ultima Protek Base Coat', '2 coats', '25–35 sq.ft per ltr', 'ltr'),
('Primer', 'AP Apex Ultima Protek Duralife Base Coat', '1 coat', '55–60 sq.ft per ltr', 'ltr'),
('Primer', 'AP Apex Ultima Protek Duralife Base Coat', '2 coats', '25–35 sq.ft per ltr', 'ltr');

-- Insert INTERIOR EMULSION data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, unit) VALUES
('Interior Emulsion', 'AP Tractor Sparc Emulsion', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Sparc Emulsion', '2 coats', '120–140 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor UNO Emulsion', '1 coat', '170–200 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor UNO Emulsion', '2 coats', '85–100 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Emulsion', '1 coat', '250–270 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Emulsion', '2 coats', '130–150 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Advance', '1 coat', '250–270 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Advance', '2 coats', '130–150 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Shyne', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Shyne', '2 coats', '120–140 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Shyne Advance', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Tractor Shyne Advance', '2 coats', '145–165 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite Premium Emulsion', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite Premium Emulsion', '2 coats', '130–150 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite Premium Advance', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite Premium Advance', '2 coats', '140–160 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite Premium Advance Shyne', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite Premium Advance Shyne', '2 coats', '140–160 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite All Protek Shyne', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite All Protek Shyne', '2 coats', '120–140 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite All Protek Matt', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Apcolite All Protek Matt', '2 coats', '120–140 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Luxury Emulsion', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Luxury Emulsion', '2 coats', '140–160 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Matt', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Matt', '2 coats', '140–160 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Shyne', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Shyne', '2 coats', '140–160 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Atomos', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Atomos', '2 coats', '140–160 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Glitz', '1 coat', '240–260 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Glitz', '2 coats', '140–160 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Aspira', '1 coat', '220–240 sq.ft per ltr', 'ltr'),
('Interior Emulsion', 'AP Royale Aspira', '2 coats', '110–120 sq.ft per ltr', 'ltr');

-- Insert EXTERIOR EMULSION data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, unit) VALUES
('Exterior Emulsion', 'AP Ace Emulsion', '1 coat', '100–120 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Ace Emulsion', '2 coats', '50–60 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Ace Advance', '1 coat', '100–120 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Ace Advance', '2 coats', '50–60 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Ace Shyne', '1 coat', '100–120 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Ace Shyne', '2 coats', '50–60 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Ace Shyne Advance', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Ace Shyne Advance', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Emulsion', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Emulsion', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Advance', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Advance', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Shyne', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Shyne', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Shyne Advance', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Shyne Advance', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima Stretch', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima Stretch', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima Protek (Top Coat)', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima Protek (Top Coat)', '2 coats', '55–65 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima Protek Duralife (Top Coat)', '1 coat', '110–130 sq.ft per ltr', 'ltr'),
('Exterior Emulsion', 'AP Apex Ultima Protek Duralife (Top Coat)', '2 coats', '55–65 sq.ft per ltr', 'ltr');

-- Insert WATERPROOFING data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, unit, surface_type) VALUES
('Waterproofing', 'AP SmartCare Damp Proof', '3 coats', '10–15 sq.ft per ltr', 'ltr', 'Horizontal'),
('Waterproofing', 'AP SmartCare Damp Proof', '1 coat', '25 sq.ft per ltr', 'ltr', 'Vertical Fresh'),
('Waterproofing', 'AP SmartCare Damp Proof', '1 coat', '30–35 sq.ft per ltr', 'ltr', 'Vertical Repaint'),
('Waterproofing', 'AP SmartCare Damp Proof Advance', '3 coats', '10–15 sq.ft per ltr', 'ltr', 'Horizontal'),
('Waterproofing', 'AP SmartCare Damp Proof Advance', '1 coat', '25 sq.ft per ltr', 'ltr', 'Vertical Fresh'),
('Waterproofing', 'AP SmartCare Damp Proof Advance', '1 coat', '30–35 sq.ft per ltr', 'ltr', 'Vertical Repaint'),
('Waterproofing', 'AP SmartCare Damp Proof Xtreme', '3 coats', '10–15 sq.ft per ltr', 'ltr', 'Horizontal'),
('Waterproofing', 'AP SmartCare Damp Proof Xtreme', '1 coat', '25 sq.ft per ltr', 'ltr', 'Vertical Fresh'),
('Waterproofing', 'AP SmartCare Damp Proof Xtreme', '1 coat', '30–35 sq.ft per ltr', 'ltr', 'Vertical Repaint'),
('Waterproofing', 'AP SmartCare Damp Proof Ultra', '3 coats', '10–15 sq.ft per ltr', 'ltr', 'Horizontal'),
('Waterproofing', 'AP SmartCare Damp Proof Ultra', '1 coat', '25 sq.ft per ltr', 'ltr', 'Vertical Fresh'),
('Waterproofing', 'AP SmartCare Damp Proof Ultra', '1 coat', '30–35 sq.ft per ltr', 'ltr', 'Vertical Repaint'),
('Waterproofing', 'AP SmartCare Hydrolac Xtreme', '1 coat', '40–45 sq.ft per ltr', 'ltr', NULL),
('Waterproofing', 'AP SmartCare Hydrolac Xtreme', '2 coats', '16–18 sq.ft per ltr', 'ltr', NULL),
('Waterproofing', 'AP SmartCare Damp Block 2K', '2 coats', '7.5–8 sq.ft per kg', 'kg', NULL),
('Waterproofing', 'AP SmartCare Epoxy TriBlock 2K', '2 coats', '28 sq.ft per kg', 'kg', NULL);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_coverage_data_updated_at
BEFORE UPDATE ON public.coverage_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();