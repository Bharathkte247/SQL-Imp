-- Agent categorization: ASYNC / SYNC / LEAD
-- Cutover date: 2026-06-17
--   Before cutover: map named agents to ASYNC or SYNC; everyone else is LEAD
--   On/after cutover: map named leads to LEAD; everyone else is SYNC
-- Drop this expression into a SELECT list (alias as needed).

CASE
    WHEN date < '2026-06-17' THEN
        CASE
            WHEN `agent` IN (
                'siriuscanada-nemo-user-ravi.balleda',
                'siriuscanada-nemo-user-ravula.anil',
                'siriuscanada-nemo-user-r.alampally',
                'siriuscanada-nemo-user-mohds',
                'siriuscanada-nemo-user-deepak.kothvala',
                'siriuscanada-nemo-user-n.begum',
                'siriuscanada-nemo-user-mitra.subhasis',
                'siriuscanada-nemo-user-vadiyala.rakesh',
                'siriuscanada-nemo-user-vinukonda.nandini',
                'siriuscanada-nemo-user-s.kachavarapu',
                'siriuscanada-nemo-user-vishnu.p',
                'siriuscanada-nemo-user-geer.chan',
                'siriuscanada-nemo-user-m.saikumar',
                'siriuscanada-nemo-user-rebally.anusha'
            ) THEN 'ASYNC'
            WHEN `agent` IN (
                'siriuscanada-nemo-user-boranchi.monika',
                'siriuscanada-nemo-user-vaddepally.mahender',
                'siriuscanada-nemo-user-a.srilekha',
                'siriuscanada-nemo-user-b.amar',
                'siriuscanada-nemo-user-b.ananthula',
                'siriuscanada-nemo-user-f.fatima',
                'siriuscanada-nemo-user-d.bhavani',
                'siriuscanada-nemo-user-mohammed.jabair',
                'siriuscanada-nemo-user-s.ikram',
                'siriuscanada-nemo-user-s.afreen',
                'siriuscanada-nemo-user-chepurisatish.c',
                'siriuscanada-nemo-user-p.manohar',
                'siriuscanada-nemo-user-sadiasultana.s',
                'siriuscanada-nemo-user-p.tharun',
                'siriuscanada-nemo-user-p.diwakar',
                'siriuscanada-nemo-user-kondoju.dhanalaxmi',
                'siriuscanada-nemo-user-chityala.rajavardhan',
                'siriuscanada-nemo-user-bandirajula.ashwini',
                'siriuscanada-nemo-user-klavanya.kl',
                'siriuscanada-nemo-user-a.naseer',
                'siriuscanada-nemo-user-s.abdullah',
                'siriuscanada-nemo-user-mohammed.adnaan',
                'siriuscanada-nemo-user-moha.muqe',
                'siriuscanada-nemo-user-n.paramagalla',
                'siriuscanada-nemo-user-malik.faisal',
                'siriuscanada-nemo-user-rekha.nuchhu',
                'siriuscanada-nemo-user-gangaramuday.kumar'
            ) THEN 'SYNC'
            ELSE 'LEAD'
        END
    ELSE
        CASE
            WHEN `agent` IN (
                'siriuscanada-nemo-user-noc_lead@siriuscanada',
                'siriuscanada-nemo-user-vivekanandgoud_sup',
                'siriuscanada-nemo-user-srinivas',
                'siriuscanada-nemo-user-emil.lead',
                'siriuscanada-nemo-user-p.mahesh@siriuscanada',
                'siriuscanada-nemo-user-sre_lead',
                'siriuscanada-nemo-user-gary.laranja',
                'siriuscanada-nemo-user-charles.s',
                'siriuscanada-nemo-user-bllla_lead',
                'siriuscanada-nemo-user-ram.nikhil',
                'siriuscanada-nemo-user-renuka_kandukuri',
                'siriuscanada-nemo-user-navyajaiswal',
                'siriuscanada-nemo-user-thundla.suresh',
                'siriuscanada-nemo-user-lead02',
                'siriuscanada-nemo-user-jupelli.j',
                'siriuscanada-nemo-user-lijesh.lead'
            ) THEN 'LEAD'
            ELSE 'SYNC'
        END
END AS agent_category
