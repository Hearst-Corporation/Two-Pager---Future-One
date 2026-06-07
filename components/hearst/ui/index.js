// components/hearst/ui — primitives UI du cockpit Oracle.
// Tokens --cp-* uniquement, contrats JSDoc + PropTypes. NE PAS recoder en inline :
// importer ces primitives. Catalogue : ./README.md
//
//   import { Button, Card, Table, Row, Cell, Field, Badge, SectionHead, Eyebrow, KpiGrid }
//     from '@/components/hearst/ui';

export { default as Button } from './Button';
export { default as Card } from './Card';
export { Table, THead, Row, Cell } from './Table';
export { default as Field } from './Field';
export { default as Badge } from './Badge';
export { default as SectionHead } from './SectionHead';
export { default as Eyebrow } from './Eyebrow';
export { default as KpiGrid } from './KpiGrid';

// Primitives métier existantes (réexport pour un point d'entrée unique) :
export { default as KpiCard } from '../KpiCard';
