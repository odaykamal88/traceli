"""Offline integrity checks for M02 design fixtures; not an ingestion validator."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def unique_keys(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError('Duplicate JSON key: ' + key)
        value[key] = item
    return value


def verify():
    packet = json.loads((ROOT / 'EXAMPLES_V0_1.json').read_text(), object_pairs_hook=unique_keys)
    examples = packet['examples']
    assert len(examples) == 3
    assert {e['lane'] for e in examples} == {'U', 'M', 'G'}
    expected = {'U': ('unknown', 'needs_evidence', 'request_evidence'),
                'M': ('satisfied', 'ready_for_review', 'accept_assessment'),
                'G': ('conflict', 'needs_rule_review', 'request_rule_review')}
    for e in examples:
        assert e['fixture_only'] and e['classification'] == 'synthetic'
        assert e['organization_id'] == 'org_fictional_contract'
        assert e['record_state'] == 'draft'
        source_ids = {s['id'] for s in e['source_versions']}
        assert len(source_ids) == len(e['source_versions'])
        for s in e['source_versions']:
            path = (ROOT / s['storage_ref']).resolve()
            assert path.is_relative_to(ROOT / 'fixtures')
            assert sha256(path.read_bytes()) == s['byte_hash']
            assert s['byte_verification_status'] == 'verified_fixture_bytes'
            assert s['official_origin_ref'] is None and s['record_state'] == 'draft'
            for name in ('published', 'effective', 'repealed'):
                d = s[name]
                assert (d['value'] is None) == (d['precision'] == 'unknown')
                if d['value'] is None:
                    assert d['unknown_reason']
        snapshot = e['evidence_snapshot']
        hashed = {k: v for k, v in snapshot.items() if k != 'snapshot_hash'}
        digest = sha256(json.dumps(hashed, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode())
        assert digest == snapshot['snapshot_hash']
        assert set(snapshot['source_version_ids']) == source_ids
        assert snapshot['source_version_hashes'] == {s['id']: s['byte_hash'] for s in e['source_versions']}
        assert set(e['profile']['source_version_ids']) == source_ids
        assert set(e['case']['source_version_ids']) == source_ids
        assert e['obligation']['source_version_id'] in source_ids
        assert e['constraint']['obligation_ids'] == [e['obligation']['id']]
        assert e['constraint']['policy_pack_id'] == e['policy_pack']['id']
        assert e['policy_pack']['constraint_ids'] == [e['constraint']['id']]
        unit = e['unit']
        assert unit['case_id'] == snapshot['case_id'] == e['case']['id']
        assert unit['procurement_id'] == snapshot['procurement_id'] == e['case']['procurement_id']
        assert unit['evidence_snapshot_id'] == snapshot['id']
        assert unit['obligation_id'] == e['obligation']['id']
        assert unit['profile_id'] == e['profile']['id'] == e['applicability']['profile_id']
        assert unit['policy_pack_id'] == e['policy_pack']['id']
        assert unit['constraint_ids'] == [e['constraint']['id']]
        assert not unit['benchmark_eligible'] and unit['exclusion_reason']
        for name in ('evaluation', 'policy_assessment', 'human_disposition', 'outcome'):
            assert e[name]['unit_id'] == unit['id']
        assert e['policy_assessment']['evaluation_ids'] == [e['evaluation']['id']]
        assert e['human_disposition']['assessment_id'] == e['policy_assessment']['id']
        assert e['evaluation']['input_snapshot_hash'] == e['human_disposition']['input_snapshot_hash'] == digest
        assert e['evaluation']['provider_calls'] == 0 and e['evaluation']['provider'] is None
        assert e['evaluation']['normalized_model_result'] is None
        assert e['policy_assessment']['simulated'] and not e['policy_assessment']['real_decision_eligible']
        assert e['human_disposition']['simulated'] and not e['human_disposition']['actual_approval']
        assert (e['policy_assessment']['outcome'], e['policy_assessment']['proposed_disposition'], e['human_disposition']['decision']) == expected[e['lane']]
        assert e['outcome']['quality'] == 'unknown' and e['outcome']['value'] is None
        assert e['publication']['case_id'] == e['case']['id']
        assert e['publication']['unit_ids'] == [unit['id']]
        assert not e['publication']['approved'] and e['publication']['public_url'] is None
        if e['lane'] == 'U':
            assert snapshot['missing_items'] and e['applicability']['result'] == 'applicable'
        if e['lane'] == 'M':
            assert not snapshot['missing_items'] and e['applicability']['result'] == 'applicable'
        if e['lane'] == 'G':
            assert len(source_ids) == 2 and e['applicability']['result'] == 'conflict'
            assert any(s['effective']['value'] is None for s in e['source_versions'])
    return {'result': 'pass', 'examples': 3, 'fixture_source_files': 4,
            'checked': ['duplicate JSON keys', 'source byte hashes', 'snapshot hashes', 'unknown source date representation',
                        'same-case/procurement links', 'source/obligation/constraint/profile references',
                        'U/M/G expected states', 'synthetic-only decisions', 'no provider calls or publication',
                        'benchmark exclusion and unknown outcomes'],
            'limits': 'Integrity checks for compact design examples only; not a production schema, authorization test, legal review or benchmark.'}


if __name__ == '__main__':
    print(json.dumps(verify(), indent=2))
