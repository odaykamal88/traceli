"""OCHA CBPF ground-truth files (pack ocha-cbpf 2026.1)."""
import datetime as dt
import fill
import shell
from gt_lib import AwardFile

D = dt.date


def o01():
    f = AwardFile('ocha-01-som-standard-allocation.pdf', 'ocha-cbpf',
                  'Standard allocation project file: emergency WASH in Lower Jubba riverine villages',
                  'Somalia Humanitarian Fund (synthetic) \u00b7 2026 First Standard Allocation \u00b7 SOM-26/HSF/SA1/WASH/NNGO/0213', 601)
    ppl = fill.people(f.rng, 16)
    p = 'Juba Riverine Relief Organisation'
    shell.cover(f, 'HUMANITARIAN FINANCING UNIT \u00b7 SOMALIA HUMANITARIAN FUND (SYNTHETIC) \u00b7 MOGADISHU',
                'Project file SOM-26/HSF/SA1/WASH/NNGO/0213', 'Emergency water, sanitation and hygiene for flood-affected riverine villages, Lower Jubba', [
                    ('Allocation', '2026 First Standard Allocation (SA1)'), ('Partner', p + ' (JRRO), national NGO'), ('Cluster', 'WASH'),
                    ('Requested amount', 'US$ 612,480'), ('Duration', '12 months'), ('Sub-implementing partner', 'Buulo-Qansax Community Water Committee (local CBO)'),
                    ('HFU focal point', ppl[0] + ', Humanitarian Affairs Officer (Grants)')],
                'Head of HFU', ppl[0] + ', Humanitarian Affairs Officer', '20 March 2026', 'Project SOM-26/HSF/SA1/WASH/NNGO/0213 for technical review', [
                    'This file brings together the documents for the JRRO WASH project recommended under the first standard allocation of 2026. It is prepared for the technical review stage and for the HC decision to follow.',
                    'The partner capacity assessment for JRRO was pending at the time the allocation was launched; its status is recorded in section 3.'])
    f.signatures([(ppl[0], 'Humanitarian Affairs Officer (Grants)', '20 March 2026'), (ppl[1], 'Finance Associate', '20 March 2026'), (ppl[2], 'Head of HFU', '')])
    f.pagebreak()
    f.toc()
    f.h1('Allocation framework')
    f.ev('allocation.modality', 'present', 'standard', 'This project is funded through a standard allocation, launched on 10 February 2026 with an envelope of US$ 18 million.', note='Modality standard.')
    f.ev('allocation.strategy_on_file', 'present', 'SA1 allocation strategy paper approved by the HC on 3 February 2026 (Annex A)',
         'The allocation strategy paper, approved by the Humanitarian Coordinator on 3 February 2026 after consultation with the Advisory Board, is at Annex A.', note='Strategy filed.')
    f.silent('allocation.preselection_justification', 'Not applicable to a standard allocation and not mentioned.')
    shell.boiler(f, [fill.OCHA], 4)
    f.h1('Partner eligibility')
    f.ev('partner.due_diligence_passed', 'present', True, 'JRRO passed the due diligence stage on 14 May 2025 and is registered as an eligible partner of the fund.', note='Due diligence passed.')
    f.p('Following due diligence, eligible partners undergo a capacity assessment which determines their risk level, the operational modalities that apply to them and the maximum amount they may receive.')
    f.ev('partner.annex7_declarations', 'present', 'accurate-info compliance coi designated-entity legal-process disability psea',
         'The signed Annex 7 declarations of JRRO cover accurate information, compliance with the guidelines, conflict of interest, designated entities, legal process, disability inclusion and PSEA.',
         note='All seven declarations in prose. The rule text_must_include expects canonical tokens (accurate-info, coi, designated-entity, legal-process, ...); prose would fail a literal token matcher.')
    f.h1('Capacity assessment')
    f.p('At the launch of the allocation, the capacity assessment of JRRO was recorded as pending in the partner register.')
    f.ev('partner.capacity_assessment', 'present', 'Capacity assessment completed 2 March 2026; risk level medium',
         'The capacity assessment was completed on 2 March 2026 and places JRRO at a medium risk level, with a funding ceiling of US$ 800,000 per project.',
         note='Cover memo says pending; section 3 records completion (present).', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'partner.capacity_assessment', 'Cover memo and section 3 opening: capacity assessment pending; next paragraph records completion 2 March 2026, medium risk.')
    f.h1('Strategic review and scoring')
    rows = [['Project (synthetic code)', 'Partner', 'Strategic (40)', 'Technical (40)', 'Cost (20)', 'Total', 'Rank']]
    projs = [('0213', 'JRRO'), ('0198', 'Gedo Water Alliance'), ('0224', 'Afmadow Relief Network'), ('0187', 'Coastal Aid Somalia'), ('0231', 'Jubba Valley Health and WASH'),
             ('0205', 'Kismaayo Youth Services'), ('0240', 'Riverine Women Action')]
    tots = []
    for i, (c, n) in enumerate(projs):
        a, b2, c2 = (33, 30, 15) if i == 0 else (f.rng.randint(18, 31), f.rng.randint(17, 30), f.rng.randint(9, 15))
        tots.append(a + b2 + c2)
    order = sorted(range(len(projs)), key=lambda i: -tots[i])
    for i, (c, n) in enumerate(projs):
        a = 33 if i == 0 else None
        rows.append(['SA1/WASH/' + c, n, '-', '-', '-', str(tots[i]), str(order.index(i) + 1)])
    f.table(rows, [0.2, 0.26, 0.11, 0.11, 0.1, 0.1, 0.12], zebra=True)
    f.ev('selection.scorecard_or_alternative', 'present', 'Scorecard total 78/100 for project 0213',
         'The WASH cluster review committee completed the standard scorecard for each proposal, and project 0213 scored 78 out of 100.', note='Scorecard.')
    f.ev('selection.committee_decision', 'present', 'Strategic review committee 12 March 2026 recommended 0213 for funding',
         'The strategic review committee met on 12 March 2026 and recommended project 0213 for funding at the requested amount.', note='Committee decision.')
    f.ev('selection.recommendation_differs', 'present', False,
         'The recommendation of the committee follows the scorecard ranking, and no project was recommended out of rank order.',
         note='Recommendation does not differ from scores. Key has no rule of its own; value false is a legitimate present value, not negative.')
    f.silent('selection.mismatch_note', 'Not applicable (no mismatch) and not mentioned.')
    f.ev('onegms.selection_record', 'missing', None, 'The selection decision of the review committee was not recorded in OneGMS before the project was recommended for funding.', stated=True,
         note='Stated not recorded.')
    f.ev('onegms.project_status', 'present', 'Under technical review', 'Status of the project in OneGMS on 20 March 2026: under technical review.', note='Project status.')
    shell.boiler(f, [fill.OCHA, fill.COMMON], 3)
    f.h1('Project design and budget')
    f.p('The project will rehabilitate 18 shallow wells, install 6 solar-powered water points, construct 240 emergency latrines, and distribute hygiene kits to 3,600 households in riverine villages affected by the 2025 Deyr floods. Water quality testing and chlorination will be carried out monthly.')
    f.p('JRRO will implement part of the water-point component through a local community-based organisation. Where implementation is through a sub-implementing partner, the fund requires the partner to describe how funds are passed through, how the sub-partner is monitored and how its expenditure is verified.')
    f.silent('grant.consortium_controls', 'A sub-implementing CBO is named and the fund requirement for pass-through controls is quoted, but no controls are described.',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'grant.consortium_controls', 'Section 5 quotes the fund requirement for sub-partner pass-through controls; none described.')
    shell.budget(f, [('Shallow well rehabilitation', 'well', 4200, 6200, 18, 18), ('Solar water points', 'unit', 18000, 24000, 6, 6), ('Emergency latrines', 'latrine', 280, 420, 240, 240),
                     ('Hygiene kits', 'kit', 22, 32, 3600, 3600), ('Water quality testing', 'month', 400, 700, 12, 12), ('Hygiene promoters', 'person-month', 180, 260, 120, 144),
                     ('Project staff', 'month', 3800, 5200, 12, 12), ('Monitoring and transport', 'month', 900, 1400, 12, 12)])
    f.ev('grant.budget_template', 'missing', None,
         'The budget above is in the partner\'s own format; the budget on the standard fund template has not yet been submitted and will be requested during technical review.', stated=True,
         note='Stated not on standard template.')
    f.h1('Accountability and misconduct provisions')
    f.ev('misconduct.annex9_notification', 'present', 'Partner must notify the HFU within 48 hours of becoming aware of suspected fraud (Annex 9)',
         'Under Annex 9 of the guidelines, JRRO must inform the HFU within 48 hours of becoming aware of any allegation or suspicion of fraud, corruption or diversion affecting the project.',
         note='Annex 9 path with 48-hour duty.')
    f.ev('misconduct.secretariat_sanctions_regime', 'present', 'none',
         'No Secretariat-wide partner-sanctions regime applies to the fund, and the file records it as none.', note='Recorded as none.')
    f.ev('misconduct.oios_notification_path', 'missing', None, 'The project file does not name the channel for reporting to OIOS.', stated=True, note='Stated absent.')
    f.silent('misconduct.annex8_path', 'No reference to Annex 8 or to suggested measures for non-compliance.')
    f.h1('Designated-entity screening')
    f.kv([('Subject', f.evq('idd.subject', 'present', p, p + ' (JRRO) and its board', note='Subject.')),
          ('Declaration type', f.evq('idd.screen_scope', 'present', 'designated-entity', 'designated-entity (Annex 7 declaration, section 4)', note='Canonical token.')),
          ('Outcome', f.evq('idd.screen_result', 'present', 'clear', 'Clear', note='clear.')),
          ('Screening reference', 'HFU-DD-______ dated __/__/2026')], 0.28)
    f.silent('idd.evidence_ref', 'The screening reference cell is an unfilled template placeholder ("HFU-DD-______ dated __/__/2026"); no reference exists.', trap='template-placeholder-date')
    f.trap('template-placeholder-date', 'idd.evidence_ref', 'Section 7 shows "HFU-DD-______ dated __/__/2026" (template placeholder with date mask); no evidence reference.')
    f.silent('idd.disposition_decision', 'Not stated; result clear.')
    f.h1('Grant agreement status')
    f.ev('grant.agreement_complete', 'missing', None, 'The grant agreement has not been issued; it will be generated in OneGMS once the technical review is cleared.', stated=True, note='Stated absent.')
    f.annex('A', 'Allocation strategy paper (extract)')
    f.p('The first standard allocation prioritises life-saving WASH, health and nutrition responses in districts classified in IPC Phase 4 and in areas affected by the 2025 Deyr floods. At least 30 percent of the envelope is reserved for national and local partners.')
    shell.boiler(f, [fill.OCHA], 4)
    f.annex('B', 'Project locations')
    f.table([['Village (synthetic)', 'District', 'Households', 'Planned intervention']] + [['%s %s' % (f.rng.choice(['Buulo', 'Tabta', 'Jilib-', 'Qansax', 'Dhobley', 'Warshiikh']), f.rng.choice(['Dheere', 'Yare', 'Weyn', 'Cusub', 'Hoose'])),
             f.rng.choice(['Jamaame', 'Kismaayo', 'Afmadow']), str(f.rng.randint(90, 420)), f.rng.choice(['Well rehabilitation', 'Solar water point', 'Latrines', 'Hygiene kits'])] for _ in range(24)], [0.3, 0.2, 0.15, 0.35], zebra=True)
    f.annex('C', 'Logical framework (summary)')
    f.table(fill.indicators_rows(f.rng, [('Number of people with access to safe water', 'Water point registers'), ('Number of emergency latrines constructed', 'Completion certificates'),
                                        ('Proportion of water samples with free residual chlorine (%)', 'Testing logs'), ('Number of households receiving hygiene kits', 'Distribution lists'),
                                        ('Proportion of complaints responded to within 7 days (%)', 'Feedback database')]), [0.46, 0.13, 0.13, 0.28])
    f.annex('D', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 2, 10), 12)
    shell.acronyms(f, 'ocha')
    return f


def o02():
    f = AwardFile('ocha-02-nga-reserve-allocation.pdf', 'ocha-cbpf',
                  'Reserve allocation file: emergency health response to riverine flooding, north-east (three invited partners)',
                  'Nigeria Humanitarian Fund (synthetic) \u00b7 2026 Reserve Allocation R2 \u00b7 NGA-26/HFU/R2/H', 602)
    ppl = fill.people(f.rng, 16)
    p = 'Northern Floodplain Health Response Initiative'
    shell.cover(f, 'HUMANITARIAN FINANCING UNIT \u00b7 NIGERIA HUMANITARIAN FUND (SYNTHETIC) \u00b7 MAIDUGURI SUB-OFFICE',
                'Reserve allocation file \u2014 R2 health', 'Emergency primary health care and cholera response after the August 2026 floods (three invited partners)', [
                    ('Allocation', 'Reserve allocation R2, launched 10 August 2026'), ('Envelope', 'US$ 3.5 million (health)'),
                    ('Partners invited', 'Sahel Care International; Lake Chad Medical Relief; ' + p + ' (NFHRI)'), ('This file covers', 'Project NGA-26/HFU/R2/H/NNGO/0417 (NFHRI)'),
                    ('Amount', 'US$ 1,050,000'), ('HFU focal point', ppl[0])],
                'Humanitarian Coordinator (through Head of HFU)', ppl[0] + ', Grants Management Officer', '30 August 2026', 'R2 reserve allocation: recommendation of NFHRI project 0417', [
                    'Flooding along the rivers of the north-east in the second week of August displaced an estimated 210,000 people. The HC approved a reserve allocation on 10 August 2026 and three health partners were invited to submit proposals.',
                    'This file documents the selection and contracting of the NFHRI project. Partners must report any suspected fraud to the HFU within 5 working days, as set out in section 6.'])
    f.signatures([(ppl[0], 'Grants Management Officer', '30 August 2026'), (ppl[1], 'Head of HFU', '30 August 2026'), (ppl[2], 'Humanitarian Coordinator', '')])
    f.pagebreak()
    f.toc()
    f.h1('Allocation basis')
    f.ev('allocation.modality', 'present', 'reserve', 'The funds are released under the reserve for emergencies, as a reserve allocation of US$ 3.5 million for health.', note='Modality reserve.')
    f.ev('allocation.strategy_on_file', 'present', 'Reserve allocation strategy note 8 August 2026 with pre-selection criteria',
         'The reserve allocation strategy note of 8 August 2026 sets the pre-selection criteria: operational presence in the affected local government areas, active health cluster membership, and pipeline stock of cholera supplies.',
         note='Strategy with pre-selection criteria.')
    shell.boiler(f, [fill.OCHA], 4)
    f.h1('Pre-selection of partners')
    f.p('Under the reserve modality, partners are invited directly by the HFU on the basis of the pre-selection criteria. The strategy note requires a short written justification for each invited partner.')
    f.table([['Invited partner', 'Justification recorded', 'Date'], ['Sahel Care International', 'Yes: presence in 4 of 5 LGAs, cholera treatment units', '9 August 2026'],
             ['Lake Chad Medical Relief', 'Yes: mobile clinics, pipeline stock', '9 August 2026'], [p, 'No', '-']], [0.34, 0.46, 0.2])
    f.ev('allocation.preselection_justification', 'missing', None,
         'No written justification is recorded for inviting the third partner, NFHRI, although justifications exist for the other two invited partners.', stated=True,
         note='Required when modality = reserve; missing for the subject partner (stated).')
    f.ev('selection.scorecard_or_alternative', 'missing', None, 'No scorecard or alternative selection document was completed; the three partners were invited and funded directly.', stated=True,
         note='Stated absent.')
    f.ev('selection.committee_decision', 'present', 'Review committee 22 August 2026 recommended funding of all three projects',
         'The review committee met on 22 August 2026 and recommended funding for all three projects, including project 0417 at US$ 1,050,000.', note='Committee decision.')
    f.silent('selection.recommendation_differs', 'No scoring exists, so no comparison between scores and recommendation is stated.')
    f.silent('selection.mismatch_note', 'Not mentioned.')
    f.silent('onegms.selection_record', 'The OneGMS selection record is not mentioned anywhere in the file.')
    f.h1('Partner status')
    f.ev('partner.due_diligence_passed', 'negative', False,
         'At the time of pre-selection NFHRI had not completed due diligence, and its registration in OneGMS was still pending review.', stated=True,
         note='Due diligence not passed at pre-selection (stated). Negative false.')
    f.ev('partner.capacity_assessment', 'missing', None, 'No capacity assessment is available for NFHRI, which is a new partner of the fund.', stated=True, note='Stated absent.')
    f.ev('partner.annex7_declarations', 'present', 'accurate-info compliance coi designated-entity legal-process disability psea',
         'Declarations attested on the Annex 7 form: accurate-info, compliance, coi, designated-entity, legal-process, disability, psea.', note='All canonical tokens given.')
    f.ev('onegms.project_status', 'present', 'Approved by HC; grant agreement signed', 'OneGMS project status as of 30 August 2026: approved by the HC, grant agreement signed, first instalment pending.',
         note='Project status.')
    shell.boiler(f, [fill.COMMON, fill.OCHA], 3)
    f.h1('Project and grant agreement')
    f.p('The project will operate 12 cholera treatment points and 6 mobile health teams in the flood-affected areas for six months, and will pre-position cholera kits in three LGA health stores.')
    shell.budget(f, [('Cholera treatment points', 'site-month', 2800, 3900, 72, 72), ('Mobile health teams', 'team-month', 5200, 7400, 36, 36), ('Cholera kits', 'kit', 1600, 2400, 60, 60),
                     ('Oral rehydration points', 'site-month', 300, 520, 90, 90), ('Health workers incentives', 'person-month', 150, 240, 480, 540), ('Risk communication', 'campaign', 2500, 4200, 6, 6),
                     ('Project staff', 'month', 9000, 12000, 6, 6), ('Transport and logistics', 'month', 6000, 9000, 6, 6)])
    f.ev('grant.budget_template', 'present', 'Budget on standard fund template (annex 2 of agreement)',
         'The budget attached to the agreement uses the standard fund budget template, with direct costs, support costs at 7 percent and a separate audit line.', note='Budget template.')
    f.ev('grant.agreement_complete', 'present', 'Grant agreement NGA-26/HFU/R2/H/NNGO/0417 signed 29 August 2026 with budget, workplan and logframe',
         'Grant agreement NGA-26/HFU/R2/H/NNGO/0417 was signed on 29 August 2026 with all its annexes attached, including the budget, the workplan and the logical framework.', note='Agreement complete.')
    f.silent('grant.consortium_controls', 'No consortium or sub-grant; not mentioned.')
    f.h1('Misconduct and reporting obligations')
    f.p('Partners must report suspected fraud to the HFU within 5 working days of becoming aware of it, and must cooperate with any investigation.')
    f.ev('misconduct.oios_notification_path', 'present', 'Allegations involving UN personnel reported to OIOS through the HFU',
         'Allegations involving UN personnel or UN-administered funds are reported by the HFU to OIOS, which decides whether to investigate.', note='OIOS pathway.')
    f.ev('misconduct.secretariat_sanctions_regime', 'present', 'none', 'Secretariat partner-sanctions regime: none.', note='Recorded as none.')
    f.silent('misconduct.annex8_path', 'Annex 8 non-compliance measures are not referenced.')
    f.h1('Designated-entity screening')
    f.ev('idd.subject', 'present', p, 'The designated-entity screening covers NFHRI as an organisation and the members of its board.', note='Subject.')
    f.ev('idd.screen_scope', 'present', 'designated-entity', 'Designated-entity check: attested in the Annex 7 declaration signed on 25 August 2026.', note='Scope.')
    f.ev('idd.screen_result', 'present', 'unresolved',
         'The screening of board members could not be completed because NFHRI has not provided its full board list, so the result is recorded as unresolved.', note='Non-clear: unresolved.')
    f.ev('idd.evidence_ref', 'present', 'HFU screening note HFU/NGA/DD/2026/118', 'The screening note is filed as HFU/NGA/DD/2026/118.', note='Evidence ref.')
    f.silent('idd.disposition_decision', 'Result is unresolved but no select/continue/terminate decision is recorded; the agreement was nevertheless signed.')
    f.annex('A', 'Reserve allocation strategy note (extract)')
    f.p('The reserve allocation responds to the floods of August 2026. Partners are pre-selected on the basis of operational presence, cluster membership and pipeline stock. Each invitation is justified in writing by the HFU and cleared by the Head of HFU.')
    shell.boiler(f, [fill.OCHA], 3)
    f.annex('B', 'Fraud reporting provisions (Annex 9 extract) and correction')
    f.p('Annex 9 of the guidelines sets out how suspected fraud, corruption and diversion are reported, the role of the HFU and the follow-up measures available to the HC.')
    f.ev('misconduct.annex9_notification', 'present', 'Annex 9: partner reports suspected fraud to the HFU within 48 hours',
         'Correction: the Annex 9 duty is to notify the HFU within 48 hours, and the five-working-day period quoted in the cover memorandum and in section 6 comes from a superseded template and is withdrawn.',
         note='Cover memo and section 6 say 5 working days; corrected late in Annex B to 48 hours.', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'misconduct.annex9_notification', 'Cover memo and section 6: 5 working days; Annex B corrects to the Annex 9 48-hour duty (true = present).')
    f.annex('C', 'Affected areas and targets')
    f.table([['LGA (synthetic)', 'Displaced (est.)', 'Treatment points', 'Mobile teams']] + [[n, format(f.rng.randint(12000, 60000), ','), str(f.rng.randint(1, 4)), str(f.rng.randint(0, 2))]
            for n in ['Ngala-Riverside', 'Dikwa East', 'Gubio Plains', 'Mafa North', 'Kukawa Shore']], [0.34, 0.24, 0.21, 0.21])
    shell.manual_extract(f, [fill.OCHA, fill.COMMON], 8, 2)
    f.annex('D', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 8, 5), 12)
    shell.acronyms(f, 'ocha')
    return f


def o03():
    f = AwardFile('ocha-03-afg-consortium-standard.pdf', 'ocha-cbpf',
                  'Standard allocation file: consortium project for winterisation and protection, north-eastern provinces',
                  'Afghanistan Humanitarian Fund (synthetic) \u00b7 2026 Second Standard Allocation \u00b7 AFG-26/AHF/SA2/SNFI-PRO/INGO/0588', 603)
    ppl = fill.people(f.rng, 18)
    p = 'Pamir Valley Rural Aid'
    m = "Kokcha Women's Association"
    shell.cover(f, 'HUMANITARIAN FINANCING UNIT \u00b7 AFGHANISTAN HUMANITARIAN FUND (SYNTHETIC) \u00b7 KABUL',
                'Project file AFG-26/AHF/SA2/SNFI-PRO/INGO/0588', 'Consortium project: winterisation assistance and protection services in three north-eastern districts', [
                    ('Allocation', '2026 Second Standard Allocation (SA2)'), ('Lead partner', p + ' (PVRA), international NGO'), ('Consortium member', m + ' (KWA), national NGO'),
                    ('Clusters', 'Shelter/NFI and Protection'), ('Amount', 'US$ 1,480,000'), ('Duration', '9 months'), ('OneGMS status (at file opening)', 'Draft')],
                'Humanitarian Coordinator', ppl[0] + ', Head of HFU', '20 May 2026', 'Recommendation of consortium project 0588 (PVRA/KWA)', [
                    'This file records the review and recommendation of the PVRA-led consortium project under the second standard allocation. The project ranked fifth in the shelter and protection window but is recommended for funding for the reasons set out in section 4.',
                    'At file opening the project status in OneGMS was Draft.'])
    f.signatures([(ppl[0], 'Head of HFU', '20 May 2026'), (ppl[1], 'Deputy Head of Office, OCHA', '20 May 2026'), (ppl[2], 'Humanitarian Coordinator', '')])
    f.pagebreak()
    f.toc()
    f.h1('Allocation framework')
    f.ev('allocation.modality', 'present', 'standard', 'Project 0588 was submitted under the second standard allocation of 2026, which opened on 6 April 2026.', note='standard.')
    f.p('Each allocation of the fund must be based on an allocation strategy approved by the Humanitarian Coordinator, setting out priorities, envelopes and eligibility, and the strategy must be kept on the allocation file.')
    f.silent('allocation.strategy_on_file', 'The requirement that each allocation be based on an HC-approved strategy kept on file is quoted, but no SA2 strategy document or approval is on file.',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'allocation.strategy_on_file', 'Section 1 quotes the requirement for an HC-approved allocation strategy on file; none is filed or referenced.')
    f.silent('allocation.preselection_justification', 'Standard allocation; not mentioned.')
    shell.boiler(f, [fill.OCHA], 4)
    f.h1('Partner eligibility')
    f.ev('partner.due_diligence_passed', 'present', True, 'PVRA is an eligible partner of the fund, having passed due diligence in 2023, and KWA passed due diligence on 19 January 2026.',
         note='Due diligence passed (lead and member).')
    f.ev('partner.annex7_declarations', 'present', 'accurate information; compliance; conflict of interest; designated entity; legal process (disability and PSEA declarations not signed)',
         'The Annex 7 form signed by PVRA covers accurate information, compliance, conflict of interest, designated entity and legal process, but the disability and PSEA declarations were left unsigned.',
         note='Present but incomplete: disability and psea missing, so the text_must_include rule fails.')
    f.h1('Review, scoring and recommendation')
    rows = [['Rank', 'Project', 'Lead partner', 'Score']]
    sc = [81, 77, 72, 69, 64, 61, 58, 55, 50]
    names = ['North Relief Coalition', 'Hindukush Shelter Alliance', 'Badakh Community Care', 'Takhar Rural Support', p, 'Kunduz Family Aid', 'Baghlan Winter Response', 'Faizabad Youth Org', 'Amu Protection Network']
    for i in range(9):
        rows.append([str(i + 1), 'SA2/%04d' % (560 + i * 7 if i != 4 else 588), names[i], str(sc[i])])
    f.table(rows, [0.1, 0.2, 0.5, 0.2], zebra=True)
    f.ev('selection.scorecard_or_alternative', 'present', 'Scorecard 64/100, rank 5 of 9', 'Project 0588 received a scorecard total of 64 out of 100, ranking fifth of the nine proposals in the window.', note='Scorecard.')
    f.ev('selection.committee_decision', 'present', 'Review committee 14 May 2026 recommended 0588 for funding',
         'The review committee meeting of 14 May 2026 recommended project 0588 for funding at US$ 1,480,000.', note='Committee decision.')
    f.ev('selection.recommendation_differs', 'present', True,
         'The committee recommended project 0588 although two higher-scoring proposals in the same window were not recommended.', note='Recommendation differs from scores (true).')
    f.ev('selection.mismatch_note', 'present', 'Disposition note: recommended for coverage of Warduj-Tar and Yamgan-Bala districts not covered by higher-ranked proposals',
         'Disposition note: project 0588 was preferred because it is the only proposal covering Warduj-Tar and Yamgan-Bala districts, which the two higher-ranked proposals do not reach.',
         note='Mismatch disposition note.')
    f.ev('onegms.selection_record', 'present', 'Selection record uploaded to OneGMS 16 May 2026, before recommendation to HC',
         'The selection record, including the scorecards and the disposition note, was uploaded to OneGMS on 16 May 2026 before the recommendation was sent to the HC.', note='OneGMS selection record.')
    shell.boiler(f, [fill.OCHA, fill.COMMON], 3)
    f.h1('Consortium arrangements')
    f.ev('grant.consortium_controls', 'present', 'Consortium agreement: PVRA passes funds quarterly on verified reports; quarterly spot checks of KWA; joint bank reconciliation',
         'Under the consortium agreement, PVRA transfers funds to KWA quarterly on the basis of verified financial reports, carries out a spot check of KWA each quarter, and reconciles the sub-grant account jointly with KWA.',
         note='Pass-through controls named.')
    shell.budget(f, [('Winter cash grants', 'household', 160, 220, 3200, 3200), ('Blankets and winter clothing', 'kit', 38, 55, 2400, 2400), ('Heating fuel', 'household', 60, 95, 2000, 2000),
                     ('Protection case management', 'case', 90, 150, 900, 900), ('Women protection workers (KWA)', 'person-month', 260, 380, 108, 108), ('Legal aid sessions', 'session', 140, 220, 90, 90),
                     ('Project staff (PVRA)', 'month', 9000, 12500, 9, 9), ('Sub-grant management (KWA)', 'month', 2500, 3600, 9, 9)])
    f.silent('grant.budget_template', 'The budget is shown but its template is not stated.')
    f.silent('grant.agreement_complete', 'Grant agreement completeness is not addressed.')
    f.silent('partner.capacity_assessment', 'No capacity assessment of PVRA or KWA is mentioned.')
    f.h1('Accountability and misconduct')
    f.ev('misconduct.annex8_path', 'missing', None, 'The Annex 8 measures for non-compliance are not referenced anywhere in the agreement file.', stated=True, note='Stated absent.')
    f.ev('misconduct.oios_notification_path', 'missing', None, 'No channel for notifying OIOS is specified in the consortium or grant documents.', stated=True, note='Stated absent.')
    f.silent('misconduct.annex9_notification', 'Not mentioned.')
    f.ev('misconduct.secretariat_sanctions_regime', 'negative', 'OCHA Secretariat partner sanctions list (checked, not listed)',
         'PVRA was checked against the OCHA Secretariat partner sanctions list on 3 May 2026 and is not listed.',
         note='Trap: the file asserts a Secretariat partner-sanctions list exists and was checked. The pack requires the regime to be recorded as none (OIOS 2025/098 para 37), so this is an adverse statement: negative.',
         trap='invented-regime')
    f.trap('invented-regime', 'misconduct.secretariat_sanctions_regime', 'File claims a check against an "OCHA Secretariat partner sanctions list"; pack expects none -> negative.')
    f.h1('Designated-entity screening')
    f.ev('idd.subject', 'present', p + ' and ' + m, 'The designated-entity screening covers both consortium members, PVRA as lead and KWA as member.', note='Subjects.')
    f.ev('idd.screen_scope', 'present', 'designated-entity', 'Scope of the check: designated-entity, per the Annex 7 declaration.', note='Canonical token.')
    f.ev('idd.screen_result', 'present', 'potential_match', 'One potential match was found for the name of a KWA board member.', note='Non-clear.')
    f.ev('idd.disposition_decision', 'present', 'continue',
         'Decision: continue with the selection process, since the board member was shown to be a different person by national identity card and father\'s name.', note='Decision continue.')
    f.ev('idd.evidence_ref', 'missing', None, 'The designated-entity screening record is not attached to the file.', stated=True, note='Stated absent.')
    f.annex('A', 'OneGMS status history')
    f.table([['Date', 'Status', 'Actor'], ['12 April 2026', 'Draft', 'Partner'], ['28 April 2026', 'Submitted', 'Partner'], ['5 May 2026', 'Strategic review', 'HFU'],
             ['14 May 2026', 'Recommended by review committee', 'HFU']], [0.3, 0.45, 0.25])
    f.ev('onegms.project_status', 'present', 'Pending HC approval (19 May 2026)', 'As of 19 May 2026 the OneGMS status of project 0588 is Pending HC approval.',
         note='Cover says Draft at file opening; resolved late in Annex A: Pending HC approval.', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'onegms.project_status', 'Cover table and memo: OneGMS status Draft; Annex A: as of 19 May 2026 Pending HC approval.')
    f.annex('B', 'Consortium agreement (extract)')
    shell.clauses(f, ['Purpose', 'Focal points', 'Notices', 'Force majeure', 'Termination', 'Settlement of disputes', 'Records', 'Reporting', 'Assignment'])
    f.signatures([(ppl[8], 'Country Director, PVRA', '30 April 2026'), (ppl[9], 'Director, KWA', '30 April 2026')])
    f.annex('C', 'Beneficiary targeting by district')
    f.table([['District (synthetic)', 'Households', 'Cash', 'NFI kits', 'Protection cases']] + [[n, str(f.rng.randint(400, 1400)), str(f.rng.randint(300, 1000)), str(f.rng.randint(200, 800)), str(f.rng.randint(80, 300))]
            for n in ['Warduj-Tar', 'Yamgan-Bala', 'Kishm-Payin', 'Argo-Sufla', 'Darayim-Khurd']], [0.3, 0.17, 0.17, 0.17, 0.19])
    shell.manual_extract(f, [fill.OCHA, fill.COMMON], 10, 2)
    f.annex('D', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 4, 2), 14)
    shell.acronyms(f, 'ocha')
    return f
