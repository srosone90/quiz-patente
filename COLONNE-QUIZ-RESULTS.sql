-- Mostra SOLO i nomi delle colonne di quiz_results
SELECT 
    column_name as "Nome Colonna",
    data_type as "Tipo",
    is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_name = 'quiz_results'
AND table_schema = 'public'
ORDER BY ordinal_position;
