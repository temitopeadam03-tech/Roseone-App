-- RoseOne RLS hardening. Apply after 202611030001_roseone_social_backend.sql.
-- Closes self-enrolment privilege escalation in conversation/community memberships.

-- A user cannot add themselves to an existing private conversation. Only its creator
-- can add members; the creator may add themselves as owner and others as members.
drop policy if exists conversation_members_insert on public.roseone_conversation_members;
create policy conversation_members_insert
on public.roseone_conversation_members
for insert
with check (
  exists (
    select 1 from public.roseone_conversations c
    where c.id = conversation_id
      and c.created_by = auth.uid()
      and (
        (user_id = auth.uid() and role = 'owner')
        or (user_id <> auth.uid() and role = 'member')
      )
  )
);

-- Community creators receive owner membership via a trusted trigger; ordinary users
-- can only join public communities as members. Private/hidden membership requires
-- an existing community admin to invite/approve them.
drop policy if exists community_members_join on public.roseone_community_members;
create policy community_members_join
on public.roseone_community_members
for insert
with check (
  auth.uid() = user_id
  and role = 'member'
  and status = 'active'
  and exists (
    select 1 from public.roseone_communities c
    where c.id = community_id and c.visibility = 'public'
  )
);

create or replace function public.roseone_add_community_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.roseone_community_members (community_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active')
  on conflict (community_id, user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists roseone_community_owner_membership on public.roseone_communities;
create trigger roseone_community_owner_membership
after insert on public.roseone_communities
for each row execute procedure public.roseone_add_community_owner();

-- Members/admins can approve invitations, but users cannot promote themselves or
-- change their own role/status. Owners/admins are the only actors allowed to update.
drop policy if exists community_members_admin_update on public.roseone_community_members;
create policy community_members_admin_update
on public.roseone_community_members
for update
using (public.roseone_is_community_admin(community_id))
with check (public.roseone_is_community_admin(community_id));

-- A conversation creator can add/remove members and manage membership roles;
-- members may update only their own last_read_at through the application RPC layer.
drop policy if exists conversation_members_update on public.roseone_conversation_members;
create policy conversation_members_update
on public.roseone_conversation_members
for update
using (
  exists (select 1 from public.roseone_conversations c where c.id = conversation_id and c.created_by = auth.uid())
)
with check (
  exists (select 1 from public.roseone_conversations c where c.id = conversation_id and c.created_by = auth.uid())
);

-- Avoid unrestricted public reads of reshare/comment interaction metadata.
drop policy if exists post_reshares_read on public.roseone_post_reshares;
create policy post_reshares_read
on public.roseone_post_reshares
for select
using (
  exists (
    select 1 from public.roseone_posts p
    where p.id = post_id and (p.visibility = 'public' or p.author_id = auth.uid())
  )
);

-- Story audience is explicit. Followers-only stories require an accepted follow edge.
drop policy if exists stories_read on public.roseone_stories;
create policy stories_read
on public.roseone_stories
for select
using (
  expires_at > now()
  and (
    author_id = auth.uid()
    or audience = 'everyone'
    or (audience = 'followers' and exists (
      select 1 from public.roseone_follows f
      where f.follower_id = auth.uid() and f.following_id = author_id and f.status = 'accepted'
    ))
  )
);

-- Story views/reactions/comments must follow the story's actual visibility.
drop policy if exists story_views_self on public.roseone_story_views;
create policy story_views_self
on public.roseone_story_views
for insert
with check (
  auth.uid() = viewer_id
  and exists (
    select 1 from public.roseone_stories s
    where s.id = story_id and s.expires_at > now()
      and (s.author_id = auth.uid() or s.audience = 'everyone'
        or (s.audience = 'followers' and exists (
          select 1 from public.roseone_follows f
          where f.follower_id = auth.uid() and f.following_id = s.author_id and f.status = 'accepted'
        )))
  )
);
drop policy if exists story_reactions_read on public.roseone_story_reactions;
create policy story_reactions_read
on public.roseone_story_reactions
for select
using (exists (select 1 from public.roseone_stories s where s.id = story_id and s.expires_at > now() and (s.author_id = auth.uid() or s.audience = 'everyone' or (s.audience = 'followers' and exists (select 1 from public.roseone_follows f where f.follower_id = auth.uid() and f.following_id = s.author_id and f.status = 'accepted')))));
drop policy if exists story_reactions_self on public.roseone_story_reactions;
create policy story_reactions_self
on public.roseone_story_reactions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id and exists (select 1 from public.roseone_stories s where s.id = story_id and s.expires_at > now() and (s.author_id = auth.uid() or s.audience = 'everyone' or (s.audience = 'followers' and exists (select 1 from public.roseone_follows f where f.follower_id = auth.uid() and f.following_id = s.author_id and f.status = 'accepted')))));

-- Private and follower story comments obey the same visibility rule.
drop policy if exists story_comments_read on public.roseone_story_comments;
create policy story_comments_read
on public.roseone_story_comments
for select
using (exists (select 1 from public.roseone_stories s where s.id = story_id and s.expires_at > now() and (s.author_id = auth.uid() or s.audience = 'everyone' or (s.audience = 'followers' and exists (select 1 from public.roseone_follows f where f.follower_id = auth.uid() and f.following_id = s.author_id and f.status = 'accepted')))));
drop policy if exists story_comments_self on public.roseone_story_comments;
create policy story_comments_self
on public.roseone_story_comments
for insert
with check (auth.uid() = author_id and exists (select 1 from public.roseone_stories s where s.id = story_id and s.expires_at > now() and (s.author_id = auth.uid() or s.audience = 'everyone' or (s.audience = 'followers' and exists (select 1 from public.roseone_follows f where f.follower_id = auth.uid() and f.following_id = s.author_id and f.status = 'accepted')))));
