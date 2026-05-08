-- =====================================================================
-- FUTUR ONE × MISA — ROADMAP SEED
-- Extracted from the strategic brief. Idempotent via on conflict.
-- =====================================================================

-- Clean prior roadmap data only (keep operators / events / etc.)
delete from crm.initiative_operators;
delete from crm.initiative_partners;
delete from crm.initiatives;
delete from crm.partners;
delete from crm.workstreams;

-- ---------------------------------------------------------------------
-- WORKSTREAMS — 7 streams, 2 buckets:
--   Bucket A · Key Takeaways  : Land & Power · Data Centres · Mining
--   Bucket B · Roadmap         : Financials · Contract · Technical · Commercial
-- ---------------------------------------------------------------------
insert into crm.workstreams (slug, code, label, tagline, accent, ordering) values
  ('land-power',    'WS1', 'Land & Power',          'Site identification, grid access, solar offset',     '#3b82f6', 1),
  ('data-centres',  'WS2', 'Data Centres',          'Meeza expansion + global developer engagement',      '#8b5cf6', 2),
  ('mining',        'WS3', 'Mining & Digital',      'Fintech / digital-asset regulatory pathway',         '#f59e0b', 3),
  ('financials',    'WS4', 'Financials',            'Funding strategy, financial model, revenue model',   '#10b981', 4),
  ('contract',      'WS5', 'Contract Structuring',  'JV setup, asset contributions',                      '#ef4444', 5),
  ('technical',     'WS6', 'Technical',             'Design, development, operations, hardware',          '#06b6d4', 6),
  ('commercial',    'WS7', 'Commercial',            'Innovation hub, events, marketing, monetisation',    '#ec4899', 7);

-- ---------------------------------------------------------------------
-- PARTNERS — institutional
-- ---------------------------------------------------------------------
insert into crm.partners (name, kind, country, one_liner, status, notes) values
  ('Meeza', 'institution', 'Qatar',
   'Qatari data centre operator — recent partnership with Microsoft on the QF/QSTP campus. Lead candidate for site partnership and DC expansion.',
   'identified',
   'Roadmap source : Land & Power + Data Centres workstreams.'),
  ('Qatar Foundation (QF)', 'foundation', 'Qatar',
   'Qatar''s flagship education and research foundation. Hosts the Qatar Science & Technology Park (QSTP).',
   'identified',
   'Roadmap source : Land & Power workstream + Commercial / Innovation Hub.'),
  ('Qatar Science & Technology Park (QSTP)', 'institution', 'Qatar',
   'Qatar''s premier innovation incubator. Adjacent to the Meeza / Microsoft consortium site.',
   'identified',
   'Roadmap source : Commercial / Innovation Hub.'),
  ('Qatar Free Zones Authority (QFZA)', 'authority', 'Qatar',
   'Regulator for free-zone activities including fintech and digital assets. Counterparty for the mining / digital-assets workstream.',
   'identified',
   'Roadmap source : Mining & Digital Assets workstream.'),
  ('Qatar National Grid', 'authority', 'Qatar',
   'National electricity grid operator. Counterparty for grid collection agreement and power purchase.',
   'identified',
   'Roadmap source : Land & Power + Contract.');

-- ---------------------------------------------------------------------
-- INITIATIVES — extracted from the brief (with codes, owners, status)
-- ---------------------------------------------------------------------
-- WS1 · Land & Power
insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'LP-1', 'Identify Doha-based plot of land for Futur One',
       'Identify a Doha-based plot of land where Futur One would sit and arrange a visit. Candidate area: the QF / QSTP / Meeza consortium site (recent Microsoft partnership).',
       'hearst', 'in_progress', 'critical', 1
from crm.workstreams where slug = 'land-power';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'LP-2', 'Arrange site visit to candidate plot',
       'Arrange an on-site visit to the QF / QSTP / Meeza consortium site to validate technical viability and explore co-development.',
       'hearst', 'planned', 'high', 2
from crm.workstreams where slug = 'land-power';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'LP-3', 'Confirm access to Qatar national grid',
       'Ensure that the site has access to the Qatar national grid system to power the data centre with electricity.',
       'hearst', 'planned', 'critical', 3
from crm.workstreams where slug = 'land-power';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'LP-4', 'Identify second plot for solar farm (optional)',
       'Optional — identify another plot of land to develop a captive solar farm in parallel with the data-centre build, offsetting electricity as a primary energy source.',
       'hearst', 'not_started', 'medium', 4
from crm.workstreams where slug = 'land-power';

-- WS2 · Data Centres
insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'DC-1', 'Engage Meeza for buy-in on expansion',
       'Engage with Meeza to obtain buy-in for further expansion, design and development of a larger data centre on the existing site, fulfilling Futur One''s mid- to long-term ambitions.',
       'hearst', 'planned', 'critical', 1
from crm.workstreams where slug = 'data-centres';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'DC-2', 'Initiate preliminary discussions with US data-centre developers',
       'Open preliminary discussions with US-headquartered hyperscale data-centre developers (e.g. Equinix, Digital Realty).',
       'hearst', 'planned', 'high', 2
from crm.workstreams where slug = 'data-centres';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'DC-3', 'Initiate preliminary discussions with UK developers',
       'Open preliminary discussions with UK-based hyperscale developers (e.g. Yondr) as an alternative or complement.',
       'hearst', 'planned', 'high', 3
from crm.workstreams where slug = 'data-centres';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'DC-4', 'Evaluate regional GCC developers (geopolitical hedge)',
       'Identify regional GCC data-centre developers as alternatives in case of immediate concerns over geopolitical tensions in the GCC.',
       'hearst', 'not_started', 'medium', 4
from crm.workstreams where slug = 'data-centres';

-- WS3 · Mining & Digital
insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'MD-1', 'Set up meeting with Qatar Free Zones Authority',
       'Set up a meeting (online or in person) with QFZA to discuss fintech-related regulations applicable to the entire mining, exchange and sale lifecycle of digital assets for the benefit of Qatar.',
       'hearst', 'planned', 'high', 1
from crm.workstreams where slug = 'mining';

-- WS4 · Financials
insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'FN-1', 'Define funding strategy (debt and equity)',
       'Outline a funding strategy combining debt and equity for Futur One.',
       'hearst', 'planned', 'critical', 1
from crm.workstreams where slug = 'financials';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'FN-2', 'Produce outline financial model',
       'Outline financial model to be produced by Hearst, indicating equity investment, projected return on investment, and tenor.',
       'hearst', 'planned', 'critical', 2
from crm.workstreams where slug = 'financials';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'FN-3', 'Analyse and present revenue model options',
       'Analyse and present revenue model options (e.g. hyperscale, co-location).',
       'hearst', 'planned', 'high', 3
from crm.workstreams where slug = 'financials';

-- WS5 · Contract Structuring
insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CT-1', 'Sign JV agreement (Hearst <> Investor)',
       'Enter into a new agreement to govern the relationship between Hearst and the investor in connection with the design, build and deployment of Futur One. Form: Joint Venture (JV).',
       'joint', 'planned', 'critical', 1
from crm.workstreams where slug = 'contract';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CT-2', 'JV asset: land lease or transfer of title',
       'Contribute the land lease or transfer of title for Futur One into the JV.',
       'jv', 'not_started', 'critical', 2
from crm.workstreams where slug = 'contract';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CT-3', 'JV asset: grid collection agreement',
       'Contribute the grid collection agreement with Qatar National Grid into the JV.',
       'jv', 'not_started', 'critical', 3
from crm.workstreams where slug = 'contract';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CT-4', 'JV asset: power purchase agreement',
       'Contribute the power purchase agreement into the JV.',
       'jv', 'not_started', 'critical', 4
from crm.workstreams where slug = 'contract';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CT-5', 'JV asset: captive renewable project (solar + batteries)',
       'Contribute the captive renewable project — solar + batteries — into the JV (to be confirmed).',
       'jv', 'not_started', 'medium', 5
from crm.workstreams where slug = 'contract';

-- WS6 · Technical
insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'TC-1', 'JV: engage lead design consultant',
       'JV to engage a lead design consultant to report on power procurement strategy, consents and approvals, and feasibility of design for the data centre.',
       'jv', 'planned', 'high', 1
from crm.workstreams where slug = 'technical';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'TC-2', 'Hearst: short-list data-centre developers + facilities mgmt',
       'Hearst to engage with data-centre developers and facilities-management operators and put forward a short list for the JV''s consideration. Initial market sounding of construction contractors.',
       'hearst', 'planned', 'high', 2
from crm.workstreams where slug = 'technical';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'TC-3', 'JV: sign data-centre development contract',
       'JV to enter into a data-centre development contract with the selected developer.',
       'jv', 'not_started', 'high', 3
from crm.workstreams where slug = 'technical';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'TC-4', 'JV: sign O&M contract (long-term facilities mgmt)',
       'JV to enter into an operation and long-term maintenance contract with the selected facilities-management operator.',
       'jv', 'not_started', 'high', 4
from crm.workstreams where slug = 'technical';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'TC-5', 'Hearst: engage hardware and AI-GPU providers',
       'Hearst to engage with hardware and equipment providers, including AI-powered GPU vendors.',
       'hearst', 'planned', 'medium', 5
from crm.workstreams where slug = 'technical';

-- WS7 · Commercial
insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CM-1', 'Hearst: expand existing innovation hub at QF / set up stand-alone hub',
       'Hearst to suggest options to further expand the existing innovation hub at Qatar Foundation, and/or set up a stand-alone innovation hub within Futur One. Select and put forward a group of start-ups / entrepreneurs.',
       'hearst', 'planned', 'medium', 1
from crm.workstreams where slug = 'commercial';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CM-2', 'JV: design hub incentive + IP-ownership scheme',
       'JV to consider the mid- to long-term plan to incentivise hub start-ups and entrepreneurs while keeping a solid stake in the IP created and developed during incubation.',
       'jv', 'not_started', 'medium', 2
from crm.workstreams where slug = 'commercial';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CM-3', 'Hearst: arrange entertainment / cultural / fashion / music partnerships',
       'Hearst to engage with players in the entertainment / fashion / cultural / music space to arrange one-off and recurring events and partnerships, attracting visits to Futur One and increasing visibility.',
       'hearst', 'planned', 'medium', 3
from crm.workstreams where slug = 'commercial';

insert into crm.initiatives (workstream_id, code, title, body, owner_entity, status, priority, ordering)
select id, 'CM-4', 'JV: marketing communications + data monetisation strategies',
       'JV to consider marketing communications and data-monetisation strategies applicable to members and visitors of the Futur One ecosystem.',
       'jv', 'not_started', 'medium', 4
from crm.workstreams where slug = 'commercial';

-- ---------------------------------------------------------------------
-- LINK initiatives to partners (so the partner page surfaces context)
-- ---------------------------------------------------------------------
insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id
from crm.initiatives i
join crm.partners p on p.name in ('Meeza', 'Qatar Foundation (QF)', 'Qatar Science & Technology Park (QSTP)')
where i.code = 'LP-1';

insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id from crm.initiatives i, crm.partners p
where i.code = 'LP-2' and p.name in ('Meeza', 'Qatar Foundation (QF)', 'Qatar Science & Technology Park (QSTP)');

insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id from crm.initiatives i, crm.partners p
where i.code = 'LP-3' and p.name = 'Qatar National Grid';

insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id from crm.initiatives i, crm.partners p
where i.code = 'DC-1' and p.name = 'Meeza';

insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id from crm.initiatives i, crm.partners p
where i.code = 'MD-1' and p.name = 'Qatar Free Zones Authority (QFZA)';

insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id from crm.initiatives i, crm.partners p
where i.code = 'CT-3' and p.name = 'Qatar National Grid';

insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id from crm.initiatives i, crm.partners p
where i.code = 'CT-4' and p.name = 'Qatar National Grid';

insert into crm.initiative_partners (initiative_id, partner_id)
select i.id, p.id from crm.initiatives i, crm.partners p
where i.code = 'CM-1' and p.name in ('Qatar Foundation (QF)', 'Qatar Science & Technology Park (QSTP)');
