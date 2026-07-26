ALTER TABLE settings_documents
ADD COLUMN hospital_logo_media_id integer REFERENCES media_content(id) ON DELETE SET NULL;
