import 'server-only'

import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { z } from 'zod'
import { getDatabasePool } from '@/lib/db/client'

const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/)
const principalSchema = z.object({
  organizationId: z.string().regex(/^org_[a-zA-Z0-9_-]+$/),
  actorId: identifier,
  mandateId: identifier,
  role: z.enum(['worker','supervisor','librarian']),
}).strict()
export type HQPrincipal = z.infer<typeof principalSchema>
const roleNames = {worker:'traceli_hq_worker',supervisor:'traceli_hq_supervisor',librarian:'traceli_hq_librarian'} as const
const evidenceRefs = z.array(z.string().min(1).max(1000)).min(1).max(100)
const submissionSchema = z.object({summary:z.string().min(1).max(4000),artifactRef:z.string().min(1).max(1000),artifactHash:z.string().regex(/^[a-f0-9]{64}$/),evidenceRefs}).strict()
const contractSchema=z.looseObject({
  id:identifier,objective:z.string().min(1),owner:identifier,charter_version:z.string().min(1),
  trigger:z.looseObject({type:z.string().min(1),reference:z.string().min(1),dedupe_key:z.string().min(1)}),
  inputs_context:evidenceRefs,allowed_tools:evidenceRefs,
  allowed_memory:z.object({read:evidenceRefs,write:evidenceRefs}),
  expected_output:z.looseObject({path:z.string().min(1),schema_ref:z.string().min(1),description:z.string().min(1)}),
  acceptance_criteria:evidenceRefs,reviewer:z.string().min(1),
  deadline_sla:z.looseObject({active_minutes:z.number().positive(),review_within_hours:z.number().positive()}),
  approval:z.looseObject({level:z.enum(['Green','Amber','Red'])}),
  dependencies:z.array(identifier),dependency_requirements:z.record(identifier,z.enum(['accepted','review'])).default({}),
  limits:z.looseObject({max_tool_calls:z.number().int().positive(),max_revisions:z.number().int().nonnegative()}),
  cost:z.looseObject({new_spend_limit:z.literal(0)}),
})

/** Server broker only. Resolve principal from authenticated host identity/grants.
 * Never accept this context from a model, request body, job contract or QM scope label.
 * No public route or agent tool exposes this factory. It is not an identity provider.
 */
export function createHQStore(trustedPrincipal: HQPrincipal, pool: Pool = getDatabasePool()) {
  const principal = principalSchema.parse(trustedPrincipal)
  function requireRole(role: HQPrincipal['role']) {
    if (principal.role !== role) throw new Error('HQ operation denied for this principal.')
  }
  async function transaction<T>(operation: (client: PoolClient)=>Promise<T>, leaseToken?: string) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('SET LOCAL ROLE '+roleNames[principal.role])
      await client.query("SELECT set_config('app.organization_id',$1,true),set_config('app.hq_actor_id',$2,true),set_config('app.hq_mandate_id',$3,true),set_config('app.hq_lease_token',$4,true)", [principal.organizationId,principal.actorId,principal.mandateId,leaseToken||''])
      await client.query("SET LOCAL statement_timeout='10s'")
      await client.query("SET LOCAL lock_timeout='2s'")
      const result=await operation(client)
      await client.query('COMMIT')
      return result
    } catch(error) {
      await client.query('ROLLBACK')
      throw error
    } finally { client.release() }
  }
  async function event(client: PoolClient, eventType:string, evidence:unknown, jobId:string|null=null) {
    await client.query('INSERT INTO hq_events(organization_id,id,mandate_id,job_id,actor_id,event_type,evidence) VALUES($1,$2,$3,$4,$5,$6,$7)',[principal.organizationId,randomUUID(),principal.mandateId,jobId,principal.actorId,eventType,JSON.stringify(evidence)])
  }
  return {
    async registerScope(input: unknown) {
      requireRole('supervisor')
      const p=z.object({id:identifier,kind:z.enum(['company','mandate','case']),mandateId:identifier.nullable(),name:z.string().min(1),definition:z.record(z.string(),z.unknown())}).strict().parse(input)
      return transaction(async c=>{
        const result=await c.query(`INSERT INTO hq_scopes(organization_id,id,kind,mandate_id,name,definition) VALUES($1,$2,$3,$4,$5,$6)
          ON CONFLICT(organization_id,id) DO NOTHING RETURNING *`,[principal.organizationId,p.id,p.kind,p.mandateId,p.name,JSON.stringify(p.definition)])
        if(result.rowCount) return result.rows[0]
        const existing=await c.query('SELECT * FROM hq_scopes WHERE organization_id=$1 AND id=$2 AND kind=$3 AND mandate_id IS NOT DISTINCT FROM $4 AND name=$5 AND definition=$6::jsonb',[principal.organizationId,p.id,p.kind,p.mandateId,p.name,JSON.stringify(p.definition)])
        if(!existing.rowCount) throw new Error('Scope ID already has a different definition.')
        return existing.rows[0]
      })
    },
    async enqueueJob(input: unknown) {
      requireRole('supervisor')
      const p=z.object({id:identifier,mandateId:identifier,objective:z.string().min(1).max(4000),contract:contractSchema,approvalLevel:z.enum(['Green','Amber','Red']),sourceSystem:z.enum(['hq','operating_room']).default('hq'),externalId:z.string().min(1).max(160).nullable().default(null)}).strict().parse(input)
      if(p.contract.id!==p.id||p.contract.owner!==p.mandateId||p.contract.objective!==p.objective||p.contract.approval.level!==p.approvalLevel||p.contract.dependencies.includes(p.id)) throw new Error('Job identity, authority or objective conflicts with its contract.')
      return transaction(async c=>{
        const values=[principal.organizationId,p.id,p.mandateId,p.objective,JSON.stringify(p.contract),p.approvalLevel,p.sourceSystem,p.externalId]
        const result=await c.query(`INSERT INTO hq_jobs(organization_id,id,mandate_id,objective,contract,approval_level,source_system,external_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(organization_id,id) DO NOTHING RETURNING *`,values)
        if(result.rowCount) { await event(c,'job_registered',{jobId:p.id},p.id); return result.rows[0] }
        const same=await c.query(`SELECT * FROM hq_jobs WHERE organization_id=$1 AND id=$2 AND mandate_id=$3 AND objective=$4 AND contract=$5::jsonb AND approval_level=$6 AND source_system=$7 AND external_id IS NOT DISTINCT FROM $8`,values)
        if(!same.rowCount) throw new Error('Job ID already has a different contract.')
        return same.rows[0]
      })
    },
    async claimJob(jobId: string, leaseSeconds=900) {
      requireRole('worker'); identifier.parse(jobId); z.number().int().min(1).max(2700).parse(leaseSeconds)
      return transaction(async c=>{
        const token=randomUUID(),runId=randomUUID()
        const result=await c.query(`UPDATE hq_jobs SET status='running',attempts=attempts+1,lease_token=$3,lease_until=clock_timestamp()+(LEAST($4::numeric,(contract->'deadline_sla'->>'active_minutes')::numeric*60)*interval '1 second'),worker_id=$5,updated_at=now()
          WHERE organization_id=$1 AND id=$2 AND source_system='hq' AND approval_level='Green' AND attempts<max_attempts AND (status='ready' OR (status='running' AND lease_until<=clock_timestamp()))
          AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(contract->'dependencies') dependency WHERE NOT EXISTS(
            SELECT 1 FROM hq_job_status s WHERE s.id=dependency.value AND (s.status='accepted' OR (s.status='review' AND contract->'dependency_requirements'->>dependency.value='review')))) RETURNING *`,[principal.organizationId,jobId,token,leaseSeconds,principal.actorId])
        if(!result.rowCount) return null
        const job=result.rows[0]
        // Keep the database's full timestamp precision when binding the run lease.
        await c.query(`INSERT INTO hq_runs(organization_id,id,job_id,mandate_id,attempt,worker_id,lease_token,lease_until,status)
          SELECT organization_id,$2,id,mandate_id,attempts,worker_id,lease_token,lease_until,'running' FROM hq_jobs WHERE organization_id=$1 AND id=$3`,[principal.organizationId,runId,jobId])
        await event(c,'job_claimed',{runId,attempt:job.attempts},jobId)
        return {job,runId,leaseToken:token}
      })
    },
    async submitJob(jobId: string, leaseToken: string, input: unknown) {
      requireRole('worker'); identifier.parse(jobId); z.string().uuid().parse(leaseToken)
      const result=submissionSchema.parse(input)
      return transaction(async c=>{
        const job=await c.query(`UPDATE hq_jobs SET status='review',lease_token=NULL,lease_until=NULL,result=$4,updated_at=now() WHERE organization_id=$1 AND id=$2 AND lease_token=$3 AND lease_until>clock_timestamp() AND status='running' RETURNING *`,[principal.organizationId,jobId,leaseToken,JSON.stringify(result)])
        if(!job.rowCount) throw new Error('Active matching job lease required.')
        const run=await c.query(`UPDATE hq_runs SET status='review',result=$3,finished_at=now() WHERE organization_id=$1 AND lease_token=$2 AND status='running' RETURNING id`,[principal.organizationId,leaseToken,JSON.stringify(result)])
        if(run.rowCount!==1) throw new Error('Matching run is unavailable.')
        await event(c,'output_submitted',{runId:run.rows[0].id,artifactHash:result.artifactHash},jobId)
        return job.rows[0]
      },leaseToken)
    },
    async acceptJob(jobId: string, reviewEvidence: string) {
      requireRole('supervisor');identifier.parse(jobId);z.string().min(1).max(8000).parse(reviewEvidence)
      return transaction(async c=>{
        const result=await c.query(`UPDATE hq_jobs SET status='accepted',reviewer_id=$3,review_evidence=$4,updated_at=now() WHERE organization_id=$1 AND id=$2 AND status='review' AND worker_id<>$3 RETURNING *`,[principal.organizationId,jobId,principal.actorId,reviewEvidence])
        if(!result.rowCount) throw new Error('Submitted output and independent reviewer required.')
        await event(c,'output_accepted',{reviewEvidence},jobId)
        return result.rows[0]
      })
    },
    async stopExpiredJob(jobId:string, reason:string) {
      requireRole('supervisor');identifier.parse(jobId);z.string().min(1).max(4000).parse(reason)
      return transaction(async c=>{
        const result=await c.query(`UPDATE hq_jobs SET status='failed',lease_token=NULL,lease_until=NULL,result=$3,updated_at=now() WHERE organization_id=$1 AND id=$2 AND status='running' AND lease_until<=clock_timestamp() RETURNING *`,[principal.organizationId,jobId,JSON.stringify({summary:reason,requiresReview:true})])
        if(!result.rowCount) throw new Error('No expired job is available to stop.')
        await event(c,'expired_job_stopped',{reason},jobId)
        return result.rows[0]
      })
    },
    async proposeMemory(input: unknown) {
      requireRole('worker')
      const p=z.object({id:identifier,scopeId:identifier,key:identifier,baseVersion:z.number().int().nonnegative(),content:z.string().min(1).max(50000),evidenceRefs,kind:z.enum(['fact','inference','hypothesis','decision','procedure']),jobId:identifier.nullable().default(null),classification:z.enum(['public','internal']).default('internal')}).strict().parse(input)
      return transaction(async c=>{
        const result=await c.query(`INSERT INTO hq_memory_proposals(organization_id,id,scope_id,memory_key,base_version,author_id,content,evidence_refs,knowledge_kind,job_id,classification) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,[principal.organizationId,p.id,p.scopeId,p.key,p.baseVersion,principal.actorId,p.content,JSON.stringify(p.evidenceRefs),p.kind,p.jobId,p.classification])
        await event(c,'memory_proposed',{proposalId:p.id,scopeId:p.scopeId,contentHash:result.rows[0].content_hash},p.jobId)
        return result.rows[0]
      })
    },
    async reviewMemory(proposalId: string, expectedHash:string, decision:'approved'|'rejected', rationale:string) {
      requireRole('supervisor');identifier.parse(proposalId);z.string().regex(/^[a-f0-9]{64}$/).parse(expectedHash);z.enum(['approved','rejected']).parse(decision);z.string().min(1).max(8000).parse(rationale)
      return transaction(async c=>{
        const result=await c.query(`INSERT INTO hq_memory_reviews(organization_id,id,proposal_id,reviewer_id,decision,content_hash,rationale) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[principal.organizationId,randomUUID(),proposalId,principal.actorId,decision,expectedHash,rationale])
        await event(c,'memory_reviewed',{proposalId,decision,reviewId:result.rows[0].id})
        return result.rows[0]
      })
    },
    async promoteMemory(proposalId:string, reviewId:string) {
      requireRole('librarian');identifier.parse(proposalId);identifier.parse(reviewId)
      return transaction(async c=>{
        const result=await c.query(`INSERT INTO hq_memory_versions(organization_id,scope_id,memory_key,version,proposal_id,review_id,promoted_by,content)
          SELECT organization_id,scope_id,memory_key,base_version+1,id,$3,$4,content FROM hq_memory_proposals WHERE organization_id=$1 AND id=$2 RETURNING *`,[principal.organizationId,proposalId,reviewId,principal.actorId])
        if(!result.rowCount) throw new Error('Approved memory proposal unavailable.')
        await event(c,'memory_promoted',{proposalId,reviewId,version:result.rows[0].version,contentHash:result.rows[0].content_hash})
        return result.rows[0]
      })
    },
    async readMemory(scopeId:string) {
      identifier.parse(scopeId)
      return transaction(async c=>(await c.query(`SELECT DISTINCT ON(memory_key) * FROM hq_memory_versions WHERE organization_id=$1 AND scope_id=$2 ORDER BY memory_key,version DESC`,[principal.organizationId,scopeId])).rows)
    },
    async recordDecision(input:unknown) {
      requireRole('supervisor')
      const p=z.object({id:identifier,approvalLevel:z.enum(['Green','Amber','Red']),decision:z.string().min(1).max(8000),rationale:z.string().min(1).max(8000),evidenceRefs,supersedesId:identifier.nullable().default(null)}).strict().parse(input)
      return transaction(async c=>{
        const result=await c.query(`INSERT INTO hq_decision_ledger(organization_id,id,actor_id,approval_level,decision,rationale,evidence_refs,supersedes_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[principal.organizationId,p.id,principal.actorId,p.approvalLevel,p.decision,p.rationale,JSON.stringify(p.evidenceRefs),p.supersedesId])
        await event(c,'decision_recorded',{decisionId:p.id,executionAuthorized:false})
        return result.rows[0]
      })
    },
    async listJobs() { return transaction(async c=>(await c.query('SELECT organization_id,id,mandate_id,objective,status,attempts,max_attempts,approval_level,source_system,worker_id,result,reviewer_id,review_evidence,created_at,updated_at FROM hq_jobs ORDER BY created_at,id')).rows) },
  }
}
