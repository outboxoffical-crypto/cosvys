-- Restore coverage_data table with all Asian Paints product data (corrected categories)

-- Putty Products (2 rows)
INSERT INTO coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Putty', 'Asian Trucare Wall Putty', '2 coats', '10-15 sq.ft per kg', NULL, 'Coverage may vary based on wall condition'),
('Putty', 'Asian Trucare Waterproof Wall Putty', '2 coats', '10-15 sq.ft per kg', NULL, 'Enhanced waterproofing properties');

-- Primer Products (5 rows)
INSERT INTO coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Primer', 'Interior Wall Primer', '1 coat', '15-175 sq.ft per ltr', NULL, 'Base coat for interior walls'),
('Primer', 'Exterior Wall Primer', '1 coat', '15-130 sq.ft per ltr', NULL, 'Weather-resistant exterior primer'),
('Primer', 'Asian Paints Damp Sheath - Interior', '1 coat', '190-225 sq.ft per ltr', NULL, 'Damp-proofing for interior surfaces'),
('Primer', 'Asian Paints Damp Sheath - Exterior (Smooth)', '1 coat', '190-225 sq.ft per ltr', 'Smooth Surface', 'For smooth exterior walls'),
('Primer', 'Asian Paints Damp Sheath - Exterior (Rough)', '1 coat', '100-120 sq.ft per ltr', 'Rough Surface', 'For textured/rough walls');

-- Interior Paint Products (26 rows)
INSERT INTO coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Interior Paint', 'Tractor Emulsion', '1 coat', '120-140 sq.ft per ltr', NULL, 'Economy range'),
('Interior Paint', 'Tractor Emulsion', '2 coats', '85-95 sq.ft per ltr', NULL, 'Economy range - 2 coats'),
('Interior Paint', 'Apcolite Premium Emulsion', '1 coat', '140-160 sq.ft per ltr', NULL, 'Premium washable finish'),
('Interior Paint', 'Apcolite Premium Emulsion', '2 coats', '100-110 sq.ft per ltr', NULL, 'Premium washable - 2 coats'),
('Interior Paint', 'Apcolite Advanced', '1 coat', '140-160 sq.ft per ltr', NULL, 'Advanced stain resistance'),
('Interior Paint', 'Apcolite Advanced', '2 coats', '100-110 sq.ft per ltr', NULL, 'Advanced stain resistance - 2 coats'),
('Interior Paint', 'Royale Shyne Luxury Emulsion', '1 coat', '140-160 sq.ft per ltr', NULL, 'Luxury pearl finish'),
('Interior Paint', 'Royale Shyne Luxury Emulsion', '2 coats', '100-110 sq.ft per ltr', NULL, 'Luxury pearl - 2 coats'),
('Interior Paint', 'Royale Glitz', '1 coat', '140-160 sq.ft per ltr', NULL, 'Metallic sheen finish'),
('Interior Paint', 'Royale Glitz', '2 coats', '100-110 sq.ft per ltr', NULL, 'Metallic sheen - 2 coats'),
('Interior Paint', 'Royale Matt', '1 coat', '140-160 sq.ft per ltr', NULL, 'Premium matt finish'),
('Interior Paint', 'Royale Matt', '2 coats', '100-110 sq.ft per ltr', NULL, 'Premium matt - 2 coats'),
('Interior Paint', 'Royale Atmos', '1 coat', '140-160 sq.ft per ltr', NULL, 'Air-purifying paint'),
('Interior Paint', 'Royale Atmos', '2 coats', '100-110 sq.ft per ltr', NULL, 'Air-purifying - 2 coats'),
('Interior Paint', 'Royale Health Shield', '1 coat', '240-270 sq.ft per ltr', NULL, 'Anti-bacterial properties'),
('Interior Paint', 'Royale Health Shield', '2 coats', '180-200 sq.ft per ltr', NULL, 'Anti-bacterial - 2 coats'),
('Interior Paint', 'Royale Health Shield Next', '1 coat', '240-270 sq.ft per ltr', NULL, 'Advanced health protection'),
('Interior Paint', 'Royale Health Shield Next', '2 coats', '180-200 sq.ft per ltr', NULL, 'Advanced health - 2 coats'),
('Interior Paint', 'Royale Luxury Emulsion', '1 coat', '140-160 sq.ft per ltr', NULL, 'Premium luxury range'),
('Interior Paint', 'Royale Luxury Emulsion', '2 coats', '100-110 sq.ft per ltr', NULL, 'Premium luxury - 2 coats'),
('Interior Paint', 'Royale Aspira', '1 coat', '140-160 sq.ft per ltr', NULL, 'Premium designer finish'),
('Interior Paint', 'Royale Aspira', '2 coats', '100-110 sq.ft per ltr', NULL, 'Premium designer - 2 coats'),
('Interior Paint', 'Royale Play', '1 coat', '140-160 sq.ft per ltr', NULL, 'Textured designer finishes'),
('Interior Paint', 'Royale Play', '2 coats', '100-110 sq.ft per ltr', NULL, 'Textured designer - 2 coats'),
('Interior Paint', 'Royale Shyne Deco Metallic', '1 coat', '140-160 sq.ft per ltr', NULL, 'Decorative metallic effect'),
('Interior Paint', 'Royale Shyne Deco Metallic', '2 coats', '100-110 sq.ft per ltr', NULL, 'Decorative metallic - 2 coats');

-- Exterior Paint Products (20 rows)
INSERT INTO coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Exterior Paint', 'Ace Exterior Emulsion', '1 coat', '45-65 sq.ft per ltr', NULL, 'Economy exterior range'),
('Exterior Paint', 'Ace Exterior Emulsion', '2 coats', '25-35 sq.ft per ltr', NULL, 'Economy exterior - 2 coats'),
('Exterior Paint', 'Apex Exterior Emulsion', '1 coat', '90-110 sq.ft per ltr', NULL, 'Standard weather protection'),
('Exterior Paint', 'Apex Exterior Emulsion', '2 coats', '65-75 sq.ft per ltr', NULL, 'Standard weather - 2 coats'),
('Exterior Paint', 'Apex Ultima', '1 coat', '105-125 sq.ft per ltr', NULL, 'Premium exterior durability'),
('Exterior Paint', 'Apex Ultima', '2 coats', '75-85 sq.ft per ltr', NULL, 'Premium exterior - 2 coats'),
('Exterior Paint', 'Apex Ultima Protek', '1 coat', '105-125 sq.ft per ltr', NULL, 'Advanced protection'),
('Exterior Paint', 'Apex Ultima Protek', '2 coats', '75-85 sq.ft per ltr', NULL, 'Advanced protection - 2 coats'),
('Exterior Paint', 'Apex Weatherproof', '1 coat', '90-110 sq.ft per ltr', NULL, 'All-weather resistant'),
('Exterior Paint', 'Apex Weatherproof', '2 coats', '65-75 sq.ft per ltr', NULL, 'All-weather - 2 coats'),
('Exterior Paint', 'Apex Ultima Plus', '1 coat', '105-125 sq.ft per ltr', NULL, 'Enhanced durability'),
('Exterior Paint', 'Apex Ultima Plus', '2 coats', '75-85 sq.ft per ltr', NULL, 'Enhanced durability - 2 coats'),
('Exterior Paint', 'Apex Dust Resistant', '1 coat', '90-110 sq.ft per ltr', NULL, 'Self-cleaning technology'),
('Exterior Paint', 'Apex Dust Resistant', '2 coats', '65-75 sq.ft per ltr', NULL, 'Self-cleaning - 2 coats'),
('Exterior Paint', 'Apex Concrete', '1 coat', '80-100 sq.ft per ltr', NULL, 'For concrete surfaces'),
('Exterior Paint', 'Apex Concrete', '2 coats', '55-65 sq.ft per ltr', NULL, 'Concrete surfaces - 2 coats'),
('Exterior Paint', 'Apex Weatherproof Plus', '1 coat', '105-130 sq.ft per ltr', NULL, 'Enhanced weather resistance'),
('Exterior Paint', 'Apex Weatherproof Plus', '2 coats', '75-90 sq.ft per ltr', NULL, 'Enhanced weather - 2 coats'),
('Exterior Paint', 'Apex Ultima Duralife', '1 coat', '105-125 sq.ft per ltr', NULL, 'Long-lasting exterior finish'),
('Exterior Paint', 'Apex Ultima Duralife', '2 coats', '75-85 sq.ft per ltr', NULL, 'Long-lasting - 2 coats');

-- Waterproofing Products (17 rows)
INSERT INTO coverage_data (category, product_name, coats, coverage_range, surface_type, notes) VALUES
('Waterproofing', 'SmartCare Damp Proof', '1 coat', '30-40 sq.ft per ltr', 'Wall', 'Interior/Exterior wall treatment'),
('Waterproofing', 'SmartCare Damp Proof', '2 coats', '15-20 sq.ft per ltr', 'Wall', 'Double coat for severe dampness'),
('Waterproofing', 'SmartCare Damp Proof', '1 coat', '20-25 sq.ft per ltr', 'Terrace', 'Terrace waterproofing'),
('Waterproofing', 'SmartCare Damp Proof', '2 coats', '10-12 sq.ft per ltr', 'Terrace', 'Double coat terrace protection'),
('Waterproofing', 'SmartCare Damp Proof', '1 coat', '25-30 sq.ft per ltr', 'Bathroom', 'Bathroom waterproofing'),
('Waterproofing', 'SmartCare Damp Proof', '2 coats', '12-15 sq.ft per ltr', 'Bathroom', 'Double coat bathroom'),
('Waterproofing', 'SmartCare Crack Seal', '1 coat', '25-35 sq.ft per kg', NULL, 'Crack filling compound'),
('Waterproofing', 'SmartCare Crack Seal', '2 coats', '12-18 sq.ft per kg', NULL, 'Deep crack repair'),
('Waterproofing', 'SmartCare Damp Shield', '1 coat', '35-45 sq.ft per ltr', NULL, 'Anti-dampness coating'),
('Waterproofing', 'SmartCare Damp Shield', '2 coats', '18-22 sq.ft per ltr', NULL, 'Enhanced damp protection'),
('Waterproofing', 'SmartCare Rainguard', '1 coat', '5.5-10 sq.ft per ltr', NULL, 'Exterior weather protection'),
('Waterproofing', 'SmartCare Rainguard', '2 coats', '3-5 sq.ft per ltr', NULL, 'Heavy weather protection'),
('Waterproofing', 'SmartCare Terrace Guard', '1 coat', '18-25 sq.ft per ltr', 'Terrace', 'Specialized terrace coating'),
('Waterproofing', 'SmartCare Terrace Guard', '2 coats', '9-12 sq.ft per ltr', 'Terrace', 'Premium terrace protection'),
('Waterproofing', 'SmartCare Sealer', '1 coat', '25-35 sq.ft per ltr', NULL, 'Surface sealing compound'),
('Waterproofing', 'SmartCare Waterproof Cement', '1 coat', '8-12 sq.ft per kg', NULL, 'Cement-based waterproofing'),
('Waterproofing', 'SmartCare Exterior Wall Primer', '1 coat', '100-120 sq.ft per ltr', NULL, 'Waterproof base coat');