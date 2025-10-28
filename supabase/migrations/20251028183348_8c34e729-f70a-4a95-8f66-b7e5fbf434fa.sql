-- Delete old Ultima Protek (Base) and (Top) entries
DELETE FROM coverage_data WHERE product_name IN ('Ultima Protek (Base)', 'Ultima Protek (Top)');

-- Delete old Ultima Protek Durolife (Base) and (Top) entries
DELETE FROM coverage_data WHERE product_name IN ('Ultima Protek Durolife (Base)', 'Ultima Protek Durolife (Top)');

-- Add merged Ultima Protek entry (1 coat)
INSERT INTO coverage_data (product_name, category, coats, coverage_range)
VALUES ('Ultima Protek', 'Exterior Paint', '1 coat', '55–60 sq.ft per ltr');

-- Add merged Ultima Protek entry (2 coats)
INSERT INTO coverage_data (product_name, category, coats, coverage_range)
VALUES ('Ultima Protek', 'Exterior Paint', '2 coat', '25–35 sq.ft per ltr');

-- Add merged Ultima Protek Durolife entry (1 coat)
INSERT INTO coverage_data (product_name, category, coats, coverage_range)
VALUES ('Ultima Protek Durolife', 'Exterior Paint', '1 coat', '55–60 sq.ft per ltr');

-- Add merged Ultima Protek Durolife entry (2 coats)
INSERT INTO coverage_data (product_name, category, coats, coverage_range)
VALUES ('Ultima Protek Durolife', 'Exterior Paint', '2 coat', '55–65 sq.ft per ltr');

-- Add new Primer entries for Exterior Paint
INSERT INTO coverage_data (product_name, category, coats, coverage_range)
VALUES ('Ultima Protek (Base Coat)', 'Primer', '1 coat', '55–60 sq.ft per ltr');

INSERT INTO coverage_data (product_name, category, coats, coverage_range)
VALUES ('Ultima Protek Durolife (Top Coat)', 'Primer', '1 coat', '55–60 sq.ft per ltr');