"""UNFPA ground-truth files (pack unfpa 2026.1)."""
import datetime as dt
import fill
import shell
from gt_lib import AwardFile

D = dt.date


def u01():
    f = AwardFile('unfpa-01-uga-ip-workplan.pdf', 'unfpa',
                  'Implementing partner selection and 2026 workplan file: maternal health and GBV response, Nyabuhoro and Kigando districts',
                  'UNFPA Uganda CO (synthetic) \u00b7 IP file UGA-IP-2026-07 \u00b7 Rwenzo Women\'s Health Initiative', 501)
    ppl = fill.people(f.rng, 16)
    ip = "Rwenzo Women's Health Initiative"
    shell.cover(f, 'UNITED NATIONS POPULATION FUND \u00b7 UGANDA COUNTRY OFFICE (SYNTHETIC) \u00b7 PROGRAMME AND OPERATIONS',
                'Implementing partner file UGA-IP-2026-07', 'Selection of ' + ip + ' (RWHI) and signature of the 2026 annual workplan', [
                    ('Country programme', '10th country programme (synthetic), output 2 and output 4'), ('Implementing partner', ip + ' (RWHI), national NGO'),
                    ('Workplan', 'WP-UGA-2026-RWHI-01, 1 April to 31 December 2026'), ('Cumulative workplan amount', 'US$ 1,120,400 (programme cycle to date, including this workplan)'),
                    ('Selection modality', 'Competitive call for expression of interest on UNPP'), ('Programme lead', ppl[0] + ', Programme Specialist (SRHR)'),
                    ('File status', 'Complete for signature, except items flagged in section 9')],
                'Representative', ppl[0] + ', Programme Specialist', '19 March 2026', 'IP selection and workplan signature: RWHI', [
                    'The country office launched a call for expression of interest for a national NGO to deliver integrated maternal health and GBV response services in Nyabuhoro and Kigando districts. Eleven concept notes were received; RWHI was ranked first by the review panel.',
                    'The HACT micro-assessment of RWHI rates the partner as significant risk, which will determine the assurance plan and the cash transfer modality.',
                    'This file assembles the selection record, the partner assessments, the restrictive measures screening and the draft workplan, and requests your signature of the workplan.'])
    f.signatures([(ppl[0], 'Programme Specialist (prepared)', '19 March 2026'), (ppl[1], 'Operations Manager (reviewed)', '20 March 2026'), (ppl[2], 'Representative', '')])
    f.pagebreak()
    f.toc()
    f.h1('Programme context')
    f.p('Maternal mortality in the two districts remains above the national average. Only 54 percent of births are attended by skilled personnel, and referral from the island sub-counties depends on a single motorised ambulance boat. Reported GBV cases increased by 30 percent in 2025, partly because of the new one-stop centre in Nyabuhoro town.')
    shell.boiler(f, [fill.UNFPA], 4)
    f.h2('Results framework')
    f.table(fill.indicators_rows(f.rng, [('Proportion of births attended by skilled personnel (%)', 'HMIS'), ('Number of GBV survivors receiving clinical management', 'GBVIMS aggregate'),
                                        ('Number of midwives trained in EmONC', 'Training reports'), ('Proportion of facilities without stock-out of maternal health medicines (%)', 'LMIS'),
                                        ('Number of adolescents reached with SRH information', 'Activity reports')]), [0.46, 0.13, 0.13, 0.28])
    f.h1('Partner selection')
    f.ev('ip.competitive_or_waiver', 'present', True,
         'RWHI was selected competitively through a call for expression of interest published on the UN Partner Portal on 12 January 2026 (reference CEFI/UGA/2026/003).', note='Competitive selection.')
    f.p('Concept notes were reviewed by a panel of three programme staff and one operations staff member. The panel applied the criteria published in the call: sector expertise (30), presence in the target area (20), approach and methodology (25), partnership and coordination (10) and cost-effectiveness (15).')
    rows = [['Applicant (synthetic)', 'Expertise', 'Presence', 'Approach', 'Coordination', 'Cost', 'Total']]
    names = [ip, 'Kigando Youth Health Forum', 'Lake Region Midwives Association', 'Hope Bridge Community Services', 'Nyabuhoro Development Trust', 'Mulago-Kasese Care Link',
             'Islands Health Outreach', 'Ekitibwa Women Network', 'Rukiga Family Alliance', 'Pearl Health Volunteers', 'Unity Care Uganda']
    for i, n in enumerate(names):
        sc = [min(w, max(3, round(w * ((0.9 if i == 0 else 0.55) + f.rng.uniform(-0.1, 0.12))))) for w in (30, 20, 25, 10, 15)]
        rows.append([n] + [str(x) for x in sc] + [str(sum(sc))])
    f.table(rows, [0.34, 0.11, 0.11, 0.11, 0.12, 0.1, 0.11], zebra=True)
    f.ev('ip.waiver_or_competition_documented', 'present', 'CFEI notice, panel scoring sheets and selection memo (Annex B)',
         'The call notice, the individual panel scoring sheets and the selection memorandum signed by the panel chair on 9 February 2026 are filed at Annex B.', note='Competition file on file.')
    f.ev('ip.threshold_approver', 'present', True,
         'Because the cumulative workplan amount for the programme cycle exceeds US$ 0.5 million, the engagement was submitted to the Regional Director, who approved it on 27 February 2026 (memorandum ESARO/RD/2026/044).',
         note='Approver matches the cumulative threshold (RD approval above US$0.5m).')
    shell.boiler(f, [fill.COMMON], 2)
    f.h1('Partner assessments')
    f.ev('ip.unpp_profile', 'present', 'UNPP partner ID UG-NGO-48213; profile complete; verified 30 January 2026',
         'The partner profile of RWHI on UNPP (partner ID UG-NGO-48213) is complete and was verified by the country office on 30 January 2026.', note='UNPP profile complete and validated.')
    f.p('The micro-assessment was carried out by an audit firm contracted under the inter-agency HACT arrangements. Field work took place between 23 February and 6 March 2026. The draft report was discussed with RWHI management on 10 March 2026.')
    f.ev('ip.psea_assessment', 'missing', None,
         'The PSEA capacity assessment of RWHI is scheduled for the second quarter and has not been completed at the date of this file.', stated=True, note='Stated not completed.')
    shell.boiler(f, [fill.UNFPA, fill.COMMON], 3)
    f.h1('Integrity checks')
    f.ev('integrity.coi_declared', 'negative', False,
         'The conflict-of-interest declaration of RWHI, which the partner was asked to sign with its concept note, was returned unsigned and has not been replaced.', stated=True,
         note='IP-side COI declaration missing (stated). Boolean control expected true -> negative false.')
    f.ev('integrity.related_party_checked', 'present', 'Related-party and beneficial-ownership check 10 March 2026: no shared addresses, bank accounts or board members',
         'A related-party and beneficial-ownership check completed on 10 March 2026 found no shared addresses, bank accounts, telephone numbers or board members between RWHI, UNFPA personnel and current UNFPA vendors.',
         note='Related-party / shared-contact / BO check.')
    f.h1('Restrictive measures screening')
    f.kv([('Entity screened', f.evq('idd.subject', 'present', ip, ip + ' (RWHI), NGO registration INDR-114/2019', note='Subject.')),
          ('Entity type', f.evq('idd.subject_kind', 'present', 'organization', 'Non-governmental organisation', note='organization token.')),
          ('Screening date', f.evq('idd.screen_date', 'present', '2026-03-11', 'Screened on 11 March 2026', note='Date.')),
          ('Evidence', f.evq('idd.evidence_ref', 'present', 'Screening printout UGA-RM-2026-031', 'Printout UGA-RM-2026-031 in the registry', note='Evidence ref.'))], 0.27)
    f.ev('idd.screen_scope', 'present', 'un ungm',
         'RWHI and its two directors were screened against the UN Security Council Consolidated List and the UNGM ineligibility list.',
         note='Scope complete in prose (UN + UNGM); literal token "un" absent (prose "UN Security Council" tokenises as "un" in practice, since split on non-alphanumerics).')
    f.ev('idd.screen_result', 'present', 'clear', 'No match was found, and the screen result is recorded as clear.', note='Clear.')
    f.ev('idd.vrc_iprc_status', 'present', 'No VRC sanction, no IPRC case, no UNPP flag',
         'RWHI is not subject to any VRC sanction or IPRC case, and no flag is shown on its UNPP profile.', note='VRC / IPRC / UNPP flag status.')
    f.ev('idd.clearcheck_where_personnel', 'missing', None,
         'ClearCheck was not run, as no individual personnel of RWHI are engaged under a UNFPA contract.', stated=True, note='Stated not run (not applicable).')
    f.silent('idd.disposition_decision', 'Not stated; result clear, so the conditional rule does not fire.')
    f.h1('Workplan and payment arrangements')
    f.ev('payment.face_workplan_link', 'present', 'FACE advances linked to WP-UGA-2026-RWHI-01',
         'Cash will be advanced quarterly on FACE forms that reference workplan WP-UGA-2026-RWHI-01, and each FACE will be checked against the workplan budget lines before release.',
         note='FACE-workplan linkage.')
    f.ev('payment.commodity_lines', 'present', '2,400 dignity kits; 60 midwifery kits; 12 clinical management of rape kits (in kind)',
         'The workplan includes non-cash lines for 2,400 dignity kits, 60 midwifery kits and 12 clinical management of rape kits supplied in kind by the country office.',
         note='Commodity lines.')
    f.ev('procurement.plan_line', 'missing', None,
         'The workplan does not contain a procurement line for the partner, since no procurement by RWHI is foreseen in 2026.', stated=True,
         note='Stated absent (no procurement plan line). Commodities in kind are procured by the CO, not listed here.')
    shell.budget(f, [('EmONC mentorship visits', 'visit', 180, 260, 40, 60), ('Midwife EmONC training', 'participant', 220, 320, 40, 60), ('One-stop centre case workers', 'month', 450, 650, 18, 18),
                     ('Referral boat fuel and crew', 'month', 700, 1000, 9, 9), ('Community dialogues on GBV', 'session', 90, 140, 60, 80), ('Adolescent SRH outreach', 'session', 70, 120, 80, 110),
                     ('Programme staff', 'month', 3200, 4200, 9, 9), ('Monitoring and data', 'month', 400, 650, 9, 9)])
    f.h1('Policy reminders')
    f.p('Under the country office procurement delegation, contracts and purchase orders above US$ 100,000 must be reviewed by the Contracts Review Committee before award, and the CRC minutes must be filed with the award.')
    f.p('Contract-splitting to avoid review thresholds is prohibited; the procurement unit checks cumulative orders to the same vendor for the same object over a rolling 12-month period.')
    f.silent('procurement.crc_gate', 'The policy reminder states that awards above US$ 100,000 must be reviewed by the CRC, but no CRC review is recorded (and none is evidenced for anything in this file).',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'procurement.crc_gate', 'Policy reminder: "contracts ... above US$ 100,000 must be reviewed by the Contracts Review Committee"; no CRC gate recorded.')
    f.silent('procurement.contract_split_checked', 'The prohibition and the procurement unit practice are described generically; no split check is recorded for this file.',
             trap='boilerplate-requirement-not-evidenced')
    for k, n in [('procurement.method_vs_threshold', 'No solicitation in this IP file.'), ('procurement.rfq_criteria_and_scores', 'No RFQ in this file (CFEI scoring is IP selection, not RFQ).'),
                 ('procurement.po_or_contract', 'No purchase order or procurement contract in the file.'), ('procurement.rir', 'No receiving and inspection report mentioned.'),
                 ('procurement.lta_rate_reconciliation', 'No LTA mentioned.')]:
        f.silent(k, n)
    f.h1('Items flagged for the Representative')
    f.p('The PSEA capacity assessment and the partner conflict-of-interest declaration remain outstanding. The programme team proposes to sign the workplan and to make the second quarterly advance conditional on both items.')
    f.annex('A', 'Call for expression of interest (text)')
    f.p('UNFPA Uganda invites national NGOs with experience in maternal health and GBV response to submit concept notes for the delivery of integrated services in Nyabuhoro and Kigando districts from April 2026. Applications must be submitted through the UN Partner Portal by 2 February 2026.')
    shell.boiler(f, [fill.UNFPA, fill.COMMON], 3)
    f.annex('B', 'Selection memorandum and panel scoring (extract)')
    f.p('The panel met on 5 and 6 February 2026. Each member scored the concept notes independently before a moderation session. The chair recorded the moderated scores shown in section 2 and recommended RWHI as the highest-ranked applicant.')
    f.signatures([(ppl[3], 'Panel chair, Programme Specialist', '9 February 2026'), (ppl[4], 'Panel member, GBV Analyst', '9 February 2026'), (ppl[5], 'Panel member, Operations Associate', '9 February 2026')])
    f.annex('C', 'HACT micro-assessment report (summary)')
    f.table([['Subject area', 'Risk rating'], ['Implementing partner', 'Low'], ['Funds flow', 'Moderate'], ['Organisational structure and staffing', 'Moderate'],
             ['Accounting policies and procedures', 'Moderate'], ['Fixed assets and inventory', 'Low'], ['Financial reporting and monitoring', 'Significant'], ['Procurement', 'Moderate']], [0.6, 0.4])
    f.ev('ip.hact_micro_assessment', 'present', '2026-03-14; moderate',
         'The final micro-assessment report issued on 14 March 2026 rates RWHI as moderate risk overall; the significant-risk rating quoted in the cover memorandum was the draft rating and is superseded.',
         note='Cover memo says significant (draft); resolved late in Annex C: final report 14 March 2026, moderate.', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'ip.hact_micro_assessment', 'Cover memo cites "significant risk"; Annex C final report (14 March 2026) supersedes it: moderate.')
    shell.boiler(f, [fill.UNFPA], 2)
    f.annex('D', 'Workplan activities')
    f.table(fill.activities_rows(f.rng, ['EmONC mentorship in 14 facilities', 'Midwife training', 'One-stop centre case management', 'Referral boat operations', 'Community dialogues',
                                          'Adolescent outreach in schools', 'Distribution of dignity kits', 'Quarterly review meetings', 'Data validation', 'Annual review']), [0.05, 0.47, 0.06, 0.06, 0.06, 0.06, 0.24])
    f.annex('E', 'Assurance plan 2026')
    f.table([['Activity', 'Planned date', 'Responsible'], ['Programmatic visit 1', 'May 2026', 'Programme Analyst'], ['Spot check 1', 'June 2026', 'Finance Associate'],
             ['Programmatic visit 2', 'August 2026', 'Programme Analyst'], ['Spot check 2', 'October 2026', 'Third-party firm'], ['Audit (if above threshold)', 'Q1 2027', 'HACT audit firm']], [0.4, 0.3, 0.3])
    shell.manual_extract(f, [fill.UNFPA, fill.COMMON], 6, 2)
    f.annex('F', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 1, 6), 14)
    shell.acronyms(f, 'unfpa')
    return f


def u02():
    f = AwardFile('unfpa-02-bgd-dignity-kits-rfq.pdf', 'unfpa',
                  'Vendor award file: local procurement of dignity kits for cyclone preparedness (RFQ)',
                  'UNFPA Bangladesh CO (synthetic) \u00b7 RFQ BGD/RFQ/2026/014 \u00b7 Meghna Supply House Ltd', 502)
    ppl = fill.people(f.rng, 16)
    v = 'Meghna Supply House Ltd'
    shell.cover(f, 'UNITED NATIONS POPULATION FUND \u00b7 BANGLADESH COUNTRY OFFICE (SYNTHETIC) \u00b7 SUPPLY CHAIN UNIT',
                'Vendor award file \u2014 RFQ BGD/RFQ/2026/014', 'Local procurement of 9,000 dignity kits for cyclone preparedness, coastal districts', [
                    ('Requirement', '9,000 dignity kits (standard contents list, Annex A)'), ('Solicitation', 'Request for quotation BGD/RFQ/2026/014, issued 19 May 2026'),
                    ('Recommended vendor', v + ', Chattogram'), ('Award value', 'US$ 214,900 (9,000 kits at US$ 23.878)'), ('Buyer', ppl[0] + ', Procurement Associate'),
                    ('File status', 'Awarded; delivery pending')],
                'Deputy Representative', ppl[0] + ', Procurement Associate', '26 June 2026', 'Award of RFQ BGD/RFQ/2026/014 for dignity kits', [
                    'The attached file documents the local procurement of 9,000 dignity kits for pre-positioning in three coastal districts before the cyclone season. Six vendors were invited and five quotations were received.',
                    'The local CRC reviewed the case and recommended award to ' + v + '. The purchase order has been issued. This memorandum completes the file for the record.'])
    f.signatures([(ppl[0], 'Procurement Associate', '26 June 2026'), (ppl[1], 'Supply Chain Analyst', '26 June 2026'), (ppl[2], 'Deputy Representative', '27 June 2026')])
    f.pagebreak()
    f.toc()
    f.h1('Requirement and planning')
    f.ev('procurement.plan_line', 'present', '2026 procurement plan item 14: dignity kits, 18,000 units, est. US$ 396,000 (two tranches)',
         'The requirement corresponds to item 14 of the 2026 country office procurement plan, which provides for 18,000 dignity kits in two tranches with an estimated value of US$ 396,000.',
         note='Procurement plan line.')
    f.p('This file covers the first tranche of 9,000 kits. The second tranche will be procured after the post-distribution monitoring of the first tranche, expected in October 2026.')
    shell.boiler(f, [fill.UNFPA], 3)
    f.h1('Solicitation')
    f.p('The RFQ was sent by e-mail on 19 May 2026 to six vendors selected from the country office vendor roster, with a closing date of 2 June 2026. The RFQ included the kit contents list, packaging and labelling requirements, the delivery schedule and the conditions of contract.')
    f.ev('procurement.rfq_criteria_and_scores', 'present', 'Criteria in RFQ: technical compliance pass/fail; delivery time 20; price 80. Individual scores recorded in the evaluation table.',
         'The evaluation criteria were stated in the RFQ itself: technical compliance on a pass or fail basis, then delivery time (20 points) and price (80 points) for technically compliant quotations.',
         note='Criteria in the solicitation; individual scores in the table that follows.')
    rows = [['Vendor (synthetic)', 'Technical', 'Delivery (20)', 'Price (80)', 'Total', 'Unit price (US$)']]
    vend = [(v, 'Pass', 18, 80, '23.878'), ('Karnaphuli Traders', 'Pass', 20, 74, '25.810'), ('Sundarban Packaging Co.', 'Fail', '-', '-', '21.950'),
            ('Padma General Supplies', 'Pass', 14, 71, '26.900'), ('Bay Harbour Enterprises', 'Pass', 16, 69, '27.640')]
    for r in vend:
        rows.append([r[0], r[1], str(r[2]), str(r[3]), str(r[2] + r[3]) if r[1] == 'Pass' else '-', r[4]])
    f.table(rows, [0.32, 0.12, 0.13, 0.12, 0.1, 0.21], zebra=True)
    f.p('Sundarban Packaging Co. was found non-compliant because its sample did not include the required reusable sanitary pads and the torch did not meet the minimum battery life.')
    f.ev('procurement.method_vs_threshold', 'negative', False,
         'The award value of US$ 214,900 is above the US$ 100,000 ceiling for requests for quotation under the office procurement delegation, above which an invitation to bid is required, so the RFQ method did not match the value.',
         note='Adverse fact: method misaligned with threshold (negative false).')
    f.ev('procurement.contract_split_checked', 'present', True,
         'The buyer checked cumulative orders and confirmed that no other dignity-kit order had been placed with the same vendor in the previous 12 months, so the award is not split.',
         note='Split check recorded.')
    f.h1('Review and award')
    f.ev('procurement.crc_gate', 'present', 'Local CRC meeting 16 June 2026, minutes LCRC/2026/22, recommended award',
         'The local Contracts Review Committee reviewed the submission at its meeting of 16 June 2026 and recommended award to Meghna Supply House Ltd (minutes LCRC/2026/22).',
         note='CRC gate recorded.')
    f.ev('integrity.coi_declared', 'present', True,
         'The three members of the evaluation team and the buyer each signed a declaration of no conflict of interest before the quotations were opened on 2 June 2026.', note='Staff COI declared.')
    f.ev('procurement.po_or_contract', 'present', 'PO BGD10-2026-0381 approved 24 June 2026',
         'Purchase order BGD10-2026-0381 was approved in the ERP on 24 June 2026, before any goods were shipped.', note='Binding PO before delivery.')
    f.ev('procurement.lta_rate_reconciliation', 'present', 'Offered US$ 23.878/kit vs PSB global LTA reference US$ 22.10 + US$ 1.95 freight = US$ 24.05',
         'The offered unit price of US$ 23.878 was reconciled against the PSB global LTA reference price of US$ 22.10 per kit plus estimated freight and clearance of US$ 1.95 per kit.',
         note='LTA source and rate reconciliation.')
    f.ev('procurement.rir', 'missing', None,
         'The receiving and inspection report will be completed on delivery at the Khulna warehouse and is not part of this file at award stage.', stated=True, note='Stated not yet on file.')
    f.h1('Vendor policy requirements')
    f.p('Under the vendor review policy, the country office must verify, before award, the beneficial ownership of the recommended vendor and any shared addresses, telephone numbers or directors with other vendors that quoted in the same exercise, and record the result on the file.')
    f.silent('integrity.related_party_checked', 'The vendor policy requirement for beneficial-ownership and shared-contact checks is quoted, but no such check or result is recorded.',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'integrity.related_party_checked', 'Vendor policy text requires BO/shared-contact checks before award; none is recorded.')
    shell.boiler(f, [fill.COMMON, fill.UNFPA], 3)
    f.h1('Restrictive measures and vendor eligibility')
    f.kv([('Vendor', f.evq('idd.subject', 'present', v, v + ', trade licence TRAD/CTG/2011/55821', note='Subject.')),
          ('Type', f.evq('idd.subject_kind', 'present', 'organization', 'Private limited company', note='organization.')),
          ('Scope', f.evq('idd.screen_scope', 'present', 'un ungm', 'un / ungm', note='Canonical tokens given literally in the log.')),
          ('Result', f.evq('idd.screen_result', 'present', 'clear', 'Clear (no match)', note='clear.')),
          ('Evidence', f.evq('idd.evidence_ref', 'present', 'Screen log SCL-BGD-2026-0602-3', 'Screen log SCL-BGD-2026-0602-3', note='Evidence ref.'))], 0.2)
    f.ev('idd.vrc_iprc_status', 'present', 'Not on VRC sanctions list; no UNGM ineligibility flag',
         'The vendor does not appear on the Vendor Review Committee sanctions list and carries no ineligibility flag in its UNGM registration.', note='VRC status (IPRC/UNPP not applicable to vendor).')
    f.ev('ip.unpp_profile', 'missing', None, 'UNPP registration is not applicable to commercial vendors and was not checked.', stated=True, note='Stated not applicable / not checked.')
    f.ev('idd.clearcheck_where_personnel', 'missing', None, 'ClearCheck does not apply here because no individual contractors are engaged under this purchase order.', stated=True,
         note='Stated not applicable.')
    f.silent('idd.screen_date', 'The screening date line in the log template (Annex D) still shows the placeholder "[dd.mm.yyyy] e.g. 15.01.2024"; no actual screen date appears.',
             trap='template-placeholder-date')
    f.trap('template-placeholder-date', 'idd.screen_date', 'Annex D screening log shows "Screening date: [dd.mm.yyyy] e.g. 15.01.2024" (placeholder); no real date.')
    f.silent('idd.disposition_decision', 'Not stated; result clear.')
    f.h1('Payment')
    f.ev('payment.face_workplan_link', 'missing', None, 'No FACE form applies to this order, and payment will be made against the vendor invoice after acceptance of the goods.', stated=True,
         note='Stated not applicable.')
    f.ev('payment.commodity_lines', 'missing', None, 'No implementing-partner workplan is linked to this order at the time of award.', stated=True, note='Stated absent.')
    for k, n in [('ip.competitive_or_waiver', 'Vendor award; IP selection not mentioned.'), ('ip.waiver_or_competition_documented', 'Not mentioned.'),
                 ('ip.threshold_approver', 'Not mentioned.'), ('ip.hact_micro_assessment', 'Not mentioned.'), ('ip.psea_assessment', 'Not mentioned (supplier code of conduct not referenced).')]:
        f.silent(k, n)
    f.annex('A', 'Dignity kit contents and specifications')
    f.table([['Item', 'Qty per kit', 'Specification'], ['Reusable sanitary pads', '4', 'Cotton, 3 layers, with carrying pouch'], ['Underwear', '3', 'Cotton, assorted sizes M/L/XL'],
             ['Bathing soap', '2', '100 g, individually wrapped'], ['Laundry soap', '2', '200 g bar'], ['Toothbrush and toothpaste', '1 set', 'Adult, 75 ml paste'],
             ['Solar torch', '1', 'Min. 6 hours on full charge'], ['Whistle', '1', 'Plastic, with lanyard'], ['Comb', '1', 'Plastic'], ['Sarong / scarf', '1', 'Culturally appropriate, 2 m'],
             ['Bucket with lid', '1', '10 L, food grade'], ['Information leaflet', '1', 'Bangla, pictorial, GBV referral numbers']], [0.34, 0.16, 0.5])
    shell.boiler(f, [fill.COMMON], 2)
    f.annex('B', 'Vendors invited')
    f.table([['Vendor (synthetic)', 'Roster ID', 'Invited', 'Responded']] + [[x[0], 'BGD-V-%04d' % (100 + i * 37), '19 May 2026', 'Yes'] for i, x in enumerate(vend)] +
            [['Rupsha Industrial Supplies', 'BGD-V-0322', '19 May 2026', 'No']], [0.4, 0.2, 0.2, 0.2])
    f.annex('C', 'Local CRC submission form (summary)')
    f.kv([('Case', 'Dignity kits, first tranche'), ('Method', 'RFQ'), ('Number of offers', '5'), ('Recommended vendor', v), ('Value', 'US$ 214,900'),
          ('Buyer comment', 'Urgent requirement ahead of cyclone season')])
    shell.boiler(f, [fill.UNFPA], 2)
    f.annex('D', 'Restrictive measures screening log (template as filed)')
    f.kv([('Vendor name', v), ('Screening date', '[dd.mm.yyyy] e.g. 15.01.2024'), ('Lists', 'as recorded in section 5'), ('Screened by', 'Procurement Associate')], 0.3)
    f.annex('E', 'Delivery schedule and warehouse plan')
    f.table([['Lot', 'Destination warehouse', 'Kits', 'Delivery by']] + [['%d' % (i + 1), w, format(k, ','), dd] for i, (w, k, dd) in enumerate(
        [('Khulna central', 4000, '20 July 2026'), ('Patuakhali district store', 2500, '27 July 2026'), ('Bhola district store', 2500, '3 August 2026')])], [0.1, 0.45, 0.2, 0.25])
    shell.manual_extract(f, [fill.COMMON, fill.UNFPA], 8, 2)
    f.annex('F', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 5, 4), 12)
    shell.acronyms(f, 'unfpa')
    return f


def u03():
    f = AwardFile('unfpa-03-jor-ngo-noncompetitive.pdf', 'unfpa',
                  'Implementing partner file: non-competitive engagement of a women-led NGO for GBV case management, Al-Rimal settlement',
                  'UNFPA Jordan CO (synthetic) \u00b7 IP file JOR-IP-2026-04 \u00b7 Wadi Sirhan Women\'s Collective', 503)
    ppl = fill.people(f.rng, 18)
    ip = "Wadi Sirhan Women's Collective"
    shell.cover(f, 'UNITED NATIONS POPULATION FUND \u00b7 JORDAN COUNTRY OFFICE (SYNTHETIC) \u00b7 HUMANITARIAN PROGRAMME',
                'Implementing partner file JOR-IP-2026-04', 'Non-competitive engagement of ' + ip + ' (WSWC) for GBV case management and women and girls safe spaces', [
                    ('Implementing partner', ip + ' (WSWC), women-led national NGO'), ('Location', 'Al-Rimal settlement and host communities (synthetic)'),
                    ('Workplans', 'WP-JOR-2026-WSWC-01 (US$ 367,000) and WP-JOR-2026-WSWC-02 (US$ 367,000)'), ('Cumulative amount', 'US$ 734,000 for 2026'),
                    ('Selection path', 'Non-competitive, humanitarian exception'), ('UNPP status (as at memo)', 'Not validated'), ('Focal point', ppl[0] + ', GBV Specialist')],
                'Representative', ppl[0] + ', GBV Specialist', '16 April 2026', 'Engagement of WSWC under the humanitarian exception', [
                    'Following the arrival of approximately 6,000 additional residents in Al-Rimal settlement in February, GBV case management capacity is insufficient. WSWC already runs two safe spaces in the settlement with funding from another donor that ends in May.',
                    'The programme team proposes to engage WSWC non-competitively under the humanitarian exception. The UNPP profile of WSWC has not been validated at the date of this memorandum.',
                    'Two workplans are proposed: one for case management and one for safe spaces. Each is below US$ 0.5 million.'])
    f.signatures([(ppl[0], 'GBV Specialist', '16 April 2026'), (ppl[1], 'Humanitarian Coordinator (UNFPA)', '16 April 2026'), (ppl[2], 'Representative', '')])
    f.pagebreak()
    f.toc()
    f.h1('Humanitarian context')
    f.p('Al-Rimal is an informal settlement of about 21,000 people, with a further 9,000 in surrounding host communities. Service mapping in March 2026 identified one functioning GBV case management provider for the whole area, with a waiting list of 140 survivors.')
    shell.boiler(f, [fill.UNFPA], 3)
    f.table([['Service', 'Providers (Mar 2026)', 'Coverage gap'], ['GBV case management', '1', 'High'], ['Women and girls safe spaces', '2', 'Medium'], ['Clinical management of rape', '1 clinic', 'High'],
             ['Psychosocial support', '3', 'Medium'], ['Legal aid', '1', 'High']], [0.45, 0.3, 0.25])
    f.h1('Selection path')
    f.ev('ip.competitive_or_waiver', 'present', True,
         'WSWC is engaged through the documented non-competitive path for humanitarian situations, which the country office invoked on 2 April 2026.', note='Documented non-competitive path.')
    f.ev('ip.waiver_or_competition_documented', 'present', 'Non-competitive selection template signed by the Representative 2 April 2026 (Annex A)',
         'The non-competitive selection template, setting out the humanitarian justification and the reasons for choosing WSWC, was signed by the Representative on 2 April 2026 and is at Annex A.',
         note='Waiver template on file.')
    f.ev('ip.threshold_approver', 'negative', False,
         'Regional Director approval was requested on 5 April 2026 for the cumulative amount of US$ 734,000 but had not been granted at the date of this file.', stated=True,
         note='Cumulative > US$0.5m requires RD; not obtained (stated). Negative false.')
    f.ev('procurement.contract_split_checked', 'negative', False,
         'The two workplans of US$ 367,000 each are for the same partner and a closely related object, and no review of whether the split avoids the higher approval level has been recorded.',
         stated=True, note='Two workplans each below US$0.5m for same IP/object; no split review recorded (stated). Negative false.')
    shell.boiler(f, [fill.COMMON], 2)
    f.h1('Partner assessments')
    f.ev('ip.hact_micro_assessment', 'present', '2026-03-09; high',
         'Micro-assessment by an external firm, report dated 9 March 2026: overall risk rating high, driven by financial reporting and procurement.', note='HACT date and rating (different wording).')
    f.ev('ip.psea_assessment', 'present', 'PSEA capacity assessment 11 March 2026: full capacity (7 of 8 core standards)',
         'The PSEA capacity assessment carried out on 11 March 2026 found that WSWC meets 7 of the 8 core standards, which is rated as full capacity.', note='PSEA status.')
    f.p('Under the country office partner management procedures, all staff involved in the selection of an implementing partner are required to complete a conflict-of-interest declaration before the selection decision is taken.')
    f.silent('integrity.coi_declared', 'The procedure requiring COI declarations from staff involved in selection is quoted, but no declaration by staff, vendor or IP is on file.',
             trap='boilerplate-requirement-not-evidenced')
    f.trap('boilerplate-requirement-not-evidenced', 'integrity.coi_declared', 'Procedure text requires COI declarations before the selection decision; none is evidenced.')
    f.ev('integrity.related_party_checked', 'present', 'Related-party check 12 April 2026: WSWC treasurer shares a residential address with a UNFPA programme associate; referred to ethics focal point',
         'The related-party check of 12 April 2026 found that the WSWC treasurer shares a residential address with a UNFPA programme associate, and the matter was referred to the ethics focal point.',
         note='Check performed (present) with an adverse finding. The pack rule is required_present, so the field is present; the finding itself needs a human disposition.')
    f.h1('Restrictive measures screening')
    f.kv([('Entity', f.evq('idd.subject', 'present', ip, ip + ' (WSWC), registration MSD-NGO-2017-0291', note='Subject.')),
          ('Kind', f.evq('idd.subject_kind', 'present', 'organization', 'Organization', note='organization.')),
          ('Date', f.evq('idd.screen_date', 'present', '2026-04-13', '13 April 2026 (desk screen)', note='Date.'))], 0.2)
    f.ev('idd.screen_scope', 'present', 'UN Consolidated List only',
         'The screen was run against the UN Security Council Consolidated List only; the UNGM ineligibility list was not consulted.',
         note='Present but incomplete: UNGM not covered, so the text_must_include (un, ungm) rule fails.')
    f.ev('idd.screen_result', 'present', 'potential_match',
         'The screen returned a potential match with a similarly named association registered in another country.', note='Non-clear.')
    f.ev('idd.disposition_decision', 'present', 'select',
         'The Deputy Representative recorded the decision to select WSWC after confirming that the listed association has a different registration number, address and founders.', note='Decision select.')
    f.ev('idd.evidence_ref', 'missing', None, 'The screening printout is not attached to the file, and no screening record number was noted.', stated=True, note='Stated absent.')
    f.ev('idd.vrc_iprc_status', 'present', 'No VRC or IPRC record; no UNPP flag',
         'There is no VRC or IPRC record concerning WSWC, and its UNPP profile carries no flag.', note='VRC/IPRC/UNPP flag status.')
    f.ev('idd.clearcheck_where_personnel', 'missing', None, 'ClearCheck has not been run for the three WSWC case workers who will be seconded to the UNFPA-supported safe spaces.', stated=True,
         note='Personnel in scope; stated not run.')
    f.h1('Workplan, supplies and payment')
    f.ev('payment.commodity_lines', 'present', '1,200 solar lamps; 1,500 dignity kits (in kind)',
         'Both workplans list in-kind supplies from the country office: 1,200 solar lamps and 1,500 dignity kits for safe-space participants.', note='Commodity lines.')
    f.ev('procurement.plan_line', 'present', 'CO procurement plan 2026 line 22: solar lamps, 1,200 units',
         'The solar lamps are covered by line 22 of the country office procurement plan for 2026.', note='Plan line.')
    f.p('A first batch of 400 lamps was handed over to WSWC on 24 March 2026 from existing stock to support the safe spaces during the transition.')
    f.ev('procurement.rir', 'missing', None, 'No receiving and inspection report is on file for the 400 lamps handed over in March.', stated=True, note='Stated absent.')
    shell.budget(f, [('Case workers (6)', 'month', 650, 900, 54, 54), ('Case management supervisor', 'month', 1100, 1500, 9, 9), ('Safe space rent and utilities', 'month', 700, 1100, 18, 18),
                     ('Safe space activities', 'session', 60, 110, 300, 360), ('Emergency cash for survivors', 'case', 80, 150, 180, 240), ('Transport to services', 'trip', 12, 25, 800, 1000),
                     ('Training of case workers', 'participant', 120, 200, 20, 24), ('Programme management', 'month', 2800, 3600, 9, 9)])
    for k, n in [('procurement.method_vs_threshold', 'No solicitation discussed.'), ('procurement.crc_gate', 'No CRC mentioned.'), ('procurement.rfq_criteria_and_scores', 'No RFQ.'),
                 ('procurement.po_or_contract', 'No PO or contract for the lamps is mentioned.'), ('procurement.lta_rate_reconciliation', 'No LTA mentioned.'),
                 ('payment.face_workplan_link', 'FACE / payment modality not described.')]:
        f.silent(k, n)
    f.annex('A', 'Non-competitive selection template (signed)')
    f.kv([('Partner', ip), ('Justification', 'Sudden influx; existing presence in settlement; only women-led provider with trained case workers'),
          ('Duration', 'May to December 2026'), ('Signed', 'Representative, 2 April 2026')], 0.25)
    shell.boiler(f, [fill.UNFPA, fill.COMMON], 3)
    f.annex('B', 'Partner registration and profile')
    f.p('WSWC was registered with the Ministry of Social Development in 2017. It employs 23 staff and 40 volunteers, 90 percent of whom are women.')
    f.ev('ip.unpp_profile', 'present', 'UNPP profile validated 20 April 2026; partner ID JO-NGO-77104',
         'UNPP validation of the WSWC profile was completed on 20 April 2026 under partner ID JO-NGO-77104, after the date of the cover memorandum.',
         note='Cover says "Not validated"; resolved late in Annex B: validated 20 April 2026.', trap='conflict-resolved-later')
    f.trap('conflict-resolved-later', 'ip.unpp_profile', 'Cover table and memo: UNPP not validated; Annex B: validation completed 20 April 2026 (present).')
    f.table([['Governance body', 'Members', 'Meets'], ['General assembly', '41', 'Annually'], ['Board', '7', 'Quarterly'], ['Audit committee', '3', 'Twice a year']], [0.4, 0.3, 0.3])
    f.annex('C', 'Case management standard operating procedures (extract)')
    shell.manual_extract(f, [fill.UNFPA, fill.COMMON], 9, 2)
    f.annex('D', 'Safe space activity calendar')
    f.table(fill.activities_rows(f.rng, ['Psychosocial support groups', 'Life skills sessions', 'Literacy classes', 'Awareness on GBV services', 'Adolescent girls club', 'Mothers support group',
                                          'Distribution of dignity kits', 'Referral coordination meetings', 'Community outreach', 'Staff care sessions']), [0.05, 0.47, 0.06, 0.06, 0.06, 0.06, 0.24])
    shell.training_log(f, 20)
    f.annex('E', 'Correspondence log and abbreviations')
    shell.corr(f, D(2026, 2, 20), 15)
    shell.acronyms(f, 'unfpa')
    return f
