-- Update Ultima Protek Durolife primer name from (Top Coat) to (Base Coat)
UPDATE coverage_data 
SET product_name = 'Ultima Protek Durolife (Base Coat)' 
WHERE product_name = 'Ultima Protek Durolife (Top Coat)' AND category = 'Primer';