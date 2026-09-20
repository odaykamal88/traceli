import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync_runtime', Path(__file__).with_name('sync_runtime.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RuntimeEvidenceTest(unittest.TestCase):
    def test_minimizes_private_fields_and_preserves_outcome(self):
        state = {
            'tasks': [{'id': 44, 'status': 'doing', 'claim_until': '2026-09-15T08:00:00Z', 'detail': 'SENSITIVE_SENTINEL'}],
            'workReviews': [{'task_id': 26, 'status': 'pending', 'packet': 'SENSITIVE_SENTINEL'}],
            'leads': [{'email': 'SENSITIVE_SENTINEL'}],
            'receipts': [{'job_id': 'editorial-desk', 'occurred_at': '2026-09-15T06:36:56Z', 'outcome': 'Findings open', 'summary': 'SENSITIVE_SENTINEL', 'source_url': 'SENSITIVE_SENTINEL'}],
            'siwc_bypass_bearer_token': 'SENSITIVE_SENTINEL',
        }
        result = module.minimize(state, '2026-09-15T07:00:00+00:00')
        self.assertNotIn('SENSITIVE_SENTINEL', json.dumps(result))
        self.assertEqual(result['latest_receipts']['editorial-desk']['outcome'], 'Findings open')
        self.assertEqual(result['pending_review_task_ids'], [26])
        self.assertEqual(result['unexpired_claims'], 1)
        self.assertIsNone(result['latest_receipts']['execution-desk'])

    def test_enabled_does_not_invent_receipt_and_paused_stays_paused(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for ident, status in [('traceli-editorial-desk', 'ACTIVE'), ('traceli-execution-desk', 'PAUSED')]:
                target = root / ident / 'automation.toml'
                target.parent.mkdir()
                target.write_text(f'id="{ident}"\nstatus="{status}"\nkind="heartbeat"\nrrule="FREQ=WEEKLY;BYDAY=MO;BYHOUR=11;BYMINUTE=30"\nprompt="docs/hq/RUNTIME_HANDOFF.md SENSITIVE_SENTINEL"\n')
            result = module.snapshot(root, root, fetch=lambda: {'tasks': [],'workReviews': [],'receipts': []})
            rows = {s['id']:s for s in result['schedules']}
            self.assertEqual(rows['traceli-editorial-desk']['status'], 'ACTIVE')
            self.assertEqual(rows['traceli-execution-desk']['status'], 'PAUSED')
            self.assertIn('11:30', rows['traceli-editorial-desk']['cadence'])
            self.assertIsNone(result['room']['latest_receipts']['editorial-desk'])
            self.assertNotIn('SENSITIVE_SENTINEL', json.dumps(result))

    def test_auth_failure_keeps_old_timestamp_and_reports_unavailable(self):
        with tempfile.TemporaryDirectory() as folder:
            room = module.minimize({'tasks': [],'workReviews': [],'receipts': []},'2026-09-14T00:00:00Z')
            room.update(secret='SENSITIVE_SENTINEL',raw_customer='SENSITIVE_SENTINEL')
            room['latest_receipts']['editorial-desk']={'at':'2026-09-14T00:00:00Z','outcome':'Missing inputs','summary':'SENSITIVE_SENTINEL'}
            room['latest_receipts']['SENSITIVE_SENTINEL']={'at':'2026-09-14T00:00:00Z','outcome':'Missing inputs'}
            old = {'schema_version':1, 'room':room}
            def fail():
                raise RuntimeError('SENSITIVE_SENTINEL')
            result = module.snapshot(Path(folder),Path(folder),old,fetch=fail)
            self.assertEqual(result['connection'],'unavailable')
            self.assertEqual(result['room']['fetched_at'],old['room']['fetched_at'])
            self.assertNotIn('SENSITIVE_SENTINEL',json.dumps(result))
            self.assertTrue(all(s['status']=='UNKNOWN' for s in result['schedules']))

    def test_fractional_receipt_and_claim_time_order(self):
        result = module.minimize({'tasks':[{'status':'doing','claim_until':'2026-09-15T07:00:00.900000Z'}], 'workReviews':[], 'receipts':[
            {'job_id':'editorial-desk','occurred_at':'2026-09-15T07:00:00Z','outcome':'Missing inputs'},
            {'job_id':'editorial-desk','occurred_at':'2026-09-15T07:00:00.9Z','outcome':'Completed'}
        ]},'2026-09-15T07:00:00Z')
        self.assertEqual(result['unexpired_claims'],1)
        self.assertEqual(result['latest_receipts']['editorial-desk']['outcome'],'Completed')

    def test_expired_claims_are_not_running(self):
        result = module.minimize({'tasks':[{'status':'doing','claim_until':'2026-09-14T10:00:00Z'}],'workReviews':[],'receipts':[]},'2026-09-15T07:00:00Z')
        self.assertEqual(result['unexpired_claims'],0)

    def test_local_fixture_cannot_be_reported_as_private_room(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            hosting = root / 'internal-ops/.openai/hosting.json'
            hosting.parent.mkdir(parents=True)
            hosting.write_text(json.dumps({'project_id':module.PROJECT}))
            with patch.dict(module.os.environ, {'TRACELI_OPS_URL':'http://localhost:3000'}), patch.object(module.importlib.util,'spec_from_file_location') as loader:
                result = module.snapshot(root,root)
                self.assertEqual(result['connection'],'unavailable')
                loader.assert_not_called()

    def test_malformed_outbox_is_unconfirmed_without_breaking_refresh(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            outbox = root / 'internal-ops/outputs/ops-receipts'
            outbox.mkdir(parents=True)
            (outbox/'bad-shape.json').write_text('[]')
            (outbox/'invalid.json').write_text('{')
            result = module.snapshot(root,root,previous=[],fetch=lambda:{'tasks':[],'workReviews':[],'receipts':[]})
            self.assertEqual(result['connection'],'connected')
            self.assertEqual(result['pending_local_receipts'],2)


if __name__ == '__main__':
    unittest.main()
