"""Shared document furniture: cover memo, boilerplate, tables, annex filler."""
import datetime as dt
import fill


def cover(f, org_line, title, subtitle, kv, memo_to, memo_from, memo_date, memo_subject, memo_paras, cc=None):
    f.small(org_line)
    f.p(title, style=__import__('gt_lib').TITLE)
    f.p('<b>%s</b>' % subtitle.replace('&', '&amp;'), raw=True)
    f.kv(kv)
    f.p('INTERNAL MEMORANDUM', style=__import__('gt_lib').H2)
    rows = [('To', memo_to), ('From', memo_from), ('Date', memo_date), ('Subject', memo_subject)]
    if cc:
        rows.insert(2, ('Copy', cc))
    f.kv(rows, 0.16)
    for para in memo_paras:
        f.p(para)


def boiler(f, pools, n, rng=None):
    rng = rng or f.rng
    pool = []
    for p in pools:
        pool.extend(p)
    for t in fill.pick(rng, pool, n):
        f.p(t)


def acronyms(f, domain):
    rows = [['Abbreviation', 'Meaning']] + [list(x) for x in fill.ACRONYMS['common'] + fill.ACRONYMS[domain]]
    rows = [rows[0]] + sorted(rows[1:])
    f.table(rows, [0.25, 0.75])


def risks(f, n=8):
    rows = [['Risk', 'Rating', 'Mitigation']] + fill.pick(f.rng, fill.RISKS, n)
    f.table(rows, [0.5, 0.12, 0.38], zebra=True)


def corr(f, start, n=12):
    f.table(fill.correspondence(f.rng, start, fill.SUBJECTS, n), [0.17, 0.15, 0.15, 0.53], zebra=True)


def budget(f, lines, cur='US$'):
    rows, total = fill.budget_rows(f.rng, lines, cur)
    f.table(rows, [0.08, 0.42, 0.12, 0.08, 0.13, 0.17], zebra=True)
    f.small('Summary of the main cost lines only. Support costs, contingency and lines below the reporting threshold are carried in the detailed costing and are not shown here.')
    return total


def distribution(f, names_roles):
    f.table([['Copy', 'Name', 'Function']] + [[str(i + 1), n, r] for i, (n, r) in enumerate(names_roles)], [0.1, 0.4, 0.5])


def clauses(f, titles, rng=None):
    """Numbered agreement clauses built from generic text (used for draft agreements / ToR)."""
    rng = rng or f.rng
    bodies = [
        'The Parties agree that the activities shall be carried out in accordance with the approved implementation plan and budget attached to this Agreement, which form an integral part of it.',
        'Each Party shall designate a focal point responsible for communication under this Agreement. Changes of focal point shall be notified in writing within ten working days.',
        'Notices under this Agreement shall be in writing and delivered by hand, courier or electronic mail to the addresses stated in the particulars. A notice is effective on receipt.',
        'Neither Party shall be liable for failure to perform its obligations where such failure results from force majeure, provided that the affected Party notifies the other promptly and takes reasonable steps to mitigate.',
        'This Agreement may be terminated by either Party on thirty days written notice. On termination, unspent funds shall be returned and assets transferred as agreed in writing.',
        'Any dispute arising under this Agreement shall be settled amicably by negotiation. Failing settlement within sixty days, the dispute shall be referred to arbitration under the rules agreed by the Parties.',
        'The Recipient shall keep accurate and systematic accounts and records in respect of the activities for at least seven years after the end of the Agreement.',
        'Intellectual property in reports and materials produced under this Agreement shall vest as set out in the particulars. Each Party may use such materials for non-commercial purposes with appropriate attribution.',
        'The Recipient shall submit quarterly financial reports within thirty days of the end of each quarter and a final report within sixty days of completion.',
        'The Recipient shall not assign or transfer any of its rights or obligations under this Agreement without the prior written consent of the other Party.',
        'Nothing in this Agreement shall be construed as a waiver, express or implied, of any of the privileges and immunities of the United Nations or its subsidiary organs, where applicable.',
        'The Recipient shall ensure that its personnel comply with applicable national law and with the standards of conduct set out in the particulars.',
    ]
    picks = fill.pick(rng, bodies, len(titles))
    for i, (t, b) in enumerate(zip(titles, picks), 1):
        f.p('<b>Article %d \u2014 %s.</b> %s' % (i, t, b), raw=True)


MANUAL_TOPICS = ['Scope and definitions', 'Roles and responsibilities', 'Record keeping', 'Financial reporting', 'Programme monitoring',
                 'Asset management', 'Travel and allowances', 'Communication and visibility', 'Data protection', 'Audit and review',
                 'Closure of agreements', 'Amendments', 'Security management', 'Environmental safeguards', 'Complaints and feedback']


def manual_extract(f, pools, n_topics=6, per=2):
    """Numbered policy/manual clauses built from the neutral pools."""
    pool = []
    for p in pools:
        pool.extend(p)
    topics = fill.pick(f.rng, MANUAL_TOPICS, n_topics)
    for i, t in enumerate(topics, 1):
        f.h3('%d. %s' % (i, t))
        for j, para in enumerate(fill.pick(f.rng, pool, per), 1):
            f.p('%d.%d %s' % (i, j, para))


def asset_register(f, n=30, items=None):
    items = items or ['Laptop computer', 'Desktop printer', 'Motorcycle 125cc', 'Solar panel kit', 'Tablet for data collection', 'Office desk', 'Filing cabinet',
                      'Generator 5 kVA', 'Refrigerator (vaccine grade)', 'Projector', 'Satellite phone', 'Water tank 5,000 L']
    rows = [['Tag', 'Item', 'Location', 'Acquired', 'Condition']]
    for i in range(n):
        rows.append(['AS-%04d' % (1000 + i * 7), f.rng.choice(items), f.rng.choice(['Main office', 'District office', 'Field store', 'Mobile unit']),
                     fill.dstr(dt.date(2023, 1, 1) + dt.timedelta(days=f.rng.randint(0, 1000))), f.rng.choice(['Good', 'Good', 'Fair', 'Needs repair'])])
    f.table(rows, [0.13, 0.33, 0.2, 0.2, 0.14], zebra=True)


def training_log(f, n=24, topics=None):
    topics = topics or ['Financial reporting refresher', 'Data quality and reporting tools', 'Safeguarding induction', 'Stock management', 'Supportive supervision',
                        'Community engagement', 'First aid', 'Security awareness', 'Use of tablets for data collection']
    rows = [['Date', 'Topic', 'Participants', 'Facilitator', 'Venue']]
    for i in range(n):
        rows.append([fill.dstr(dt.date(2025, 1, 10) + dt.timedelta(days=i * 13 + f.rng.randint(0, 5))), f.rng.choice(topics), str(f.rng.randint(8, 40)),
                     fill.person(f.rng), f.rng.choice(['Main office', 'District hall', 'Health centre', 'Online'])])
    f.table(rows, [0.18, 0.34, 0.12, 0.2, 0.16], zebra=True)


def minutes(f, date, attendees, items):
    f.p('Meeting held on %s. Present: %s.' % (date, ', '.join(attendees)))
    for i, it in enumerate(items, 1):
        f.p('Item %d. %s' % (i, it))


GENERIC_ITEMS = ['The minutes of the previous meeting were adopted without amendment.', 'The finance officer presented the expenditure report for the quarter; the burn rate is in line with the plan.',
                 'The programme team reported on field activities and noted delays in two locations caused by road conditions.', 'The meeting reviewed the risk register and agreed to raise the rating for currency risk.',
                 'The M&E officer presented data quality findings from the last spot verification; corrective actions were agreed.', 'Any other business: the date of the next meeting was set for the last week of the quarter.',
                 'The supply officer reported stock levels at the central and district stores; no stock-outs were reported.', 'The communication plan for the next quarter was endorsed.']


OBS = ['Registers up to date; two entries lacked dates.', 'Stock card balances matched the physical count.', 'Community feedback box not opened for three weeks.',
       'Staff attendance sheets complete.', 'Visibility materials displayed as agreed.', 'Referral forms incomplete for two cases.', 'Water point functional; chlorination log missing for one week.',
       'Training attendance below target because of market day.', 'Store ventilation adequate; pallets in use.', 'Supervisor visited all sites planned for the month.']


def staff_roster(f, n=30):
    pos = ['Project Manager', 'Field Coordinator', 'Finance Officer', 'M&E Officer', 'Community Mobiliser', 'Driver', 'Logistics Assistant', 'Data Clerk', 'Nurse', 'Social Worker']
    rows = [['Name', 'Position', 'Duty station', 'Start date', '% charged']]
    for i in range(n):
        rows.append([fill.person(f.rng), f.rng.choice(pos), f.rng.choice(['Main office', 'District office A', 'District office B', 'Field base']),
                     fill.dstr(dt.date(2022, 1, 1) + dt.timedelta(days=f.rng.randint(0, 1400))), '%d%%' % f.rng.choice([20, 50, 50, 80, 100, 100])])
    f.table(rows, [0.26, 0.24, 0.2, 0.18, 0.12], zebra=True)


def monitoring_visits(f, n=14):
    rows = [['Date', 'Site', 'Visited by', 'Observation', 'Follow-up']]
    for i in range(n):
        rows.append([fill.dstr(dt.date(2025, 10, 1) + dt.timedelta(days=i * 9 + f.rng.randint(0, 4))), 'Site %02d' % f.rng.randint(1, 40), fill.person(f.rng),
                     f.rng.choice(OBS), f.rng.choice(['Closed', 'Open, due next visit', 'Closed', 'Referred to supervisor'])])
    f.table(rows, [0.16, 0.1, 0.2, 0.38, 0.16], zebra=True)


def monthly_report(f, pools, month):
    f.p('Reporting month: %s. This report summarises activities, outputs and issues for the month and is submitted with the monthly data set.' % month)
    boiler(f, pools, 3)
    rows = [['Output', 'Planned', 'Achieved', 'Comment']]
    for o in ['Sessions held', 'People reached', 'Supervision visits', 'Reports received on time', 'Stock reports submitted']:
        pl = f.rng.randint(20, 400)
        rows.append([o, str(pl), str(int(pl * f.rng.uniform(0.7, 1.1))), f.rng.choice(['On track', 'Slight delay', 'Above target', 'Road access issues'])])
    f.table(rows, [0.34, 0.16, 0.16, 0.34])


def bank_recon(f, cur='US$'):
    rows = [['Month', 'Opening balance', 'Receipts', 'Payments', 'Closing balance', 'Reconciled by']]
    bal = f.rng.randint(20000, 90000)
    for m in ['July', 'August', 'September', 'October', 'November', 'December']:
        r = f.rng.randint(0, 120000)
        pmt = min(bal + r, f.rng.randint(15000, 90000))
        rows.append([m + ' 2025', format(bal, ','), format(r, ','), format(pmt, ','), format(bal + r - pmt, ','), f.rng.choice(['Finance Officer', 'Accountant'])])
        bal = bal + r - pmt
    f.table(rows, [0.16, 0.18, 0.15, 0.15, 0.18, 0.18])
