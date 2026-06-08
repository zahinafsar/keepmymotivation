-- Persist optional web-search query per schedule (set by clarify when the user asks to search).
ALTER TABLE "schedules" ADD COLUMN "searchQuery" TEXT;
