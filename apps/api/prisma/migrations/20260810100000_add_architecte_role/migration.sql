-- Étape 1/2 de la simplification des rôles (5 -> 3 valeurs).
-- Postgres interdit d'utiliser une valeur d'enum ajoutée par ADD VALUE dans
-- la même transaction : cette migration doit donc être validée seule avant
-- que la migration suivante ne l'utilise dans un UPDATE.
ALTER TYPE "RoleUtilisateur" ADD VALUE 'ARCHITECTE';
