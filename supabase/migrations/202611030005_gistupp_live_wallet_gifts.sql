-- Gistupp Live monetization, creator earnings and persistent chat appearance.
-- Coin top-ups are intentionally disabled until the owner configures a payment provider.
alter table public.roseone_live_gifts
  add column if not exists recipient_id uuid references auth.users(id) on delete set null,
  add column if not exists unit_coins integer not null default 0,
  add column if not exists total_coins integer not null default 0,
  add column if not exists gift_name text,
  add column if not exists status text not null default 'delivered';

create table if not exists public.gistupp_gift_catalog (
  code text primary key,
  name text not null,
  coin_price integer not null check (coin_price > 0),
  tier text not null check (tier in ('Popular','Premium','Legendary')),
  artwork_path text not null,
  active boolean not null default true,
  sort_order integer not null default 0
);
insert into public.gistupp_gift_catalog(code,name,coin_price,tier,artwork_path,sort_order) values
('gist_coin','Gist Coin',10,'Popular','/gifts/gist-coin.svg',1),
('blue_diamond','Blue Diamond',80,'Popular','/gifts/blue-diamond.svg',2),
('silver_crest','Silver Crest',250,'Popular','/gifts/silver-crest.svg',3),
('gold_reserve','Gold Reserve',750,'Premium','/gifts/gold-reserve.svg',4),
('orbit_rocket','Orbit Rocket',1500,'Premium','/gifts/orbit-rocket.svg',5),
('velocity_car','Velocity Car',4000,'Premium','/gifts/velocity-car.svg',6),
('swift_bicycle','Swift Bicycle',2500,'Legendary','/gifts/swift-bicycle.svg',7),
('ocean_yacht','Ocean Yacht',8000,'Legendary','/gifts/ocean-yacht.svg',8),
('aurora_crown','Aurora Crown',15000,'Legendary','/gifts/aurora-crown.svg',9)
on conflict(code) do update set name=excluded.name,coin_price=excluded.coin_price,tier=excluded.tier,artwork_path=excluded.artwork_path,sort_order=excluded.sort_order;

create table if not exists public.gistupp_coin_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  lifetime_purchased bigint not null default 0 check (lifetime_purchased >= 0),
  lifetime_spent bigint not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.gistupp_coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('topup','gift_sent','gift_received','refund','adjustment')),
  amount bigint not null check (amount <> 0),
  reference_id uuid,
  description text not null,
  created_at timestamptz not null default now()
);
create index if not exists gistupp_coin_ledger_user_created_idx on public.gistupp_coin_ledger(user_id,created_at desc);
create table if not exists public.gistupp_creator_earnings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.roseone_live_sessions(id) on delete cascade,
  gift_id uuid references public.roseone_live_gifts(id) on delete set null,
  gross_coins bigint not null check (gross_coins > 0),
  status text not null default 'pending' check (status in ('pending','available','paid','reversed')),
  created_at timestamptz not null default now()
);
create index if not exists gistupp_creator_earnings_creator_idx on public.gistupp_creator_earnings(creator_id,created_at desc);
create table if not exists public.gistupp_live_chat_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'glass' check (theme in ('glass','midnight','rose','ocean','classic')),
  opacity integer not null default 80 check (opacity between 30 and 100),
  font_size text not null default 'normal' check (font_size in ('small','normal','large')),
  updated_at timestamptz not null default now()
);

alter table public.gistupp_gift_catalog enable row level security;
alter table public.gistupp_coin_wallets enable row level security;
alter table public.gistupp_coin_ledger enable row level security;
alter table public.gistupp_creator_earnings enable row level security;
alter table public.gistupp_live_chat_preferences enable row level security;
drop policy if exists "gift catalog readable by everyone" on public.gistupp_gift_catalog;
create policy "gift catalog readable by everyone" on public.gistupp_gift_catalog for select using (active);
drop policy if exists "members read own coin wallet" on public.gistupp_coin_wallets;
create policy "members read own coin wallet" on public.gistupp_coin_wallets for select using (user_id=auth.uid());
drop policy if exists "members read own coin ledger" on public.gistupp_coin_ledger;
create policy "members read own coin ledger" on public.gistupp_coin_ledger for select using (user_id=auth.uid());
drop policy if exists "creators read own earnings" on public.gistupp_creator_earnings;
create policy "creators read own earnings" on public.gistupp_creator_earnings for select using (creator_id=auth.uid());
drop policy if exists "members manage own live chat preferences" on public.gistupp_live_chat_preferences;
create policy "members manage own live chat preferences" on public.gistupp_live_chat_preferences for all using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.gistupp_send_live_gift(p_sender_id uuid,p_session_id uuid,p_gift_code text,p_quantity integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=p_sender_id; v_host uuid; v_wallet public.gistupp_coin_wallets; v_gift public.gistupp_gift_catalog; v_gift_id uuid; v_total bigint;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_quantity is null or p_quantity<1 or p_quantity>20 then raise exception 'invalid quantity'; end if;
  select host_id into v_host from public.roseone_live_sessions where id=p_session_id and status='live' for update;
  if v_host is null then raise exception 'live session unavailable'; end if;
  if v_host=v_user then raise exception 'creators cannot gift themselves'; end if;
  select * into v_gift from public.gistupp_gift_catalog where code=p_gift_code and active=true;
  if v_gift.code is null then raise exception 'gift unavailable'; end if;
  v_total:=v_gift.coin_price*p_quantity;
  insert into public.gistupp_coin_wallets(user_id,balance) values(v_user,0) on conflict(user_id) do nothing;
  select * into v_wallet from public.gistupp_coin_wallets where user_id=v_user for update;
  if v_wallet.balance<v_total then raise exception 'insufficient coin balance'; end if;
  update public.gistupp_coin_wallets set balance=balance-v_total,lifetime_spent=lifetime_spent+v_total,updated_at=now() where user_id=v_user;
  insert into public.roseone_live_gifts(session_id,sender_id,recipient_id,gift_code,gift_name,quantity,unit_coins,total_coins,status)
  values(p_session_id,v_user,v_host,v_gift.code,v_gift.name,p_quantity,v_gift.coin_price,v_total,'delivered') returning id into v_gift_id;
  insert into public.gistupp_coin_ledger(user_id,entry_type,amount,reference_id,description) values(v_user,'gift_sent',-v_total,v_gift_id,'Sent '||p_quantity||' × '||v_gift.name);
  insert into public.gistupp_creator_earnings(creator_id,sender_id,session_id,gift_id,gross_coins) values(v_host,v_user,p_session_id,v_gift_id,v_total);
  return jsonb_build_object('giftId',v_gift_id,'giftName',v_gift.name,'quantity',p_quantity,'coins',v_total,'remainingBalance',v_wallet.balance-v_total);
end; $$;
revoke all on function public.gistupp_send_live_gift(uuid,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.gistupp_send_live_gift(uuid,uuid,text,integer) to service_role;
