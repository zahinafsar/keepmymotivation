-- Prompt is now the single source of truth; drop derived clarify/brief fields.
ALTER TABLE "schedules"
  DROP COLUMN "brief",
  DROP COLUMN "clarifyQA",
  DROP COLUMN "imageKeyword",
  DROP COLUMN "subjectHint",
  DROP COLUMN "searchQuery";
