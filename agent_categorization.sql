-- Agent categorization: ASYNC / SYNC / LEAD
-- Cutover: 2026-06-17 (compare as Date so DateTime values on the cutover day
-- stay in the post-cutover branch).
--
-- Before cutover: named ASYNC / SYNC agents; everyone else -> LEAD
-- On/after cutover: named leads -> LEAD; everyone else -> SYNC
--   (no ASYNC category after cutover, by design)
--
-- Requires columns: `date`, `agent`
-- Engine notes: toDate() is ClickHouse; for BigQuery use DATE(`date`) < DATE '2026-06-17'

CASE
    WHEN toDate(`date`) < toDate('2026-06-17') THEN
        CASE
            WHEN `agent` IN (
                'siriuscanada-nemo-user-deepak.kothvala',
                'siriuscanada-nemo-user-geer.chan',
                'siriuscanada-nemo-user-m.saikumar',
                'siriuscanada-nemo-user-mitra.subhasis',
                'siriuscanada-nemo-user-mohds',
                'siriuscanada-nemo-user-n.begum',
                'siriuscanada-nemo-user-r.alampally',
                'siriuscanada-nemo-user-ravi.balleda',
                'siriuscanada-nemo-user-ravula.anil',
                'siriuscanada-nemo-user-rebally.anusha',
                'siriuscanada-nemo-user-s.kachavarapu',
                'siriuscanada-nemo-user-vadiyala.rakesh',
                'siriuscanada-nemo-user-vinukonda.nandini',
                'siriuscanada-nemo-user-vishnu.p'
            ) THEN 'ASYNC'
            WHEN `agent` IN (
                'siriuscanada-nemo-user-a.naseer',
                'siriuscanada-nemo-user-a.srilekha',
                'siriuscanada-nemo-user-b.amar',
                'siriuscanada-nemo-user-b.ananthula',
                'siriuscanada-nemo-user-bandirajula.ashwini',
                'siriuscanada-nemo-user-boranchi.monika',
                'siriuscanada-nemo-user-chepurisatish.c',
                'siriuscanada-nemo-user-chityala.rajavardhan',
                'siriuscanada-nemo-user-d.bhavani',
                'siriuscanada-nemo-user-f.fatima',
                'siriuscanada-nemo-user-gangaramuday.kumar',
                'siriuscanada-nemo-user-klavanya.kl',
                'siriuscanada-nemo-user-kondoju.dhanalaxmi',
                'siriuscanada-nemo-user-malik.faisal',
                'siriuscanada-nemo-user-moha.muqe',
                'siriuscanada-nemo-user-mohammed.adnaan',
                'siriuscanada-nemo-user-mohammed.jabair',
                'siriuscanada-nemo-user-n.paramagalla',
                'siriuscanada-nemo-user-p.diwakar',
                'siriuscanada-nemo-user-p.manohar',
                'siriuscanada-nemo-user-p.tharun',
                'siriuscanada-nemo-user-rekha.nuchhu',
                'siriuscanada-nemo-user-s.abdullah',
                'siriuscanada-nemo-user-s.afreen',
                'siriuscanada-nemo-user-s.ikram',
                'siriuscanada-nemo-user-sadiasultana.s',
                'siriuscanada-nemo-user-vaddepally.mahender'
            ) THEN 'SYNC'
            ELSE 'LEAD'
        END
    WHEN `agent` IN (
        'siriuscanada-nemo-user-bllla_lead',
        'siriuscanada-nemo-user-charles.s',
        'siriuscanada-nemo-user-emil.lead',
        'siriuscanada-nemo-user-gary.laranja',
        'siriuscanada-nemo-user-jupelli.j',
        'siriuscanada-nemo-user-lead02',
        'siriuscanada-nemo-user-lijesh.lead',
        'siriuscanada-nemo-user-navyajaiswal',
        'siriuscanada-nemo-user-noc_lead@siriuscanada',
        'siriuscanada-nemo-user-p.mahesh@siriuscanada',
        'siriuscanada-nemo-user-ram.nikhil',
        'siriuscanada-nemo-user-renuka_kandukuri',
        'siriuscanada-nemo-user-sre_lead',
        'siriuscanada-nemo-user-srinivas',
        'siriuscanada-nemo-user-thundla.suresh',
        'siriuscanada-nemo-user-vivekanandgoud_sup'
    ) THEN 'LEAD'
    ELSE 'SYNC'
END AS agent_category
