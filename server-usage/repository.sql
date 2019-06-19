select e.created_at as "Date", u.luid as "UserId", s.luid as "SiteId",
	v.luid as "ViewId", v.name as "ViewName", 'Recent Activity' as "Type",
	null as "comment", cast(null as uuid) as "commentUserId", null as "commentUsername",
	cast(null as uuid) as "peerUserId", null as "peerUser", cast(null as int) as "peerViewCount"
from historical_events as e,
	historical_event_types as t,
	hist_users as hu,
	users as u,
	hist_sites as hs,
	sites as s,
	hist_views hv,
	"views" as v 
where e.historical_event_type_id=t.type_id
	and t."name"='Access View' and e.hist_actor_user_id =hu.id and e.hist_actor_site_id=hs.id
	and hs.site_id=s.id and hu.user_id=u.id 
	and v.id=hv.view_id and hv.id=e.hist_view_id

union all

select c.created_at, u3.luid, s.luid,
	v.luid, v.name, 'Comments',
	c."comment", u2.luid, u.name,
	null, null, null
from "_comments" c
	inner join "_users" u on c.user_id=u.id
	inner join "users" u2 on u.id=u2.id
	inner join "sites" s on s.id=c.site_id
	inner join "views" v on v.id=commentable_id
	cross join "users" u3
where length(c."comment")>0 and c.commentable_type='View'
	
union all

select null as "date", u1.luid as "UserId", s.luid as "SiteId",
	v.luid, v.name, 'Peer Activity' as "type",
	null, null, null,
	u2.luid, hu.name, a.count
from "_users" u,
	"users" u1,
	"group_users" gu1,
	"group_users" gu2,
	"users" u2,
	"sites" s,
	"views" v,
	hist_views hv,
	hist_users hu,
	hist_sites hs,
	(
		select e.hist_actor_user_id as "user_id", e.hist_actor_site_id as "site_id", 
			e.hist_view_id as "view_id", e.hist_project_id as "project_id", count(*) as "count"
		from historical_events as e,
			historical_event_types as t 
		where e.historical_event_type_id=t.type_id
			and t."name"='Access View' and e.hist_actor_user_id is not null
		group by e.hist_actor_user_id, e.hist_actor_site_id, e.hist_view_id, e.hist_project_id
	) a
where u.id=u1.id and u1.id=gu1.user_id and u1.site_id=s.id
	and gu1.group_id=gu2.group_id 
	and gu2.user_id=u2.id and u1.id!=u2.id
	and u2.id=hu.user_id and u2.site_id=hs.site_id
	and hu.id=a.user_id and hs.id=a.site_id
	and hv.view_id=v.id and hv.id=a.view_id