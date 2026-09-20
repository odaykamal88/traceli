"""Export minimal HQ status. Reads schedules and the existing private Operating Room.

No scheduling, task mutation, publication, message or approval action is available.
Use TRACELI_OPS_TOKEN only in the current process, following EXECUTION_PROTOCOL.md.
"""
import argparse
import datetime as dt
import importlib.util
import json
import os
from pathlib import Path
import sys
import tomllib
import uuid

SITE = 'https://traceli-operating-room.odeyqemal.chatgpt.site'
PROJECT = 'appgprj_6a94833e5918819180fb17a031f5711e'
JOBS = {
    'traceli-execution-desk': ('execution-desk', 'Supervisor / Product Steward / Builder', 'Weekdays, 10:00 and 16:00'),
    'traceli-editorial-desk': ('editorial-desk', 'Editor / Investigator', 'Weekdays, 09:00'),
    'clausewise-funding-watch': ('funding-watch', 'Scout', 'Mondays, 09:00'),
    'traceli-customer-learning-review': ('customer-learning', 'Listener', 'Fridays, 16:30'),
    'traceli-security-posture-review': ('security-posture', 'Auditor', 'Fridays, 15:00'),
    'traceli-learning-loop-readiness': ('learning-readiness', 'Librarian / Supervisor', 'Fridays, 17:15'),
}
OUTCOMES = {'Completed', 'Passed', 'Failed', 'Missing inputs', 'Findings open', 'Gate unmet'}
STATES = {'todo', 'doing', 'blocked', 'done', 'review'}
RECEIPT_JOBS = [v[0] for v in JOBS.values()] + ['production-smoke', 'change-assurance', 'dependency-updates']


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')


def timestamp(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
        return parsed.astimezone(dt.timezone.utc).isoformat().replace('+00:00', 'Z') if parsed.tzinfo else None
    except ValueError:
        return None


def receipt(row):
    at = timestamp(row.get('occurred_at'))
    outcome = row.get('outcome')
    return {'at': at, 'outcome': outcome} if at and outcome in OUTCOMES else None


def instant(value):
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))


def cached_room(value):
    """Re-minimize cached evidence so failure never preserves unexpected fields."""
    if not isinstance(value, dict) or not timestamp(value.get('fetched_at')):
        return None
    count_fields = ('task_count', 'pending_reviews', 'unexpired_claims', 'receipt_count')
    if not all(type(value.get(k)) is int and value[k] >= 0 for k in count_fields):
        return None
    by_status = value.get('tasks_by_status', {})
    latest = value.get('latest_receipts', {})
    task_ids = value.get('pending_review_task_ids', [])
    if not isinstance(by_status, dict) or not isinstance(latest, dict) or not isinstance(task_ids, list):
        return None
    clean = {k: value[k] for k in count_fields}
    clean.update(fetched_at=timestamp(value['fetched_at']),
                 tasks_by_status={s: by_status[s] for s in STATES if type(by_status.get(s)) is int and by_status[s] >= 0},
                 pending_review_task_ids=sorted({i for i in task_ids if type(i) is int and i > 0}),
                 latest_receipts={})
    for job in RECEIPT_JOBS:
        row = latest.get(job)
        clean['latest_receipts'][job] = receipt({'occurred_at': row.get('at'), 'outcome': row.get('outcome')}) if isinstance(row, dict) else None
    return clean


def minimize(state, checked_at):
    """Never export lead records, task bodies, review packets, receipt text or tokens."""
    tasks, reviews, receipts = (state[k] for k in ('tasks', 'workReviews', 'receipts'))
    if not all(isinstance(x, list) for x in (tasks, reviews, receipts)):
        raise ValueError('Invalid Operating Room response')
    latest = {}
    for job_id in RECEIPT_JOBS:
        candidates = [clean for r in receipts if r.get('job_id') == job_id and (clean := receipt(r))]
        latest[job_id] = max(candidates, key=lambda r: instant(r['at']), default=None)
    return {
        'fetched_at': checked_at,
        'task_count': len(tasks),
        'tasks_by_status': {s: sum(t.get('status') == s for t in tasks) for s in sorted(STATES)},
        'pending_reviews': sum(r.get('status') == 'pending' for r in reviews),
        'pending_review_task_ids': sorted({r['task_id'] for r in reviews if r.get('status') == 'pending' and type(r.get('task_id')) is int}),
        'unexpired_claims': sum(t.get('status') == 'doing' and bool(timestamp(t.get('claim_until'))) and instant(timestamp(t['claim_until'])) > instant(checked_at) for t in tasks),
        'receipt_count': len(receipts),
        'latest_receipts': latest,
    }


def schedules(automation_root):
    rows = []
    for ident, (job_id, mandate, cadence) in JOBS.items():
        row = {'id': ident, 'job_id': job_id, 'mandate': mandate, 'cadence': cadence + ' · local schedule time', 'status': 'UNKNOWN', 'name': job_id.replace('-', ' ').title(), 'kind': 'unknown', 'hq_handoff_configured': False}
        try:
            config = tomllib.loads((automation_root / ident / 'automation.toml').read_text())
            if config.get('id') != ident:
                raise ValueError('Unexpected automation identity')
            row.update(status=config['status'] if config.get('status') in ('ACTIVE', 'PAUSED') else 'UNKNOWN', kind=config['kind'] if config.get('kind') in ('heartbeat', 'cron') else 'unknown')
            row['hq_handoff_configured'] = 'docs/hq/RUNTIME_HANDOFF.md' in config.get('prompt', '')
            # Render the actual limited recurrence format, never an assumed default.
            parts = dict(p.split('=', 1) for p in config.get('rrule', '').removeprefix('RRULE:').split(';') if '=' in p)
            weekdays = {'MO': 'Mon', 'TU': 'Tue', 'WE': 'Wed', 'TH': 'Thu', 'FR': 'Fri', 'SA': 'Sat', 'SU': 'Sun'}
            if parts.get('FREQ') == 'WEEKLY' and all(d in weekdays for d in parts.get('BYDAY', '').split(',')):
                days = ', '.join(weekdays[d] for d in parts['BYDAY'].split(','))
                hours = [int(h) for h in parts['BYHOUR'].split(',')]
                minute = int(parts['BYMINUTE'])
                if not all(0 <= h < 24 for h in hours) or not 0 <= minute < 60 or any(k in parts for k in ('UNTIL','COUNT','BYSETPOS')) or parts.get('INTERVAL','1') != '1':
                    raise ValueError('Unsupported cadence')
                row['cadence'] = days + ' · ' + ', '.join(f'{h:02d}:{minute:02d}' for h in hours) + ' local schedule time'
            else:
                row['cadence'] = 'See Scheduled for the current cadence'
        except (OSError, ValueError, KeyError, TypeError):
            row['cadence'] = 'Schedule details unavailable; inspect Scheduled'
        rows.append(row)
    return rows


def snapshot(workspace, automation_root, previous=None, fetch=None):
    checked_at = now()
    result = {'schema_version': 1, 'checked_at': checked_at, 'site_url': SITE, 'schedules': schedules(automation_root), 'connection': 'unavailable', 'room': None, 'pending_local_receipts': 0}
    # Only retain the minimized previous room, never an arbitrary input object.
    if isinstance(previous, dict) and previous.get('schema_version') == 1:
        result['room'] = cached_room(previous.get('room'))
    try:
        if fetch is None:
            if os.environ.get('TRACELI_OPS_URL', SITE).rstrip('/') != SITE:
                raise ValueError('HQ evidence must come from the bound private site')
            hosting = json.loads((workspace / 'internal-ops/.openai/hosting.json').read_text())
            if hosting.get('project_id') != PROJECT:
                raise ValueError('Unexpected site binding')
            spec = importlib.util.spec_from_file_location('traceli_ops', workspace / 'internal-ops/scripts/ops.py')
            ops = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(ops)
            fetch = ops.request
        result['room'] = minimize(fetch(), checked_at)
        result['connection'] = 'connected'
    except Exception:
        # Do not persist response bodies or transport/authentication errors.
        result['connection'] = 'unavailable'
    for file in (workspace / 'internal-ops/outputs/ops-receipts').glob('*.json'):
        try:
            item = json.loads(file.read_text())
            result['pending_local_receipts'] += not isinstance(item, dict) or item.get('delivery') != 'confirmed'
        except (OSError, ValueError):
            result['pending_local_receipts'] += 1
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    output = args.output or args.workspace / 'internal-ops/outputs/hq/runtime-status.json'
    automation_root = Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex'))) / 'automations'
    previous = None
    if output.exists():
        try:
            previous = json.loads(output.read_text())
        except ValueError:
            pass
    result = snapshot(args.workspace, automation_root, previous)
    output.parent.mkdir(parents=True, exist_ok=True)
    tmp = output.with_name(output.name + '.' + uuid.uuid4().hex + '.tmp')
    tmp.write_text(json.dumps(result, indent=2) + '\n')
    tmp.replace(output)
    print(json.dumps({'connection': result['connection'], 'enabled_schedules': sum(s['status']=='ACTIVE' for s in result['schedules']), 'checked_at': result['checked_at']}))
    return 0 if result['connection'] == 'connected' else 1


if __name__ == '__main__':
    sys.exit(main())
