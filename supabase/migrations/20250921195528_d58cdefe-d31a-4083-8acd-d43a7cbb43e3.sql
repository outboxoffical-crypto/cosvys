-- Create coverage_data table for paint products
CREATE TABLE public.coverage_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Putty', 'Primer', 'Interior Paint', 'Exterior Paint', 'Waterproofing')),
  product_name TEXT NOT NULL,
  coats TEXT NOT NULL,
  coverage_range TEXT NOT NULL,
  surface_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coverage_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no authentication required for coverage data)
CREATE POLICY "Coverage data is publicly readable" 
ON public.coverage_data 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_coverage_data_updated_at
BEFORE UPDATE ON public.coverage_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert PUTTY data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Putty', 'Asian Trucare Wall Putty', '2 coats', '10–15 sq.ft per kg', NULL, NULL),
('Putty', 'Asian Trucare Waterproof Wall Putty', '2 coats', '10–15 sq.ft per kg', NULL, NULL);

-- Insert PRIMER data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Primer', 'Interior Wall Primer', '1 coat', '200–225 sq.ft per ltr', NULL, NULL),
('Primer', 'Exterior Wall Primer', '1 coat', '120–140 sq.ft per ltr', NULL, NULL),
('Primer', 'Damp Sheath Interior Primer', '1 coat', '180–200 sq.ft per ltr', NULL, NULL),
('Primer', 'Damp Sheath Exterior Primer', '1 coat', '45 sq.ft per ltr', 'Vertical/Parapet', NULL),
('Primer', 'Damp Sheath Exterior Primer', '1 coat', '15 sq.ft per ltr', 'Horizontal/Flat roof', NULL);

-- Insert INTERIOR PAINT data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Interior Paint', 'Tractor UNO', '1 coat', '170–200 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor UNO', '2 coat', '85–100 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Sparc', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Sparc', '2 coat', '120–140 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Emulsion', '1 coat', '250–270 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Emulsion', '2 coat', '130–150 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Advance', '1 coat', '250–270 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Advance', '2 coat', '130–150 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Shyne', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Shyne', '2 coat', '120–140 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Shyne Advance', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Tractor Shyne Advance', '2 coat', '145–165 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite Premium Emulsion', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite Premium Emulsion', '2 coat', '130–150 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite Premium Advance', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite Premium Advance', '2 coat', '140–160 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite All Protek Shyne', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite All Protek Shyne', '2 coat', '120–140 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite All Protek Matt', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Apcolite All Protek Matt', '2 coat', '120–140 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Emulsion', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Emulsion', '2 coat', '140–160 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Shyne', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Shyne', '2 coat', '140–160 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Matt', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Matt', '2 coat', '140–160 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Atomos', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Atomos', '2 coat', '140–160 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Glitz', '1 coat', '240–260 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Glitz', '2 coat', '140–160 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Aspira', '1 coat', '220–240 sq.ft per ltr', NULL, NULL),
('Interior Paint', 'Royale Aspira', '2 coat', '110–120 sq.ft per ltr', NULL, NULL);

-- Insert EXTERIOR PAINT data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Exterior Paint', 'Ace Emulsion', '1 coat', '100–120 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ace Emulsion', '2 coat', '50–60 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ace Advance', '1 coat', '100–120 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ace Advance', '2 coat', '50–60 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ace Shyne', '1 coat', '100–120 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ace Shyne', '2 coat', '50–60 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ace Shyne Advance', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ace Shyne Advance', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex Advance', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex Advance', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex Shyne', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex Shyne', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex Shyne Advance', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Apex Shyne Advance', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Stretch', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Stretch', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek (Base)', '1 coat', '55–60 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek (Base)', '2 coat', '25–35 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek (Top)', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek (Top)', '2 coat', '55–65 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek Durolife (Base)', '1 coat', '55–60 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek Durolife (Base)', '2 coat', '25–35 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek Durolife (Top)', '1 coat', '110–130 sq.ft per ltr', NULL, NULL),
('Exterior Paint', 'Ultima Protek Durolife (Top)', '2 coat', '55–65 sq.ft per ltr', NULL, NULL);

-- Insert WATERPROOFING data
INSERT INTO public.coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Waterproofing', 'SmartCare Damp Proof', '3 coats', '10–15 sq.ft per ltr', 'Horizontal', NULL),
('Waterproofing', 'SmartCare Damp Proof', '1 coat', '25 sq.ft per ltr', 'Vertical', 'Fresh'),
('Waterproofing', 'SmartCare Damp Proof', '1 coat', '30–35 sq.ft per ltr', 'Vertical', 'Re-paint'),
('Waterproofing', 'SmartCare Damp Proof Advance', '3 coats', '10–15 sq.ft per ltr', 'Horizontal', 'same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Advance', '1 coat', '25 sq.ft per ltr', 'Vertical', 'Fresh - same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Advance', '1 coat', '30–35 sq.ft per ltr', 'Vertical', 'Re-paint - same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Xtreme', '3 coats', '10–15 sq.ft per ltr', 'Horizontal', 'same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Xtreme', '1 coat', '25 sq.ft per ltr', 'Vertical', 'Fresh - same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Xtreme', '1 coat', '30–35 sq.ft per ltr', 'Vertical', 'Re-paint - same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Ultra', '3 coats', '10–15 sq.ft per ltr', 'Horizontal', 'same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Ultra', '1 coat', '25 sq.ft per ltr', 'Vertical', 'Fresh - same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Damp Proof Ultra', '1 coat', '30–35 sq.ft per ltr', 'Vertical', 'Re-paint - same coverage as SmartCare Damp Proof'),
('Waterproofing', 'SmartCare Hydrolac Xtreme', '1 coat', '40–45 sq.ft per ltr', NULL, NULL),
('Waterproofing', 'SmartCare Hydrolac Xtreme', '2 coat', '16–18 sq.ft per ltr', NULL, NULL),
('Waterproofing', 'SmartCare Damp Block 2K', '2 coat', '7.5–8 sq.ft per kg', NULL, NULL),
('Waterproofing', 'SmartCare Ultra Block 2K', '2 coat', '5.5–6.5 sq.ft per kg', NULL, NULL),
('Waterproofing', 'SmartCare Epoxy Tri Block', '2 coat', '28 sq.ft per kg', NULL, NULL);