-- VIXION PLAY: configuração do servidor
-- Cole tudo isto no SQL Editor do Supabase e toque em Run.
-- Pode rodar mais de uma vez sem problema.

-- ========== TABELAS ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_.]{3,20}$'),
  name text not null check (char_length(name) between 2 and 30),
  bio text not null default '' check (char_length(bio) <= 120),
  hue int not null default 180 check (hue between 0 and 360),
  avatar text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  kind text not null check (kind in ('video','short')),
  duration int not null default 0,
  video_path text not null,
  thumb_path text not null default '',
  views int not null default 0,
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists videos_kind_created on public.videos (kind, created_at desc);
create index if not exists videos_owner on public.videos (owner);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_created on public.posts (created_at desc);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  owner uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists comments_video on public.comments (video_id, created_at desc);

create table if not exists public.subs (
  follower uuid not null references public.profiles(id) on delete cascade,
  channel uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, channel),
  check (follower <> channel)
);

-- ========== CONTAGEM DE CURTIDAS E VIEWS ==========
create or replace function public.bump_likes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.videos set likes_count = likes_count + 1 where id = new.target;
    update public.posts  set likes_count = likes_count + 1 where id = new.target;
    return new;
  else
    update public.videos set likes_count = greatest(likes_count - 1, 0) where id = old.target;
    update public.posts  set likes_count = greatest(likes_count - 1, 0) where id = old.target;
    return old;
  end if;
end $$;

drop trigger if exists likes_bump on public.likes;
create trigger likes_bump after insert or delete on public.likes
  for each row execute function public.bump_likes();

create or replace function public.add_view(vid uuid) returns void
language sql security definer set search_path = public as $$
  update public.videos set views = views + 1 where id = vid;
$$;
grant execute on function public.add_view(uuid) to anon, authenticated;

-- ========== REGRAS DE SEGURANÇA (quem pode o quê) ==========
alter table public.profiles enable row level security;
alter table public.videos   enable row level security;
alter table public.posts    enable row level security;
alter table public.likes    enable row level security;
alter table public.comments enable row level security;
alter table public.subs     enable row level security;

drop policy if exists "perfis: todos veem" on public.profiles;
create policy "perfis: todos veem" on public.profiles for select using (true);
drop policy if exists "perfis: criar o proprio" on public.profiles;
create policy "perfis: criar o proprio" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "perfis: editar o proprio" on public.profiles;
create policy "perfis: editar o proprio" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "videos: todos veem" on public.videos;
create policy "videos: todos veem" on public.videos for select using (true);
drop policy if exists "videos: publicar o proprio" on public.videos;
create policy "videos: publicar o proprio" on public.videos for insert to authenticated with check (auth.uid() = owner);
drop policy if exists "videos: apagar o proprio" on public.videos;
create policy "videos: apagar o proprio" on public.videos for delete to authenticated using (auth.uid() = owner);

drop policy if exists "posts: todos veem" on public.posts;
create policy "posts: todos veem" on public.posts for select using (true);
drop policy if exists "posts: publicar o proprio" on public.posts;
create policy "posts: publicar o proprio" on public.posts for insert to authenticated with check (auth.uid() = owner);
drop policy if exists "posts: apagar o proprio" on public.posts;
create policy "posts: apagar o proprio" on public.posts for delete to authenticated using (auth.uid() = owner);

drop policy if exists "curtidas: todos veem" on public.likes;
create policy "curtidas: todos veem" on public.likes for select using (true);
drop policy if exists "curtidas: curtir" on public.likes;
create policy "curtidas: curtir" on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "curtidas: descurtir" on public.likes;
create policy "curtidas: descurtir" on public.likes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "comentarios: todos veem" on public.comments;
create policy "comentarios: todos veem" on public.comments for select using (true);
drop policy if exists "comentarios: comentar" on public.comments;
create policy "comentarios: comentar" on public.comments for insert to authenticated with check (auth.uid() = owner);
drop policy if exists "comentarios: apagar o proprio" on public.comments;
create policy "comentarios: apagar o proprio" on public.comments for delete to authenticated using (auth.uid() = owner);

drop policy if exists "inscricoes: todos veem" on public.subs;
create policy "inscricoes: todos veem" on public.subs for select using (true);
drop policy if exists "inscricoes: inscrever" on public.subs;
create policy "inscricoes: inscrever" on public.subs for insert to authenticated with check (auth.uid() = follower);
drop policy if exists "inscricoes: cancelar" on public.subs;
create policy "inscricoes: cancelar" on public.subs for delete to authenticated using (auth.uid() = follower);

-- ========== ARMAZENAMENTO DOS VÍDEOS (limite de 50 MB por arquivo) ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
  array['video/mp4','video/webm','video/quicktime','video/3gpp','video/x-matroska','video/x-m4v','image/jpeg'])
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media: leitura publica" on storage.objects;
create policy "media: leitura publica" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media: enviar na propria pasta" on storage.objects;
create policy "media: enviar na propria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "media: apagar da propria pasta" on storage.objects;
create policy "media: apagar da propria pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
