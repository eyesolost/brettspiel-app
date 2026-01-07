-- Migration: Categories Tabelle und Many-to-Many Beziehung
-- Erstellt: 2026-01-07
-- Zweck: Kategorien aus BGG in eigener Tabelle verwalten

-- 1. Categories Tabelle (Master-Tabelle für alle Kategorien)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  bgg_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Game_Categories Junction Tabelle (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.game_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(game_id, category_id)
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_game_categories_game_id ON public.game_categories(game_id);
CREATE INDEX IF NOT EXISTS idx_game_categories_category_id ON public.game_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Row Level Security (RLS) aktivieren
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (alle können lesen und schreiben für authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.game_categories
  FOR ALL USING (true) WITH CHECK (true);

-- Kommentare für Dokumentation
COMMENT ON TABLE public.categories IS 'Master-Tabelle für Spielkategorien (z.B. Strategy, Dice, Card Game)';
COMMENT ON TABLE public.game_categories IS 'Junction-Tabelle für Many-to-Many Beziehung zwischen games und categories';
COMMENT ON COLUMN public.categories.bgg_id IS 'BoardGameGeek Category ID (optional)';
