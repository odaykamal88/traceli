"""Global Fund ground-truth files (pack global-fund 2026.2)."""
import datetime as dt
import fill
import shell
from gt_lib import AwardFile, H2

D = dt.date


def gf01():
    f = AwardFile('gf-01-mwi-sr-selection.pdf', 'global-fund',
                  'Sub-recipient selection file: community case management, Mbalame and Chitsanzo districts',
                  'Chikondi Health Partnership (PR) \u00b7 Grant MWI-C-CHP-2026 (synthetic) \u00b7 SR selection file', 101)
    pr, sr = 'Chikondi Health Partnership', 'Mbalame Community Health Network'
    ppl = fill.people(f.rng, 14)
    shell.cover(f, 'CHIKONDI HEALTH PARTNERSHIP \u00b7 PROGRAMME MANAGEMENT UNIT \u00b7 LILONGWE, MALAWI',
                'Sub-recipient selection file', 'Community case management of malaria, pneumonia and diarrhoea: Mbalame and Chitsanzo districts', [
                    ('Grant', 'MWI-C-CHP-2026 (malaria component), implementation period 1 July 2026 to 30 June 2029'),
                    ('Principal Recipient', pr + ' (CHP)'),
                    ('File reference', 'CHP/SR/2026/01'),
                    ('Recommended sub-recipient', sr + ' (MCHN)'),
                    ('SR budget ceiling (as memo)', 'US$ 1,248,600 over three years'),
                    ('File owner', ppl[0] + ', SR Management Officer'),
                    ('Status of file', 'For management clearance'),
                ], 'Executive Director, CHP', ppl[0] + ', SR Management Officer', '6 April 2026',
                'Recommendation to engage MCHN as sub-recipient for community case management', [
                    'This memorandum presents the outcome of the selection process for the sub-recipient that will implement community case management (CCM) in Mbalame and Chitsanzo districts under the malaria component of the grant. The selection committee met on 17 and 18 March 2026 and scored seven applications.',
                    'The committee recommends ' + sr + ' as the highest-ranked applicant, with a proposed budget ceiling of US$ 1,248,600 over the three-year implementation period. The budget, the evaluation report and the integrity due diligence record are annexed.',
                    'Management is requested to clear the recommendation so that the sub-recipient agreement can be finalised and shared with the Local Fund Agent before the start of the implementation period.',
                ], cc='Finance Director; Head of Programmes; Compliance Officer')
    f.signatures([(ppl[0], 'SR Management Officer (prepared)', '6 April 2026'),
                  (ppl[1], 'Head of Programmes (reviewed)', '7 April 2026'),
                  (ppl[2], 'Executive Director (cleared)', '')])
    f.pagebreak()
    f.toc()

    f.h1('Background and scope')
    f.p('The malaria component of the grant finances community case management in two districts where facility coverage is lowest. Community health volunteers treat uncomplicated malaria, pneumonia and diarrhoea in children under five and refer severe cases. The sub-recipient will recruit, train, supply and supervise 640 volunteers across 38 health facility catchment areas.')
    f.p('This file documents the selection of the sub-recipient. It covers the call for expressions of interest, the evaluation, the integrity due diligence on the recommended organisation and the draft agreement. It does not cover procurement of health products, which is handled centrally by the PR through the pooled procurement mechanism.')
    shell.boiler(f, [fill.GF], 3)
    f.h2('Geographic scope')
    f.table([['District', 'Catchment areas', 'Volunteers', 'Children under five (est.)', 'Hard-to-reach villages'],
             ['Mbalame', '21', '352', '48,900', '64'], ['Chitsanzo', '17', '288', '39,300', '51'], ['Total', '38', '640', '88,200', '115']],
            [0.22, 0.18, 0.16, 0.26, 0.18])
    f.h2('Indicators')
    f.table(fill.indicators_rows(f.rng, [('Proportion of fever cases in children under five tested with RDT (%)', 'CCM registers'),
                                        ('Number of pneumonia cases treated by volunteers', 'HMIS community module'),
                                        ('Proportion of volunteers supervised quarterly (%)', 'Supervision checklists'),
                                        ('Proportion of villages reporting no stock-out of ACTs (%)', 'Monthly stock reports'),
                                        ('Number of severe cases referred and completed referral', 'Referral slips')]), [0.46, 0.13, 0.13, 0.28])

    f.h1('PR policy framework for sub-recipient management')
    f.p('The CHP grant management manual (version 4, approved by the board in November 2025) governs the selection, contracting and oversight of sub-recipients. The relevant provisions are summarised below for convenience; the manual prevails in case of any difference.')
    f.p('Section 5.2 of the manual provides that a capacity assessment of every proposed sub-recipient, covering governance, financial management, programme management and procurement, must be completed and filed before the sub-recipient agreement is signed. Section 5.3 provides that the results of the assessment determine the level of oversight and the frequency of disbursements.')
    f.p('Section 5.4 sets out that sub-recipients are selected through an open and transparent process unless the Country Team has agreed that a government entity or a named organisation implements a module. Selection committees consist of at least five members, including one member from outside the programme unit.')
    shell.boiler(f, [fill.GF, fill.COMMON], 4)

    f.h1('Call for expressions of interest')
    f.ev('procurement.competitive_or_exempt', 'present', True,
         'Selection was competitive: an open call for expressions of interest was issued to civil society organisations registered in Malawi, and seven applications were received by the closing date.',
         note='Open call, seven applicants.')
    f.ev('procurement.solicitation_notified', 'present', 'Call published 12 January 2026 in two national newspapers and on the CHP website; closing 9 February 2026',
         'The call was published on 12 January 2026 in two national newspapers and on the CHP website, with a closing date of 9 February 2026.',
         note='Publication channels and dates of the solicitation notice.')
    f.p('An information session for applicants was held on 22 January 2026 at the CHP offices and by video link; 19 organisations attended. Questions received in writing were answered in a clarification note circulated to all registered applicants on 29 January 2026.')
    f.table([['#', 'Applicant (synthetic)', 'Registration', 'Districts proposed', 'Received'],
             ['1', sr, 'NGO Board No. 0412', 'Both', '8 Feb 2026'], ['2', 'Tiyamike Health Trust', 'NGO Board No. 0977', 'Chitsanzo', '9 Feb 2026'],
             ['3', 'Kasungwe Rural Development Agency', 'NGO Board No. 1203', 'Both', '9 Feb 2026'], ['4', 'Lusubilo Volunteers Forum', 'NGO Board No. 0655', 'Mbalame', '6 Feb 2026'],
             ['5', 'Mphatso Community Care', 'NGO Board No. 1341', 'Both', '9 Feb 2026'], ['6', 'Ubwino Health Link', 'NGO Board No. 0819', 'Both', '7 Feb 2026'],
             ['7', 'Chisomo Outreach Services', 'NGO Board No. 1150', 'Chitsanzo', '9 Feb 2026 (late, 16:40)']], [0.05, 0.37, 0.2, 0.18, 0.2])
    f.p('The late application (No. 7) was received forty minutes after the closing time and was returned unopened, as recorded in the opening minutes.')
    f.ev('procurement.competition_or_exemption_documented', 'present', 'Call CHP/SR/2026/01, applicant register, opening minutes and evaluation report (Annex C)',
         'The call text, the register of applications, the opening minutes and the full evaluation report are filed at Annex C of this file.',
         note='Competition record on file.')

    f.h1('Evaluation of applications')
    f.p('Applications were evaluated in two stages. The first stage checked administrative compliance: registration, audited accounts for the last two years, and a signed application form. Six applications passed. The second stage scored the technical and financial proposals against the published criteria.')
    rows = [['Criterion', 'Weight'] + ['A%d' % i for i in range(1, 7)]]
    crit = [('Relevant experience in CCM or iCCM', 25), ('Presence in the districts', 15), ('Technical approach and supervision model', 20),
            ('Financial management systems', 15), ('Staffing and key personnel', 10), ('Value for money of budget', 15)]
    totals = [0] * 6
    base = [0.92, 0.61, 0.78, 0.55, 0.70, 0.66]
    for c, w in crit:
        r = [c, str(w)]
        for i in range(6):
            sc = max(1, min(w, round(w * (base[i] + f.rng.uniform(-0.08, 0.06)))))
            totals[i] += sc
            r.append(str(sc))
        rows.append(r)
    rows.append(['Total', '100'] + [str(t) for t in totals])
    f.table(rows, [0.34, 0.08] + [0.097] * 6, zebra=True)
    f.p('A1 = %s. Scores are the consensus scores agreed at the committee meeting of 18 March 2026; individual score sheets are kept in the procurement registry.' % sr)
    f.ev('sr.selection_documented', 'present', 'Two-stage evaluation by five-member committee, 17-18 March 2026; consensus scores; MCHN ranked first',
         'The selection committee of five members evaluated the six compliant applications on 17 and 18 March 2026 and ranked MCHN first with a consensus score of %d out of 100.' % totals[0],
         note='Selection process (committee, dates, ranking) documented.')
    f.ev('documentation.award_rationale_on_file', 'present', 'Recommendation rationale: highest score, only applicant covering all 38 catchment areas with existing volunteer network',
         'The committee recommends MCHN because it obtained the highest score and is the only applicant with an existing volunteer network in all 38 catchment areas, which reduces start-up time by an estimated four months.',
         note='Award rationale stated in the evaluation report.')
    f.ev('eligibility.contractor_capable', 'present', True,
         'On the evidence of its last two audited statements and its current iCCM portfolio, the committee is satisfied that MCHN has the ability to implement the module at the proposed scale.',
         note='Affirmation of ability to perform.')
    f.h2('Committee composition and declarations')
    f.table([['Member', 'Function', 'Declaration signed'], [ppl[3], 'Head of Programmes (chair)', 'Yes, 17 March 2026'], [ppl[4], 'Malaria Programme Officer', 'Yes, 17 March 2026'],
             [ppl[5], 'Finance Manager', 'Yes, 17 March 2026'], [ppl[6], 'District Health Office representative (external)', 'No'], [ppl[7], 'M&E Specialist', 'Yes, 17 March 2026']], [0.3, 0.45, 0.25])
    f.ev('integrity.coi_disclosed', 'negative', False,
         'The external member from the District Health Office did not sign the conflict-of-interest declaration, and the file does not record why the declaration was not obtained.',
         stated=True, note='One of five committee members has no signed declaration; disclosure incomplete, so the control is adverse (negative false), in line with pack-align treatment of an explicit absence on a boolean control.')
    shell.boiler(f, [fill.COMMON], 2)

    f.h1('Budget and funding')
    f.p('The proposed budget was reviewed against the approved grant budget and the unit cost guidelines. The committee requested two adjustments: volunteer refresher training was reduced from three to two days, and the number of supervision motorcycles was reduced from 12 to 9. The adjusted budget is summarised below; detailed costing is at Annex E.')
    shell.budget(f, [('Volunteer initial training', 'volunteer', 38, 55, 600, 660), ('Refresher training (2 days)', 'volunteer', 20, 28, 600, 660),
                     ('Monthly volunteer incentive', 'vol-month', 8, 12, 2000, 2400), ('Supervision allowances', 'visit', 14, 22, 900, 1300),
                     ('Motorcycles for supervisors', 'unit', 3900, 4600, 9, 9), ('Motorcycle fuel and maintenance', 'month', 350, 520, 36, 36),
                     ('Drug boxes and job aids', 'set', 25, 40, 640, 660), ('Data tools and registers', 'set', 9, 15, 700, 760),
                     ('Programme coordinator (salary)', 'month', 1500, 1900, 36, 36), ('District officers (2)', 'month', 1600, 2300, 36, 36),
                     ('Finance officer', 'month', 900, 1200, 36, 36), ('Office running costs', 'month', 700, 1100, 36, 36),
                     ('Review meetings', 'meeting', 1400, 2200, 12, 12), ('Audit fees', 'year', 5000, 8000, 3, 3)])
    f.p('The totals above exclude indirect costs, which are capped at seven percent of direct costs under the grant confirmation.')

    f.h1('Integrity due diligence on the recommended sub-recipient')
    f.p('Integrity due diligence is performed on every proposed sub-recipient before signature, in line with the Restrictive Measures and due diligence requirements that apply to Global Fund grants. The record is summarised below; printouts are at Annex D.')
    f.kv([('Subject screened', f.evq('idd.subject', 'present', sr, sr + ' (MCHN), NGO Board registration No. 0412', note='Subject organisation.')),
          ('Subject type', f.evq('idd.subject_kind', 'present', 'organization', 'Organisation (registered non-governmental organisation)', note='Prose "Organisation" maps to token organization.')),
          ('Role in the grant', f.evq('idd.subject_role', 'present', 'sr', 'Proposed sub-recipient for the CCM module', note='Role token sr.')),
          ('Screen performed by', 'CHP Compliance Officer'),
          ('Record reference', f.evq('idd.evidence_ref', 'present', 'CHP-IDD-2026-014', 'Screening record CHP-IDD-2026-014 with list printouts', note='Evidence reference.'))])
    f.ev('idd.screen_modality', 'present', 'in_house',
         'The screen was run in-house by the CHP Compliance Officer using the compliance screening workbook maintained by the PR.',
         note='In-house modality.')
    f.ev('idd.screen_scope', 'present', 'un ofac us-state switzerland debarment ineligibility',
         'Lists covered: the UN Security Council consolidated list, the OFAC Specially Designated Nationals list, US State Department designations, the Swiss SECO sanctions list, and the World Bank and Global Fund debarment and ineligibility lists.',
         note='Full scope stated in prose. The pack rule is text_must_include over canonical tokens (un, ofac, us-state, switzerland, debarment, ineligibility); prose such as "UN Security Council" or "Swiss SECO" does not literally contain us-state/switzerland tokens, so a literal token matcher would fail although the scope is complete.')
    f.ev('idd.screen_date', 'present', '2026-03-24', 'The screen was completed on 24 March 2026 and reviewed by the Head of Programmes on 25 March 2026.', note='Screen date.')
    f.ev('idd.screen_result', 'present', 'clear', 'Result: no match was found on any of the lists screened, and the subject is recorded as clear.', note='Clear.')
    f.ev('idd.affiliated_persons', 'missing', None,
         'Board members and key staff of MCHN were not screened individually at this stage; the record covers the organisation only.',
         stated=True, note='Explicitly stated that affiliated/key persons were not screened.')
    f.ev('idd.disposition_decision', 'missing', None,
         'Because the result was clear, no disposition decision was taken or recorded.',
         stated=True, note='Conditional key (required only for non-clear results). Explicitly stated as not recorded; rule would not fire because result is clear.')
    f.silent('idd.list_vintage', 'No list version or download date is cited anywhere in the file.')
    f.silent('idd.screen_timing', 'Timing (before engagement / grant-cycle re-run) is not attested; only the screen date is given.')
    f.silent('idd.disposition_owner', 'Not stated; conditional on a non-clear result, which did not occur.')
    f.silent('idd.disposition_rationale', 'Not stated; conditional on a non-clear result.')
    f.silent('idd.gf_notification', 'No statement about communicating IDD results to the Global Fund.')
    f.silent('threshold.method_aligned', 'The file describes the open call but never ties the method to a value threshold.')
    f.silent('sr.capacity_assessed', 'Section 2 quotes manual section 5.2 requiring a capacity assessment before signature, but no assessment, date or rating for MCHN appears anywhere in the file.',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'sr.capacity_assessed', 'Manual section 5.2 (capacity assessment required before signature) is quoted in the policy section; no capacity assessment of MCHN is on file.')

    f.h1('Risk assessment')
    shell.risks(f, 9)
    shell.boiler(f, [fill.COMMON], 2)
    f.h1('Next steps')
    f.ev('sr.written_agreement_on_file', 'missing', None,
         'The sub-recipient agreement has not yet been signed; the unsigned draft at Annex F is submitted for clearance together with this memorandum.',
         stated=True, note='Only an unsigned draft exists; stated as not signed.')
    f.p('Subject to clearance, the draft will be shared with the Local Fund Agent and the Country Team for information, and the agreement will be signed before 30 June 2026 so that activities can start on 1 July 2026.')

    f.annex('A', 'Terms of reference for the CCM sub-recipient')
    f.p('The sub-recipient will implement the community case management module in the two districts in close cooperation with the District Health Management Teams. The main tasks are listed below.')
    f.table(fill.activities_rows(f.rng, ['Recruit and register volunteers with district councils', 'Initial five-day training of volunteers', 'Monthly resupply of drug boxes from health facilities',
                                          'Supportive supervision visits', 'Quarterly data review meetings', 'Refresher training', 'Community sensitisation on danger signs',
                                          'Referral follow-up for severe cases', 'Monthly reporting into the community HMIS module', 'Annual district review']), [0.05, 0.47, 0.06, 0.06, 0.06, 0.06, 0.24])
    shell.boiler(f, [fill.COMMON, fill.GF], 4)
    f.annex('B', 'Published call for expressions of interest (text)')
    f.p('CHIKONDI HEALTH PARTNERSHIP invites registered civil society organisations to express interest in implementing community case management of malaria, pneumonia and diarrhoea in Mbalame and Chitsanzo districts under a Global Fund grant for the period July 2026 to June 2029.')
    f.p('Eligible organisations must be registered with the NGO Board of Malawi, have audited accounts for 2023 and 2024, and have at least three years of experience in community health. Consortia are permitted if a lead organisation is named. Applications must reach the PR offices by 12:00 on 9 February 2026.')
    f.p('Evaluation criteria and weights: relevant experience 25; presence in the districts 15; technical approach 20; financial management systems 15; staffing 10; value for money 15. The PR reserves the right to verify any information provided.')
    shell.boiler(f, [fill.COMMON], 3)
    f.annex('C', 'Evaluation report and opening minutes (extract)')
    f.p('Opening of applications took place on 9 February 2026 at 14:00 in the presence of three committee members and two applicant representatives. Six applications were opened and recorded; one late application was returned unopened.')
    f.table([['Applicant', 'Admin. compliance', 'Audited accounts', 'Signed form', 'Proceeds to stage 2']] +
            [[x, 'Yes', 'Yes', 'Yes', 'Yes'] for x in ['A1', 'A2', 'A3', 'A5', 'A6']] + [['A4', 'Yes', '2024 only', 'Yes', 'Yes (accepted with note)']], [0.2, 0.2, 0.2, 0.2, 0.2])
    shell.boiler(f, [fill.COMMON], 3)
    f.annex('D', 'Integrity due diligence printouts (summary sheet)')
    f.table([['List', 'Search term', 'Hits', 'Reviewed by'], ['UN consolidated list', 'Mbalame Community Health', '0', 'Compliance Officer'],
             ['OFAC SDN', 'Mbalame Community Health', '0', 'Compliance Officer'], ['US State designations', 'Mbalame Community Health', '0', 'Compliance Officer'],
             ['SECO', 'Mbalame Community Health', '0', 'Compliance Officer'], ['World Bank debarred firms', 'Mbalame Community Health', '0', 'Compliance Officer'],
             ['Global Fund ineligibility', 'Mbalame Community Health', '0', 'Compliance Officer']], [0.3, 0.35, 0.1, 0.25])
    f.annex('E', 'Detailed budget and correction note')
    f.p('The detailed costing sheets submitted by MCHN were reconciled line by line with the adjusted summary in section 5. Minor rounding differences have been removed.')
    shell.budget(f, [('Year 1 training costs', 'lot', 40000, 60000, 1, 1), ('Year 2 training costs', 'lot', 20000, 30000, 1, 1), ('Year 3 training costs', 'lot', 18000, 26000, 1, 1),
                     ('Incentives year 1', 'lot', 80000, 95000, 1, 1), ('Incentives year 2', 'lot', 80000, 95000, 1, 1), ('Incentives year 3', 'lot', 80000, 95000, 1, 1),
                     ('Supervision (3 years)', 'lot', 140000, 170000, 1, 1), ('Human resources (3 years)', 'lot', 280000, 330000, 1, 1)])
    f.ev('award.contract_value_usd', 'present', 1284600,
         'Correction: the ceiling of US$ 1,248,600 shown in the cover memorandum is a transposition error, and the agreed SR budget ceiling is US$ 1,284,600.',
         note='Conflicting figures: cover memo says US$ 1,248,600; resolved late in Annex E to US$ 1,284,600.', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'award.contract_value_usd', 'Cover memo gives US$ 1,248,600; Annex E corrects it to US$ 1,284,600 (true value).')
    f.annex('F', 'Draft sub-recipient agreement (unsigned)')
    f.p('DRAFT FOR CLEARANCE \u2014 NOT SIGNED. Sub-recipient agreement between Chikondi Health Partnership and Mbalame Community Health Network for the implementation of community case management under grant MWI-C-CHP-2026.')
    shell.clauses(f, ['Purpose', 'Focal points', 'Notices', 'Force majeure', 'Termination', 'Settlement of disputes', 'Records', 'Intellectual property', 'Reporting', 'Assignment'])
    f.annex('G', 'Extract of the CHP grant management manual (general provisions)')
    shell.manual_extract(f, [fill.COMMON, fill.GF], 8, 2)
    f.annex('H', 'Training log of the recommended SR (2025)')
    shell.training_log(f, 26)
    f.annex('I', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 1, 5), 14)
    shell.acronyms(f, 'gf')
    return f


def gf02():
    f = AwardFile('gf-02-moz-lab-reagents-tender.pdf', 'global-fund',
                  'Procurement file: laboratory reagents and consumables for viral load testing, national open tender',
                  'Instituto Zambeze de Saude Comunitaria (PR) \u00b7 Grant MOZ-H-IZSC (synthetic) \u00b7 Tender PSM/2026/LAB-07', 202)
    ppl = fill.people(f.rng, 16)
    sup = 'Tavira Diagnostics Lda'
    shell.cover(f, 'INSTITUTO ZAMBEZE DE SAUDE COMUNITARIA \u00b7 PROCUREMENT AND SUPPLY MANAGEMENT UNIT \u00b7 MAPUTO, MOZAMBIQUE',
                'Procurement file \u2014 Tender PSM/2026/LAB-07', 'Supply of laboratory reagents and consumables for HIV viral load testing, 18 months', [
                    ('Grant', 'MOZ-H-IZSC (HIV component), synthetic reference'), ('Principal Recipient', 'Instituto Zambeze de Saude Comunitaria (IZSC)'),
                    ('Tender reference', 'PSM/2026/LAB-07'), ('Method', 'National open competitive tender (goods)'), ('Lots', 'Lot 1 reagents; Lot 2 consumables'),
                    ('Recommended bidder', sup + ' (both lots)'), ('Procurement officer', ppl[0]), ('File version', 'v3, for award approval')],
                'Director General, IZSC', ppl[0] + ', Procurement Officer', '12 May 2026', 'Award recommendation, tender PSM/2026/LAB-07', [
                    'The attached file records the procurement of reagents and consumables for viral load testing in the 22 laboratories of the national network for an 18-month period. Two lots were tendered. Nine bids were received for Lot 1 and seven for Lot 2.',
                    'The evaluation committee recommends award of both lots to ' + sup + ', the lowest evaluated substantially responsive bidder. The recommended contract amount, the evaluation summary and the integrity due diligence record on the supplier are set out in the file.',
                    'Your approval of the award is requested. Following approval, the notification of intention to award will be sent to all bidders and the standstill period will run for ten days before signature.'])
    f.signatures([(ppl[0], 'Procurement Officer', '12 May 2026'), (ppl[1], 'Head of PSM Unit', '12 May 2026'), (ppl[2], 'Director General (approval)', '')])
    f.pagebreak()
    f.toc()
    f.h1('Requirement and quantification')
    f.p('Quantities were derived from the national viral load scale-up plan, using test volumes for the last four quarters, the projected growth in patients on treatment and a buffer stock of three months. The quantification was validated by the national laboratory technical working group on 11 February 2026.')
    rows = [['Item', 'Unit', 'Lot', 'Quantity (18 months)', 'Delivery tranches']]
    items = ['Viral load reagent kit, 96 tests', 'Sample preparation reagent, 96 tests', 'Control kit (low/high positive)', 'Calibrator kit', 'Wash buffer 5 L',
             'Pipette tips 1000 ul, filtered', 'Pipette tips 200 ul, filtered', 'Sample tubes 2 ml', 'Nitrile gloves, medium', 'Plasma separation cards',
             'Waste bags, biohazard', 'Deep-well plates', 'Sealing film', 'Cryo labels', 'Absorbent bench paper']
    for i, it in enumerate(items):
        rows.append([it, 'kit' if i < 5 else 'box', '1' if i < 5 else '2', format(f.rng.randint(80, 4200) * (10 if i > 4 else 1), ','), f.rng.choice(['3', '4', '6'])])
    f.table(rows, [0.4, 0.1, 0.08, 0.22, 0.2], zebra=True)
    shell.boiler(f, [fill.GF], 3)
    f.h1('Procurement method and approvals')
    f.ev('procurement.competitive_or_exempt', 'present', True, 'The requirement was procured through national open competitive tendering, with both lots open to all eligible bidders.', note='Competitive.')
    f.ev('threshold.method_aligned', 'negative', False,
         'At an estimated value of US$ 2.41 million, the requirement exceeded the US$ 1,500,000 ceiling above which the IZSC procurement manual requires international competitive tendering, so the national method used was not the method required for this value.',
         note='Adverse fact: method below the one required by the threshold (negative false). Not phrased as a missing document.')
    f.p('The Head of PSM notes that the choice of national tendering was made to shorten lead times, and that five international manufacturers are represented by national distributors who were able to bid. No deviation from the manual was requested or approved in writing.')
    f.ev('procurement.solicitation_notified', 'present', 'Invitation published 2 March 2026 in Noticias and on the national procurement portal; bids due 1 April 2026',
         'The invitation to bid was published on 2 March 2026 in the daily newspaper Noticias and on the national public procurement portal, and bids were due on 1 April 2026 at 10:00.',
         note='Solicitation notice with channels and dates.')
    f.p('A pre-bid meeting was held on 13 March 2026 with 14 prospective bidders. Minutes, including the answers to 23 written questions, were published on the portal on 17 March 2026. No addendum affecting the technical specifications was issued.')
    f.ev('procurement.competition_or_exemption_documented', 'present', 'Tender dossier, bid opening record and evaluation report filed under PSM/2026/LAB-07',
         'The tender dossier, the bid opening record and the evaluation committee report are filed in this procurement file under reference PSM/2026/LAB-07.', note='Competition record.')
    f.h1('Evaluation policy extract')
    f.p('The procurement manual requires that each member of an evaluation committee signs a declaration of impartiality and absence of conflict of interest before receiving the bids, and that declarations are filed with the evaluation report. The manual also requires that the committee includes at least one technical specialist from outside the procurement unit.')
    f.p('Bids are evaluated in three steps: preliminary examination for completeness and eligibility; technical evaluation for substantial responsiveness to the specifications; and financial comparison of substantially responsive bids, after arithmetic correction. Award is made to the lowest evaluated substantially responsive bid subject to post-qualification.')
    shell.boiler(f, [fill.COMMON, fill.GF], 4)
    f.h1('Bid opening and evaluation')
    bidders = [sup, 'Limpopo Lab Supplies SA', 'Maputo Scientific Distribuidora', 'Indico Medical Trading', 'Savane BioSystems Lda', 'Quelimane Health Imports',
               'Rovuma Analytical', 'Chimoio Diagnostics Center', 'Nampula MedTech Lda']
    rows = [['Bidder (synthetic)', 'Lot 1 price (US$)', 'Lot 2 price (US$)', 'Bid security', 'Responsive']]
    prices = []
    for i, b in enumerate(bidders):
        p1 = 1_880_000 + f.rng.randint(-40_000, 390_000) if i else 1_902_318
        p2 = 415_000 + f.rng.randint(-10_000, 120_000) if i else 415_134
        prices.append((p1, p2))
        rows.append([b, format(p1, ','), format(p2, ',') if i < 7 else '-', 'Yes' if i != 5 else 'No', 'Yes' if i not in (1, 5, 8) else 'No'])
    f.table(rows, [0.34, 0.17, 0.17, 0.14, 0.18], zebra=True)
    f.p('Limpopo Lab Supplies SA offered a lower price for Lot 1 but was found non-responsive because its reagent kits were not registered with the national regulatory authority at bid closing. Quelimane Health Imports did not furnish the bid security. Nampula MedTech Lda offered a reagent kit with a shelf life below the required twelve months.')
    f.ev('eligibility.contractor_capable', 'present', True,
         'Post-qualification confirmed that Tavira Diagnostics Lda holds a valid distribution licence, has delivered comparable volumes to two national programmes in the last three years, and has a cold-chain warehouse in Beira.',
         note='Ability to perform affirmed through post-qualification.')
    f.ev('documentation.award_rationale_on_file', 'missing', None,
         'The award recommendation memorandum referred to in paragraph 7 of the evaluation report is not on file, and the report itself does not record why the two lower-priced Lot 1 bids were set aside beyond the table above.',
         stated=True, note='Explicit statement that the award rationale memo is not on file.')
    f.silent('integrity.coi_disclosed', 'The policy extract states that evaluators must sign declarations of impartiality and absence of conflict of interest, but no signed declarations or disclosure statement appear anywhere in the file.',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'integrity.coi_disclosed', 'Evaluation policy extract requires signed COI declarations; none are evidenced.')
    f.h1('Contract particulars')
    f.kv([('Supplier', sup), ('Lots', 'Lot 1 and Lot 2'),
          ('Contract amount', f.evq('award.contract_value_usd', 'present', 2317452.80, 'US$ 2,317,452.80 (Lot 1 US$ 1,902,318.40; Lot 2 US$ 415,134.40), DAP central medical store', note='Contract value in USD.')),
          ('Delivery', 'Six tranches over 18 months; first tranche within 45 days of signature'), ('Payment', '30 days after receipt and acceptance of each tranche'),
          ('Performance security', '5 percent of contract amount'), ('Incoterm', 'DAP Maputo central medical store')], 0.25)
    shell.boiler(f, [fill.COMMON], 3)
    f.h1('Integrity due diligence on the recommended supplier')
    f.p('Before award, the recommended supplier is subject to integrity due diligence covering the company, its shareholders and its managing director. The due diligence was outsourced for this tender because of the contract value.')
    f.kv([('Subject', f.evq('idd.subject', 'present', sup, sup + ', commercial registration 100874412, Beira', note='Subject.')),
          ('Subject type', f.evq('idd.subject_kind', 'present', 'organization', 'Company (legal entity)', note='Company = organization token.')),
          ('Relationship', f.evq('idd.subject_role', 'present', 'supplier', 'Supplier of goods under tender PSM/2026/LAB-07', note='supplier.')),
          ('Provider', f.evq('idd.screen_modality', 'present', 'gf_preapproved_vendor', 'External due diligence firm on the Global Fund list of pre-approved providers', note='GF pre-approved vendor modality.')),
          ('Report number', f.evq('idd.evidence_ref', 'present', 'NDC-2026-0917', 'Provider report NDC-2026-0917', note='Evidence reference.'))], 0.25)
    f.ev('idd.screen_scope', 'present', 'un ofac us-state switzerland debarment ineligibility', 'Scope codes attested by the provider: un, ofac, us-state, switzerland, debarment, ineligibility.',
         note='Scope given with the canonical tokens.')
    f.ev('idd.list_vintage', 'present', 'Lists as downloaded 28 April 2026 (provider dataset release 2026-04-27)',
         'The provider states that the lists were downloaded on 28 April 2026 from its dataset release of 27 April 2026.', note='List vintage.')
    f.ev('idd.screen_result', 'present', 'potential_match',
         'The provider reported one potential match: a shareholder of the supplier shares a full name with an individual on the OFAC list.', note='Non-clear result.')
    f.ev('idd.disposition_decision', 'present', 'select',
         'Decision: select \u2014 the potential match was discounted after the shareholder provided a passport copy showing a different date of birth and nationality.',
         note='Decision token select.')
    f.ev('idd.disposition_rationale', 'present', 'Different date of birth and nationality from the listed individual (passport copy)',
         'The rationale recorded is that the listed individual was born in 1961 and holds a different nationality, whereas the shareholder was born in 1984.', note='Rationale.')
    f.ev('idd.gf_notification', 'missing', None, 'The potential match and its disposition have not been communicated to the Global Fund Country Team.', stated=True,
         note='Explicitly not communicated. Rule gf_idd_hit_communicable would fire (result is non-clear).')
    f.silent('idd.disposition_owner', 'No named owner or function is recorded for the disposition of the potential match, although the result is non-clear.')
    f.silent('idd.affiliated_persons', 'The introduction mentions shareholders and the managing director as in scope, but no list of affiliated persons with roles is given.')
    f.silent('idd.screen_timing', 'No attestation that the screen was run before engagement or as a grant-cycle re-run.')
    f.silent('idd.screen_date', 'Only the template placeholder in Annex D carries a date (example date in the blank form). The completed screen date is never given.',
             trap='template-placeholder-date')
    f.trap('template-placeholder-date', 'idd.screen_date', 'Annex D blank IDD request form shows "Date of screening: DD/MM/YYYY (e.g. 15/01/2025)"; this is not a screen date.')
    for k in ['sr.capacity_assessed', 'sr.written_agreement_on_file']:
        f.silent(k, 'Not applicable to a goods procurement and not mentioned; genuinely absent.')
    f.ev('sr.selection_documented', 'missing', None, 'No sub-recipient is involved in this procurement; the PR procures and distributes the goods directly.', stated=True,
         note='Stated not applicable / absent.')
    f.h1('Risk register')
    shell.risks(f, 10)
    shell.boiler(f, [fill.COMMON, fill.GF], 3)
    f.annex('A', 'Technical specifications (summary)')
    rows = [['Item', 'Key specification', 'Shelf life at delivery', 'Storage']]
    for it in items:
        rows.append([it, f.rng.choice(['CE-IVD or WHO PQ listed', 'Compatible with installed platforms', 'Sterile, RNase/DNase free', 'ISO 13485 manufacturer']),
                     f.rng.choice(['12 months', '18 months', '24 months']), f.rng.choice(['2-8 C', '15-25 C', 'Ambient'])])
    f.table(rows, [0.34, 0.36, 0.15, 0.15], zebra=True)
    shell.boiler(f, [fill.COMMON], 3)
    f.annex('B', 'Bid opening record')
    f.p('Bids were opened in public on 1 April 2026 at 10:30 at the IZSC conference room. The following persons were present: three members of the tender committee, the internal auditor as observer, and representatives of seven bidders who signed the attendance sheet.')
    f.table([['#', 'Bidder', 'Envelopes', 'Bid security', 'Read-out price Lot 1', 'Read-out price Lot 2']] +
            [[str(i + 1), b, '2', 'Yes' if i != 5 else 'No', format(prices[i][0], ','), format(prices[i][1], ',') if i < 7 else '-'] for i, b in enumerate(bidders)],
            [0.05, 0.33, 0.1, 0.12, 0.2, 0.2])
    f.annex('C', 'Evaluation committee report (extract)')
    f.p('1. The committee was appointed by decision of the Director General of 25 March 2026. 2. The committee met on 7, 8 and 14 April 2026. 3. Nine bids were received for Lot 1 and seven for Lot 2. 4. Preliminary examination eliminated one bid for lack of bid security.')
    f.p('5. Technical evaluation found two further bids non-responsive. 6. Arithmetic errors were corrected in two bids, without change in ranking. 7. The committee recommends award as set out in the award recommendation memorandum.')
    shell.boiler(f, [fill.COMMON, fill.GF], 4)
    f.annex('D', 'Blank integrity due diligence request form (template)')
    f.p('This template is completed by the procurement unit and sent to the due diligence provider. The blank version is kept in the file for reference.')
    f.kv([('Name of entity or individual', '............................................'), ('Registration or ID number', '............................................'),
          ('Date of screening', 'DD/MM/YYYY (e.g. 15/01/2025)'), ('Lists to be covered', 'tick all that apply'), ('Requested by', '............................................'),
          ('Signature', '............................................')], 0.35)
    f.annex('E', 'Draft contract (general conditions extract)')
    shell.clauses(f, ['Definitions', 'Focal points', 'Notices', 'Force majeure', 'Termination', 'Settlement of disputes', 'Records', 'Assignment'])
    f.annex('F', 'Procurement manual extract (general provisions)')
    shell.manual_extract(f, [fill.COMMON, fill.GF], 10, 2)
    f.annex('G', 'Minutes of the pre-bid meeting (13 March 2026)')
    shell.minutes(f, '13 March 2026', ppl[3:9], fill.pick(f.rng, shell.GENERIC_ITEMS, 5) + ['Bidders asked whether partial deliveries were acceptable; the committee confirmed that deliveries follow the tranche schedule in the specifications.'])
    f.annex('H', 'Distribution plan by laboratory')
    f.table([['Laboratory (synthetic)', 'Province', 'Monthly tests', 'Tranche share']] + [['Lab %02d %s' % (i + 1, f.rng.choice(['Central', 'Provincial', 'District', 'Rural'])), f.rng.choice(['Sofala', 'Nampula', 'Zambezia', 'Tete', 'Manica', 'Gaza', 'Inhambane', 'Maputo']), format(f.rng.randint(300, 6000), ','), '%d%%' % f.rng.randint(2, 9)] for i in range(22)], [0.4, 0.25, 0.2, 0.15], zebra=True)
    f.annex('I', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 2, 2), 14)
    shell.acronyms(f, 'gf')
    return f


def gf03():
    f = AwardFile('gf-03-cmr-single-source-fleet.pdf', 'global-fund',
                  'Direct contracting file: fleet repair and maintenance for TB programme vehicles',
                  'Fondation Mbam-et-Kim pour la Sante (PR) \u00b7 Grant CMR-T-FMKS (synthetic) \u00b7 Direct contract DC-2026-003', 303)
    ppl = fill.people(f.rng, 16)
    sup = 'Nkolbo Motors SARL'
    shell.cover(f, 'FONDATION MBAM-ET-KIM POUR LA SANTE \u00b7 LOGISTICS AND PROCUREMENT \u00b7 YAOUNDE, CAMEROON',
                'Direct contracting file \u2014 DC-2026-003', 'Repair and 12-month maintenance of 14 TB programme vehicles (single supplier)', [
                    ('Grant', 'CMR-T-FMKS (tuberculosis), synthetic reference'), ('Principal Recipient', 'Fondation Mbam-et-Kim pour la Sante (FMKS)'),
                    ('Contract reference', 'DC-2026-003'), ('Supplier', sup + ', Obala road workshop'), ('Method used', 'Direct contracting (single source)'),
                    ('Justification cited', 'Urgency: sputum transport interrupted in 5 districts'), ('Attachment 4 (cover list)', 'Global Fund non-objection to single-source request')],
                'Executive Secretary, FMKS', ppl[0] + ', Logistics Coordinator', '9 February 2026', 'Direct contract for urgent fleet repair and maintenance', [
                    'Fourteen of the twenty-two vehicles used for sputum sample transport and supervision are off the road. Sample referral from five districts to the regional laboratories has been interrupted since mid-January, and turnaround times for GeneXpert results have doubled.',
                    'Given the urgency, the logistics unit approached ' + sup + ', which serviced part of the fleet under a previous contract, and requests approval of a direct contract for repairs and 12 months of preventive maintenance. The attachments listed on the cover are referred to in this memorandum.',
                    'COI declarations of the three officers involved are pending at the date of this memorandum.'])
    f.signatures([(ppl[0], 'Logistics Coordinator', '9 February 2026'), (ppl[1], 'Finance and Administration Manager', '9 February 2026'), (ppl[2], 'Executive Secretary', '10 February 2026')])
    f.pagebreak()
    f.toc()
    f.h1('Situation and need')
    f.p('The TB programme relies on a fleet of 22 double-cabin vehicles and 40 motorcycles for sample transport, supervision and contact tracing. A fleet assessment conducted on 20 January 2026 found fourteen vehicles immobilised, mainly because of worn suspension components, clutch failures and overdue servicing.')
    f.table([['Plate (synthetic)', 'Model year', 'Odometer (km)', 'Main defect', 'Days off road']] +
            [['CE-%03d-FM' % (100 + i), str(f.rng.choice([2017, 2018, 2019, 2020])), format(f.rng.randint(160000, 310000), ','),
              f.rng.choice(['Suspension', 'Clutch', 'Brakes', 'Gearbox', 'Electrical', 'Overdue service']), str(f.rng.randint(12, 60))] for i in range(14)], [0.2, 0.15, 0.2, 0.25, 0.2], zebra=True)
    shell.boiler(f, [fill.GF], 3)
    f.h1('Procurement route')
    f.p('The PR procurement manual allows direct contracting in cases of demonstrable urgency, provided that the circumstances were not foreseeable and that the Global Fund has issued a non-objection where the value is above the threshold set in the grant confirmation.')
    f.ev('procurement.competitive_or_exempt', 'negative', False,
         'No exemption from competitive procurement was approved for this contract; the direct award was processed on the basis of the urgency described in the memorandum alone.', stated=True,
         note='Neither competitive nor an established exemption; stated. Negative false.')
    f.ev('procurement.solicitation_notified', 'missing', None, 'No solicitation notice was issued, as only one workshop was approached.', stated=True, note='Explicitly none.')
    f.ev('threshold.method_aligned', 'negative', False,
         'At the contract value the direct contracting route falls outside the single-source ceiling of US$ 100,000 that applies without a prior Global Fund non-objection.',
         note='Adverse fact: method misaligned with threshold.')
    f.ev('documentation.award_rationale_on_file', 'present', 'Justification memo of 5 February 2026: urgency, prior servicing history, workshop capacity',
         'The justification memorandum dated 5 February 2026 records the reasons for choosing Nkolbo Motors SARL: urgency, its servicing history on nine of the fourteen vehicles, and the availability of parts in stock.',
         note='Award rationale on file.')
    shell.boiler(f, [fill.COMMON, fill.GF], 3)
    f.h1('Supplier assessment')
    f.ev('eligibility.contractor_capable', 'present', True,
         'A site visit on 3 February 2026 confirmed that the workshop has four service bays, diagnostic equipment for the vehicle model, and six certified mechanics, and is able to complete the repairs within 30 days.',
         note='Capability affirmed by site visit.')
    f.table([['Criterion', 'Observation', 'Assessment'], ['Legal registration', 'Trade register RC/YAO/2014/B/2231', 'Satisfactory'], ['Tax clearance', 'Certificate valid to 30 June 2026', 'Satisfactory'],
             ['Workshop capacity', '4 bays, lift, diagnostic tools', 'Satisfactory'], ['Parts availability', 'Stock list reviewed', 'Satisfactory'], ['Past performance', 'Previous contract 2023-2024', 'Satisfactory']], [0.3, 0.45, 0.25])
    f.h1('Price and contract particulars')
    total = shell.budget(f, [('Suspension overhaul', 'vehicle', 700000, 1100000, 6, 6), ('Clutch replacement', 'vehicle', 450000, 650000, 4, 4),
                             ('Brake system', 'vehicle', 250000, 400000, 5, 5), ('Gearbox repair', 'vehicle', 1200000, 1600000, 2, 2),
                             ('Electrical diagnostics and repair', 'vehicle', 150000, 300000, 3, 3), ('Preventive maintenance (12 months)', 'vehicle-service', 180000, 260000, 88, 88),
                             ('Towing and recovery', 'trip', 60000, 110000, 9, 9)], cur='XAF')
    f.ev('award.contract_value_usd', 'present', 309800,
         'The contract amount is XAF 186,450,000, equivalent to US$ 309,800 at the UN operational rate of exchange of February 2026.', note='Contract value in USD stated with XAF amount.')
    f.p('The price was compared informally with the rates of two other workshops obtained by telephone. The logistics unit considers the rates reasonable. No written quotations were obtained.')
    f.h1('Conflict of interest')
    f.p('The officers involved in the direct contracting decision are the Logistics Coordinator, the Fleet Supervisor and the Finance and Administration Manager.')
    f.ev('integrity.coi_disclosed', 'present', True,
         'Update of 20 February 2026: the three officers have now signed conflict-of-interest declarations, and none reported any interest in Nkolbo Motors SARL.',
         note='Cover memo says declarations pending; resolved later by the 20 February update.', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'integrity.coi_disclosed', 'Cover memo: "COI declarations ... are pending"; section 6 update of 20 February 2026 records them signed (true = present).')
    f.h1('Integrity due diligence')
    f.p('Integrity due diligence on the supplier and its owner was requested from the PR legal counsel after the contract was signed on 10 February 2026, because the urgency procedure did not leave time before signature.')
    f.kv([('Subject', f.evq('idd.subject', 'present', sup, sup + ' and its sole owner-manager', note='Subject (company).')),
          ('Type', f.evq('idd.subject_kind', 'present', 'organization', 'Organisation (limited liability company)', note='organization.')),
          ('Role', f.evq('idd.subject_role', 'present', 'supplier', 'Supplier (works and services)', note='supplier.')),
          ('Performed by', f.evq('idd.screen_modality', 'present', 'other', 'External law firm instructed by PR legal counsel; not a Global Fund pre-approved provider', note='Modality other.')),
          ('Reference', f.evq('idd.evidence_ref', 'present', 'LEG/2026/031', 'Legal memorandum LEG/2026/031', note='Evidence reference.'))], 0.22)
    f.ev('idd.affiliated_persons', 'present', 'Owner-manager (sole shareholder) and workshop manager',
         'Persons screened with the company: the owner-manager, who is the sole shareholder, and the workshop manager.', note='Affiliated persons with roles.')
    f.ev('idd.screen_scope', 'present', 'UN consolidated list; OFAC SDN; World Bank debarment',
         'The law firm screened the names against the UN consolidated list, the OFAC SDN list and the World Bank list of debarred firms.',
         note='Scope present but incomplete: US State, Switzerland and ineligibility not covered, so the text_must_include rule fails even though the field is present.')
    f.ev('idd.screen_date', 'present', '2026-02-11', 'The screening was carried out on 11 February 2026.', note='Screen date (after signature).')
    f.ev('idd.screen_timing', 'negative', 'after_engagement', 'The screen was therefore performed one day after the contract had been signed, not before engagement.',
         note='Adverse fact: screen after engagement. Neither allowed token (before_engagement / grant_cycle_rerun) applies; negative with value after_engagement.')
    f.ev('idd.screen_result', 'present', 'potential_match', 'Result: one potential match on the UN consolidated list for the name of the owner-manager.', note='Non-clear.')
    f.ev('idd.disposition_owner', 'present', 'Director of Programmes, FMKS', 'The Director of Programmes was designated to handle the potential match.', note='Owner named.')
    f.ev('idd.disposition_rationale', 'missing', None, 'No rationale for continuing with the contract despite the potential match is recorded in the file.', stated=True, note='Stated absent.')
    f.ev('idd.gf_notification', 'present', 'Country Team informed by email 19 February 2026 (ref. FMKS/CT/2026/012)',
         'The Global Fund Country Team was informed of the potential match by email on 19 February 2026, reference FMKS/CT/2026/012.', note='Communicated to GF.')
    f.silent('idd.disposition_decision', 'No select/continue/terminate decision is recorded for the potential match, although an owner is named.')
    f.silent('idd.list_vintage', 'No list version or date is cited.')
    for k in ['sr.selection_documented', 'sr.capacity_assessed', 'sr.written_agreement_on_file']:
        f.silent(k, 'Not applicable to a works/services contract and not mentioned.')
    f.h1('Attachments')
    f.table([['No.', 'Attachment', 'Status in this file copy'], ['1', 'Fleet assessment report, 20 January 2026', 'Included (section 1 extract)'],
             ['2', 'Justification memorandum, 5 February 2026', 'Included (Annex A)'], ['3', 'Site visit report, 3 February 2026', 'Included (Annex B)'],
             ['4', 'Global Fund non-objection to single-source request', 'Not included'], ['5', 'Signed contract DC-2026-003', 'Included (Annex C)']], [0.08, 0.57, 0.35])
    f.ev('procurement.competition_or_exemption_documented', 'missing', None,
         'Attachment 4, the Global Fund non-objection listed on the cover, is not included in this file copy and no other exemption document is on file.', stated=True,
         note='Cover lists the non-objection as Attachment 4, but it is not attached; stated absent.', trap='mentioned-not-attached')
    f.trap('mentioned-not-attached', 'procurement.competition_or_exemption_documented', 'Cover table lists "Attachment 4: Global Fund non-objection"; the attachment list says not included.')
    shell.boiler(f, [fill.COMMON], 2)
    f.annex('A', 'Justification memorandum (5 February 2026)')
    f.p('The Logistics Coordinator requests authorisation to contract Nkolbo Motors SARL directly. The fleet interruption has already delayed sample referral for more than three weeks. A competitive process would require at least six weeks. The workshop has serviced nine of the vehicles and holds parts in stock.')
    shell.boiler(f, [fill.COMMON, fill.GF], 4)
    f.annex('B', 'Site visit report (3 February 2026)')
    f.p('The visit team comprised the Fleet Supervisor and a mechanic from the regional hospital. The team inspected the premises, the tools and the parts store, and interviewed the workshop manager.')
    shell.risks(f, 6)
    f.annex('C', 'Signed contract DC-2026-003 (general conditions)')
    f.p('Contract signed on 10 February 2026 between the Fondation Mbam-et-Kim pour la Sante and Nkolbo Motors SARL for the repair and maintenance of fourteen vehicles.')
    shell.clauses(f, ['Object', 'Focal points', 'Notices', 'Force majeure', 'Termination', 'Settlement of disputes', 'Records', 'Assignment', 'Reporting'])
    f.signatures([(ppl[2], 'Executive Secretary, FMKS', '10 February 2026'), (ppl[9], 'Managing Director, Nkolbo Motors SARL', '10 February 2026')])
    f.annex('D', 'Vehicle maintenance schedule')
    f.table([['Plate', 'Service interval (km)', 'Next service', 'Responsible driver']] +
            [['CE-%03d-FM' % (100 + i), '5,000', fill.dstr(D(2026, 3, 1) + dt.timedelta(days=7 * i)), ppl[(i % 6) + 3]] for i in range(22)], [0.2, 0.25, 0.25, 0.3], zebra=True)
    f.annex('E', 'Fleet policy extract')
    shell.manual_extract(f, [fill.COMMON], 6, 2)
    f.annex('F', 'Asset register (vehicles and equipment)')
    shell.asset_register(f, 34, ['Double-cabin pickup', 'Motorcycle 125cc', 'Sample cool box', 'GPS tracker', 'Spare tyre set', 'Workshop jack'])
    f.annex('G', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 1, 15), 12)
    shell.acronyms(f, 'gf')
    return f


def gf04():
    f = AwardFile('gf-04-npl-sr-continuation.pdf', 'global-fund',
                  'Sub-recipient continuation file with key-personnel restrictive measures re-run',
                  'Sagarmatha Public Health Consortium (PR) \u00b7 Grant NPL-T-SPHC (synthetic) \u00b7 SR continuation SC-2026-02', 404)
    ppl = fill.people(f.rng, 18)
    sr = 'Sunkoshi Health Collective'
    kp = ppl[5]
    shell.cover(f, 'SAGARMATHA PUBLIC HEALTH CONSORTIUM \u00b7 GRANT MANAGEMENT OFFICE \u00b7 KATHMANDU, NEPAL',
                'Sub-recipient continuation file', 'Continuation of Sunkoshi Health Collective as SR for TB active case finding, 2026-2027', [
                    ('Grant', 'NPL-T-SPHC (tuberculosis), synthetic reference'), ('Principal Recipient', 'Sagarmatha Public Health Consortium (SPHC)'),
                    ('Sub-recipient', sr + ' (SHC)'), ('File reference', 'SC-2026-02'), ('Type of action', 'Continuation and expanded scope (amendment No. 3)'),
                    ('New key personnel screened', kp + ', incoming SR Programme Director'), ('Prepared by', ppl[0] + ', SR Oversight Lead')],
                'Management Committee, SPHC', ppl[0] + ', SR Oversight Lead', '18 February 2026', 'Continuation of SHC and expansion to four additional municipalities', [
                    'SHC has implemented active TB case finding in six municipalities of Koshi Province since 2023. The PR proposes to continue the arrangement for the remaining grant period and to extend it to four additional municipalities, as agreed in the reprogramming approved by the Country Team.',
                    'This file records the basis for continuation, the latest performance review, the capacity position, and the restrictive measures screening of the incoming SR Programme Director.',
                    'The SR capacity assessment was last performed in 2023, when the overall rating was high risk.'])
    f.signatures([(ppl[0], 'SR Oversight Lead', '18 February 2026'), (ppl[1], 'Grant Manager', '18 February 2026'), (ppl[2], 'Chair, Management Committee', '')])
    f.pagebreak()
    f.toc()
    f.h1('Background')
    f.p('Active case finding is delivered through mobile chest X-ray camps, household contact screening and referral of presumptive cases to GeneXpert sites. SHC operates two mobile units and employs 46 community mobilisers. The expansion adds four municipalities with an estimated 38,000 additional household contacts to screen.')
    f.table([['Municipality (synthetic)', 'Status', 'Camps per year', 'Contacts to screen'], ['Tamorbesi', 'Existing', '12', '9,400'], ['Arunkhola', 'Existing', '10', '7,800'],
             ['Dudhbesi', 'Existing', '12', '8,100'], ['Likhughat', 'Existing', '8', '6,300'], ['Bhotekoshi-Tar', 'Existing', '8', '5,900'], ['Sunpur', 'Existing', '10', '7,200'],
             ['Chatarghat', 'New', '10', '10,500'], ['Indrabesi', 'New', '8', '9,100'], ['Rautahat-Khola', 'New', '8', '8,800'], ['Maipokhari', 'New', '8', '9,600']], [0.35, 0.2, 0.2, 0.25], zebra=True)
    shell.boiler(f, [fill.GF], 4)
    f.h1('Basis for continuation')
    f.ev('procurement.competitive_or_exempt', 'present', True,
         'Continuation of an existing sub-recipient whose original selection was competitive is an established exemption under section 6.4 of the SPHC grant management manual, and the PR relies on that exemption here.',
         note='Established exemption.')
    f.ev('sr.selection_documented', 'present', 'Original competitive selection 2023 (call SPHC/SR/2023/04); continuation decided by Management Committee 22 January 2026',
         'SHC was originally selected through the 2023 competitive call SPHC/SR/2023/04, and the Management Committee decided on 22 January 2026 to continue the arrangement.',
         note='Selection documented (original + continuation decision).')
    f.ev('procurement.competition_or_exemption_documented', 'present', 'Continuation approval memo CM/2026/07 with 2025 performance review',
         'The continuation approval memorandum CM/2026/07 and the 2025 performance review are attached at Annex A.', note='Exemption documentation on file.')
    f.ev('procurement.solicitation_notified', 'missing', None, 'No new call for proposals was issued for the continuation or for the four additional municipalities.', stated=True,
         note='Explicitly none (continuation).')
    f.ev('documentation.award_rationale_on_file', 'present', 'Performance review 2025: 91% of case-finding target, timely reporting, clean spot checks',
         'The rationale for continuation is SHC performance in 2025: 91 percent of the case-finding target reached, all quarterly reports on time, and no material findings in two financial spot checks.',
         note='Rationale.')
    f.h2('Performance review summary')
    f.table(fill.indicators_rows(f.rng, [('Presumptive TB cases referred', 'Referral registers'), ('Proportion of referred cases tested on GeneXpert (%)', 'Lab registers'),
                                        ('Bacteriologically confirmed cases notified', 'NTP e-TB register'), ('Proportion of contacts screened (%)', 'Contact cards'),
                                        ('Proportion of reports submitted on time (%)', 'PR tracker')]), [0.46, 0.13, 0.13, 0.28])
    f.ev('eligibility.contractor_capable', 'negative', False,
         'The performance review concludes that SHC is not able to deliver the expanded scope in the four additional municipalities with its current staffing, and that a third mobile unit and 20 more mobilisers would be needed first.',
         note='Adverse finding on ability to perform the expanded scope (negative false).')
    shell.boiler(f, [fill.COMMON], 3)
    f.h1('Capacity position')
    f.p('The 2023 assessment covered governance, finance, procurement, M&E and programme management. It rated SHC high risk mainly because of weak segregation of duties in finance and an outdated procurement manual.')
    f.p('Since then SHC has recruited a second finance officer, adopted a new procurement manual and introduced monthly bank reconciliations reviewed by its treasurer.')
    shell.boiler(f, [fill.COMMON, fill.GF], 3)
    f.h1('Conflict of interest')
    f.ev('integrity.coi_disclosed', 'present', True,
         'All members of the Management Committee who took part in the continuation decision signed the annual conflict-of-interest disclosure for 2026, and one member abstained because she sits on the SHC board.',
         note='Disclosure made; abstention recorded.')
    f.h1('Restrictive measures screening of key personnel')
    f.p('Key personnel of sub-recipients are screened when they join and again in each grant cycle. This section covers the incoming SR Programme Director, who will be the SR signatory for programme reports.')
    f.kv([('Subject', f.evq('idd.subject', 'present', kp, '%s, incoming SR Programme Director of SHC' % kp, note='Subject is an individual (key personnel).')),
          ('Subject category', f.evq('idd.subject_kind', 'present', 'individual', 'Individual', note='individual.')),
          ('Role', f.evq('idd.subject_role', 'present', 'key_personnel', 'Key personnel of the sub-recipient', note='key_personnel.')),
          ('Screen date', f.evq('idd.screen_date', 'present', '2026-02-09', 'Screen completed on 9 February 2026', note='Screen date as table cell.'))], 0.25)
    f.ev('idd.screen_timing', 'present', 'grant_cycle_rerun',
         'This screen forms part of the annual grant-cycle re-run of restrictive measures screening for SR key personnel, and it is also the first screen of this individual.',
         note='Timing token grant_cycle_rerun.')
    f.ev('idd.screen_scope', 'present', 'un ofac us-state switzerland debarment ineligibility',
         'The screen covered United Nations sanctions, OFAC, the US State Department, Switzerland, and debarment and ineligibility lists.',
         note='Full scope in prose; literal tokens un/us-state absent (prose "United Nations", "US State Department"), so a literal token matcher would fail.')
    f.ev('idd.screen_result', 'present', 'clear', 'Outcome of the screen: clear, with no name matches on any list.', note='Clear.')
    f.ev('idd.affiliated_persons', 'missing', None, 'No affiliated persons were recorded for this individual screen.', stated=True, note='Stated absent.')
    f.ev('idd.disposition_decision', 'missing', None, 'A disposition decision is not applicable because no match was found.', stated=True, note='Conditional key; stated not applicable.')
    f.p('Evidence of every restrictive measures screen must be retained on the file and referenced by its screening record number, in line with the PR compliance procedure.')
    f.silent('idd.evidence_ref', 'The compliance procedure requiring a screening record number is quoted, but no record number or printout reference is given.',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'idd.evidence_ref', 'Section 7 states evidence "must be retained ... and referenced by its screening record number"; no reference is given.')
    for k, n in [('idd.list_vintage', 'No list vintage cited.'), ('idd.screen_modality', 'Who ran the screen (in-house/vendor) is not stated.'),
                 ('idd.disposition_owner', 'Not stated; result clear.'), ('idd.disposition_rationale', 'Not stated; result clear.'),
                 ('idd.gf_notification', 'No statement on communication of results to the Global Fund.'), ('threshold.method_aligned', 'No threshold analysis anywhere.')]:
        f.silent(k, n)
    f.h1('Budget for the continuation period')
    shell.budget(f, [('Mobile X-ray camp operations', 'camp', 2200, 3100, 70, 90), ('Community mobiliser stipends', 'person-month', 120, 160, 900, 1100),
                     ('Sample transport', 'month', 800, 1200, 18, 18), ('GeneXpert cartridge courier', 'month', 300, 500, 18, 18),
                     ('Supervision and review', 'visit', 150, 260, 60, 80), ('Programme staff', 'month', 5200, 6800, 18, 18), ('Office and utilities', 'month', 700, 1000, 18, 18)])
    f.ev('award.contract_value_usd', 'missing', None,
         'The amended SR budget ceiling will be confirmed after the PR budget review in March and is not stated in this file; the table above is an indicative costing only.', stated=True,
         note='Indicative costing table exists but the contract value is explicitly not stated.')
    f.h1('Agreement status')
    f.ev('sr.written_agreement_on_file', 'present', 'SR agreement SPHC/SR/2023/04 and amendments 1-2 signed; amendment 3 draft',
         'The original SR agreement SPHC/SR/2023/04, signed on 14 June 2023, and its amendments No. 1 and No. 2 are on file at Annex C.', note='Written agreement on file.')
    f.p('Draft amendment No. 3, which extends the scope and the end date, will be signed once the budget ceiling is confirmed.')
    f.annex('A', 'Continuation approval memorandum CM/2026/07')
    f.p('The Management Committee met on 22 January 2026 with five of seven members present. It reviewed the 2025 performance review of SHC and agreed to continue the arrangement for the remaining grant period, subject to confirmation of the budget ceiling.')
    shell.boiler(f, [fill.COMMON, fill.GF], 4)
    f.annex('B', 'Capacity reassessment (summary)')
    f.table([['Area', '2023 rating', '2026 rating', 'Comment'], ['Governance', 'Medium', 'Low', 'Board meets quarterly'], ['Finance', 'High', 'Medium', 'Second finance officer'],
             ['Procurement', 'High', 'Medium', 'Manual adopted 2024'], ['M&E', 'Medium', 'Medium', 'DHIS2 reporting'], ['Programme', 'Low', 'Low', 'Stable team']], [0.22, 0.18, 0.18, 0.42])
    f.ev('sr.capacity_assessed', 'present', '2026-01-14 reassessment; overall rating moderate',
         'The reassessment dated 14 January 2026 supersedes the 2023 rating, and the current overall rating of SHC is moderate.',
         note='Cover memo cites 2023 high-risk rating; resolved late in Annex B by the 2026 reassessment (moderate).', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'sr.capacity_assessed', 'Cover memo: last assessment 2023, high risk; Annex B: 14 January 2026 reassessment supersedes it, rating moderate.')
    shell.boiler(f, [fill.COMMON], 2)
    f.annex('C', 'SR agreement SPHC/SR/2023/04 (general conditions extract)')
    shell.clauses(f, ['Purpose', 'Focal points', 'Notices', 'Force majeure', 'Termination', 'Settlement of disputes', 'Records', 'Intellectual property', 'Reporting', 'Assignment', 'Privileges'])
    f.signatures([(ppl[2], 'Chair, SPHC', '14 June 2023'), (ppl[10], 'Executive Director, SHC', '14 June 2023')])
    f.annex('D', 'Workplan for the continuation period')
    f.table(fill.activities_rows(f.rng, ['Mobile X-ray camps in existing municipalities', 'Mobile X-ray camps in new municipalities', 'Household contact screening',
                                          'Sample transport to GeneXpert sites', 'Linkage to treatment follow-up', 'Mobiliser refresher training', 'Quarterly review with municipalities',
                                          'Data quality audits', 'Community radio messages', 'Annual performance review']), [0.05, 0.47, 0.06, 0.06, 0.06, 0.06, 0.24])
    shell.risks(f, 8)
    f.annex('E', 'Grant management manual extract')
    shell.manual_extract(f, [fill.COMMON, fill.GF], 12, 2)
    f.annex('F', 'Minutes of the Management Committee (22 January 2026)')
    shell.minutes(f, '22 January 2026', ppl[11:16], fill.pick(f.rng, shell.GENERIC_ITEMS, 6))
    f.annex('G', 'SHC asset register')
    shell.asset_register(f, 40)
    f.annex('H', 'SHC training log')
    shell.training_log(f, 30)
    f.annex('I', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 1, 8), 15)
    shell.acronyms(f, 'gf')
    return f
