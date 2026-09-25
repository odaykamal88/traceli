"""Neutral filler for realistic synthetic award files.

Nothing here may evidence a pack key: pools talk about reporting, visibility,
data protection, audit rights, logistics, environment, gender and similar
boilerplate. Checklist evidence is written by hand in each file builder.
"""
import datetime as dt

FIRST = ['Amina', 'Tobias', 'Grace', 'Idris', 'Lerato', 'Samuel', 'Nadia', 'Kofi', 'Mireille', 'Joseph', 'Farah',
         'Dawit', 'Esther', 'Rahul', 'Selam', 'Pierre', 'Hawa', 'Victor', 'Leila', 'Chipo', 'Yusuf', 'Marta', 'Obinna',
         'Priya', 'Tariq', 'Agnes', 'Bongani', 'Rosa', 'Hamid', 'Ines', 'Musa', 'Clara', 'Anil', 'Zainab', 'Felix']
LAST = ['Mwakideu', 'Okonkwere', 'Ranasith', 'Belmonte-Ari', 'Tshabalo', 'Haddouri', 'Kamarevu', 'Ndiayeko',
        'Lindqvaar', 'Osei-Brandt', 'Mahlanza', 'Qureshal', 'Fontanel', 'Abubakarri', 'Sithembele', 'Varghese-Oku',
        'Kalunduwa', 'Tesfamarin', 'Duvaliere', 'Chakwendu', 'Morabeth', 'Imanyara', 'Zeleketu', 'Balogandi',
        'Rukundiro', 'Estrevin', 'Nakamboa', 'Hilarov', 'Oyelakin-Ross', 'Mbuyamba', 'Sadeqian', 'Torvaldi']


def person(rng):
    return '%s %s' % (rng.choice(FIRST), rng.choice(LAST))


def people(rng, n):
    seen, out = set(), []
    while len(out) < n:
        p = person(rng)
        if p.split()[1] not in seen:
            seen.add(p.split()[1])
            out.append(p)
    return out


def dstr(d):
    return d.strftime('%-d %B %Y')


def money(x, cur='US$'):
    return '%s %s' % (cur, format(int(round(x)), ','))


COMMON = [
    'All documents in this file are maintained in accordance with the records retention schedule applicable to the country office. Originals of signed instruments are kept in the registry; scanned copies are uploaded to the shared drive within five working days of signature. Superseded drafts are retained only where they record a decision.',
    'The file follows the country office naming convention for electronic records: reference number, document type, version and date. Version numbers are incremented on every substantive change. Minor corrections of spelling or formatting do not create a new version.',
    'Personal data collected in the course of this engagement is processed only for the purposes stated in the agreement. Beneficiary-level data is not transferred to the file; aggregated figures are used for reporting. Any data-sharing arrangement with a third party requires a separate written protocol.',
    'Visibility and communication materials shall carry the logos agreed in the communication plan. Draft materials are shared with the communications focal point at least ten working days before printing. The partner shall not use the logo in any fundraising material without prior written consent.',
    'Financial and narrative reports shall be submitted in English. Where supporting documents are in a national language, a short summary in English is attached. Currency conversions use the UN operational rate of exchange in force on the date of the transaction.',
    'The parties shall cooperate in any audit, review or evaluation of the programme. Auditors shall have access to books, records and personnel, subject to reasonable notice. Findings will be shared with the partner for comment before a report is finalised.',
    'Environmental considerations are addressed in the implementation plan. Packaging waste from distributions is collected and disposed of through licensed operators where available. Vehicle use is logged and consolidated trips are encouraged to reduce fuel consumption.',
    'Gender and inclusion considerations have been reflected in the design of activities. Sex- and age-disaggregated data is collected for all output indicators. Consultations with community representatives include separate sessions for women and adolescent girls.',
    'Security risk management follows the measures approved for the area of operations. Field movements are notified to the security focal point in advance. Activities in locations above the agreed security level are suspended until clearance is renewed.',
    'Any amendment to the agreement shall be made in writing and signed by the authorised representatives of both parties. Budget reallocations within a category of up to ten percent may be agreed by exchange of letters; larger changes require a formal amendment.',
    'The partner shall maintain a fixed asset register for equipment purchased with programme funds. Items above the capitalisation threshold are tagged and verified annually. Disposal or transfer of assets at the end of the programme requires written agreement.',
    'Complaints and feedback from affected communities are received through a hotline, suggestion boxes and community focal points. The partner reports monthly on the number and category of complaints and on the time taken to respond. Sensitive complaints are referred through a confidential channel.',
    'Cash management follows the principle of minimum balances. Funds are held in a dedicated account and interest earned is reported. Transfers are requested on the basis of a cash forecast for the following quarter.',
    'Meetings of the programme steering group take place quarterly. Minutes are circulated within ten working days and action points are tracked in the programme dashboard. Extraordinary meetings may be convened by either party.',
    'This file has been compiled for internal review. Page references in the index refer to the consolidated PDF. Where a document appears in more than one version, the latest signed version is filed and earlier versions are listed in the correspondence log.',
    'Lessons from the previous cycle were considered in preparing this file, in particular the need for earlier engagement with district authorities and for clearer delivery schedules. These lessons are reflected in the timeline in the implementation plan.',
    'Transport and storage arrangements take account of the rainy season. Pre-positioning of goods in district stores is completed before the end of the dry season where possible. Temperature logs are kept for items that require controlled storage.',
    'The implementation timeline assumes timely customs clearance. Where duty exemption is available, the relevant certificates are requested at the time of order. Delays attributable to clearance are reported in the next progress report.',
    'Staff costs charged to the programme are supported by timesheets approved by the line manager. Shared costs are apportioned on a documented basis that is applied consistently across donors. Changes to the apportionment basis are notified in writing.',
    'Programme monitoring combines routine data review, field visits and spot checks. Monitoring visits are planned on a quarterly calendar and reports are filed within two weeks of each visit. Follow-up actions are assigned an owner and a due date.',
]

GF = [
    'The grant is implemented under the Grant Regulations and the grant confirmation signed with the Global Fund. Terms defined in the grant confirmation have the same meaning in this file. In case of inconsistency, the grant confirmation prevails over internal guidance notes.',
    'The Local Fund Agent may review any document in this file as part of its verification role. Requests from the Local Fund Agent are logged and answered within the time frame set by the Country Team. Copies of responses are kept in the correspondence section.',
    'Health products financed under the grant are quantified through the national forecasting exercise. Quantification assumptions, including consumption and stock-on-hand data, are documented in the supply plan. The supply plan is updated at least twice a year.',
    'Programmatic results are reported through the progress update and disbursement request. Indicator values are drawn from the national health information system where possible. Data quality checks are performed before submission.',
    'The Country Coordinating Mechanism is informed of major implementation developments through its oversight committee. Oversight visits are coordinated with the Principal Recipient to avoid duplication with routine monitoring.',
    'Funds are disbursed in tranches linked to the approved cash forecast. The Principal Recipient reconciles advances to sub-implementers quarterly. Unspent balances at the end of the implementation period are handled as set out in the grant confirmation.',
    'Pharmaceutical and health product quality assurance follows the applicable quality assurance policy. Certificates of analysis and batch release documents are retained with the receipt documentation for each consignment.',
    'Human rights and gender considerations are integrated into programme design in line with the grant catalytic priorities. Community-led monitoring findings are discussed with the programme team each quarter.',
    'Co-financing commitments of the government are tracked in the co-financing matrix. The matrix is updated annually and shared with the Country Team as part of the annual funding decision process.',
    'The Principal Recipient maintains a grant management manual approved by its board. The manual covers finance, procurement, sub-recipient management, monitoring and evaluation, and risk management. Revisions are shared with the Country Team for information.',
    'Price and quality reporting for health products is completed within the required time after each purchase. Reference prices are compared with the pooled procurement mechanism benchmarks where available.',
    'Taxes and duties are not charged to the grant. Where tax exemption cannot be obtained at source, the amounts are recorded and reported so that they can be recovered or treated as the grant confirmation provides.',
]

UNFPA = [
    'This file is prepared under the country programme document and the annual workplan agreed with the government coordinating authority. Programme outputs are aligned with the transformative results on maternal deaths, unmet need for family planning, and gender-based violence and harmful practices.',
    'Implementing partners report programme progress quarterly through the workplan progress report. Output indicators are measured against the baselines recorded at workplan signature. Deviations of more than twenty percent are explained in the narrative.',
    'Assurance activities for implementing partners include programmatic monitoring visits, spot checks and audits in line with the assurance plan. The assurance plan is updated at the start of each year on the basis of cash transfer volumes and prior findings.',
    'Reproductive health commodities are managed through the national logistics management information system. Distribution to service delivery points follows the approved distribution plan. Last-mile assurance checks are performed in a sample of facilities each quarter.',
    'Youth participation is a cross-cutting principle of the programme. Young people are represented in the programme review meeting and in community feedback sessions. Adolescent-friendly service standards apply to all supported facilities.',
    'The country office applies the policy on the prevention of sexual harassment and abuse of authority to all personnel, including consultants and interns. Training completion is tracked by the human resources unit.',
    'Programme supplies delivered in kind are recorded in the inventory system on receipt and at each transfer. Physical counts are carried out at the end of each quarter in the country office store and in partner warehouses.',
    'Humanitarian programming follows the minimum initial service package for reproductive health in crises. Readiness actions, including pre-positioning of kits, are reviewed during the annual preparedness exercise.',
    'The workplan budget is expressed in United States dollars. Local currency expenditure is converted at the UN operational rate of exchange. Direct support costs are not charged by the implementing partner.',
    'Data on gender-based violence is handled according to the information-sharing protocol of the GBV sub-cluster. Survivor-level information is never recorded in programme files.',
    'The country office supply chain team coordinates with the procurement services branch for international orders. Local procurement is limited to items available on the national market that meet specifications.',
    'Programme review meetings take place twice a year with the government coordinating authority and all implementing partners. The mid-year review may revise targets and budgets within the ceilings of the annual workplan.',
]

OCHA = [
    'The Country-Based Pooled Fund is managed by the Humanitarian Financing Unit on behalf of the Humanitarian Coordinator. Allocations support the priorities of the humanitarian response plan and are coordinated with the clusters. The Advisory Board provides strategic guidance on fund use.',
    'Projects are designed to meet the needs identified in the humanitarian needs overview. Beneficiary targeting follows cluster guidance and is discussed with local authorities and community representatives. Duplication with other funding sources is checked during review.',
    'Cluster coordinators support the strategic and technical review of project proposals. Technical feedback is shared with partners through the grant management system and must be addressed before the project can progress.',
    'Localisation is a guiding principle of the fund. National and local partners are encouraged to apply directly, and international partners are expected to show how they strengthen the capacities of local organisations they work with.',
    'Monitoring of funded projects follows the operational modalities approved by the Humanitarian Coordinator. Field monitoring, financial spot checks and remote call monitoring are planned according to partner risk level.',
    'Narrative reports are submitted through the grant management system at the frequency set by the partner risk level. Final narrative and financial reports are due within two months of project end.',
    'Accountability to affected people is a requirement for all funded projects. Partners describe the feedback mechanism used, the languages used for information sharing and how feedback leads to project adjustments.',
    'Cash and voucher assistance is designed in line with the cash working group guidance, including transfer values and delivery mechanisms. Market monitoring is carried out during implementation where feasible.',
    'Protection mainstreaming is applied across sectors. Projects assess the risk that assistance may cause harm and describe measures to reduce it, including safe distribution arrangements and referral pathways.',
    'The allocation timeline is published at launch. Partners are informed of each stage through the grant management system, and the Humanitarian Financing Unit holds an information session for applicants during the first week.',
    'Access constraints are monitored by the access working group. Projects in hard-to-reach areas describe contingency arrangements, including remote management and the use of local implementing staff.',
    'Audits of funded projects are carried out according to the audit plan of the fund. Audit reports are shared with partners, and follow-up of recommendations is tracked by the Humanitarian Financing Unit.',
]

RISKS = [
    ['Currency depreciation reduces purchasing power of local costs', 'Medium', 'Quarterly budget review; contingency line'],
    ['Road access to northern districts cut during rains', 'High', 'Pre-positioning before rainy season'],
    ['Staff turnover in partner finance unit', 'Medium', 'Handover checklist; refresher training'],
    ['Delays in customs clearance of imported goods', 'Medium', 'Early exemption requests; clearing agent'],
    ['Insecurity along main supply route', 'High', 'Security clearance; alternative routing'],
    ['Stock-outs at district level due to late reporting', 'Medium', 'Monthly stock reporting reminders'],
    ['Fuel shortages affecting field monitoring', 'Low', 'Fuel reserve; consolidated trips'],
    ['Price increases for locally sourced items', 'Medium', 'Market survey before each order'],
    ['Late submission of quarterly reports', 'Low', 'Reporting calendar; reminders two weeks before due date'],
    ['Community tensions around targeting', 'Medium', 'Transparent criteria; community committees'],
    ['Data loss from field devices', 'Low', 'Encrypted devices; weekly synchronisation'],
    ['Heat damage to stored goods', 'Medium', 'Ventilated stores; temperature logs'],
]

ACRONYMS = {
    'common': [('AWP', 'Annual workplan'), ('CO', 'Country office'), ('HQ', 'Headquarters'), ('M&E', 'Monitoring and evaluation'),
               ('TOR', 'Terms of reference'), ('UN', 'United Nations'), ('USD', 'United States dollar'), ('Q1-Q4', 'Calendar quarters')],
    'gf': [('CCM', 'Country Coordinating Mechanism'), ('LFA', 'Local Fund Agent'), ('PR', 'Principal Recipient'),
           ('SR', 'Sub-recipient'), ('PU/DR', 'Progress update and disbursement request'), ('PSM', 'Procurement and supply management'),
           ('IDD', 'Integrity due diligence'), ('OFAC', 'Office of Foreign Assets Control (United States)')],
    'unfpa': [('IP', 'Implementing partner'), ('HACT', 'Harmonized approach to cash transfers'), ('FACE', 'Funding authorization and certificate of expenditure'),
              ('UNPP', 'UN Partner Portal'), ('LTA', 'Long-term agreement'), ('RFQ', 'Request for quotation'), ('CRC', 'Contracts Review Committee'),
              ('RIR', 'Receiving and inspection report'), ('UNGM', 'United Nations Global Marketplace'), ('PSEA', 'Protection from sexual exploitation and abuse')],
    'ocha': [('CBPF', 'Country-Based Pooled Fund'), ('HFU', 'Humanitarian Financing Unit'), ('HC', 'Humanitarian Coordinator'),
             ('AB', 'Advisory Board'), ('GMS', 'Grant management system (OneGMS)'), ('RC', 'Review committee'), ('HRP', 'Humanitarian response plan'),
             ('OIOS', 'Office of Internal Oversight Services'), ('PSEA', 'Protection from sexual exploitation and abuse')],
}


def pick(rng, pool, n):
    return rng.sample(pool, min(n, len(pool)))


def budget_rows(rng, lines, cur='US$', qty=True):
    rows = [['Code', 'Budget line', 'Unit', 'Qty', 'Unit cost', 'Total (%s)' % cur]]
    total = 0
    for i, (name, unit, lo, hi, qlo, qhi) in enumerate(lines):
        q = rng.randint(qlo, qhi)
        uc = rng.randint(lo, hi)
        t = q * uc
        total += t
        rows.append(['%d.%02d' % (1 + i // 6, 1 + i % 6), name, unit, str(q), format(uc, ','), format(t, ',')])
    rows.append(['', 'Subtotal, lines shown', '', '', '', format(total, ',')])
    return rows, total


def correspondence(rng, start, subjects, n):
    rows = [['Date', 'From', 'To', 'Subject']]
    d = start
    for s in rng.sample(subjects, min(n, len(subjects))):
        d = d + dt.timedelta(days=rng.randint(2, 9))
        rows.append([dstr(d), rng.choice(['Programme', 'Finance', 'Supply', 'Partner', 'Country Team', 'Registry']),
                     rng.choice(['Programme', 'Finance', 'Supply', 'Partner', 'Registry', 'Management']), s])
    return rows


SUBJECTS = ['Transmission of draft implementation plan', 'Request for updated cash forecast', 'Reminder: quarterly report due',
            'Clarification on indicator definitions', 'Revised delivery schedule', 'Minutes of coordination meeting',
            'Bank account confirmation letter', 'Updated organogram received', 'Field visit schedule for Q3',
            'Comments on draft budget', 'Request for extension of reporting deadline', 'Communication plan draft',
            'Storage arrangements at district level', 'Invitation to programme review meeting', 'Revised targets after mid-year review',
            'Scan of signed documents for registry', 'Updated contact list', 'Training attendance sheets', 'Vehicle logbook summary',
            'Photographs from distribution (consent forms attached)']


def activities_rows(rng, acts, year=2026):
    rows = [['#', 'Activity', 'Q1', 'Q2', 'Q3', 'Q4', 'Responsible']]
    for i, a in enumerate(acts, 1):
        qs = ['x' if rng.random() < 0.6 else '' for _ in range(4)]
        if not any(qs):
            qs[rng.randint(0, 3)] = 'x'
        rows.append([str(i), a] + qs + [rng.choice(['Programme lead', 'M&E officer', 'Field coordinator', 'Supply officer', 'Finance officer'])])
    return rows


def indicators_rows(rng, inds):
    rows = [['Indicator', 'Baseline', 'Target', 'Means of verification']]
    for name, mov in inds:
        b = rng.randint(5, 60)
        rows.append([name, '%d%%' % b if '%' in name or 'Proportion' in name else str(b * rng.randint(3, 40)),
                     '%d%%' % min(95, b + rng.randint(10, 30)) if '%' in name or 'Proportion' in name else str(b * rng.randint(45, 90)), mov])
    return rows
