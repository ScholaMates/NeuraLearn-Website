# Schema Configuration

Run this SQL Editor (Supabase):

```bash
-- 1. Device IDs Table
create table public.device_ids (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  is_used boolean default false,
  used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Profiles Table (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  email text,
  password text, -- Note: Storing plain text passwords here.
  device_id text,
  nickname text,
  occupation text,
  about_me text,
  avatar_url text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Chats Table
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Messages Table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats on delete cascade not null,
  role text check (role in ('user', 'model')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on all tables
alter table public.device_ids enable row level security;
alter table public.profiles enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Policies

-- Device IDs: Public read (for validation), Service Role write
create policy "Device IDs are viewable by everyone" on device_ids for select using (true);

-- Profiles: Public read (or authenticated), User update own
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Chats: User can CRUD own chats
create policy "Users can view own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on chats for insert with check (auth.uid() = user_id);
create policy "Users can update own chats" on chats for update using (auth.uid() = user_id);
create policy "Users can delete own chats" on chats for delete using (auth.uid() = user_id);

-- Messages: User can CRUD messages in their chats
create policy "Users can view messages in own chats" on messages for select using (
  exists ( select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid() )
);
create policy "Users can insert messages in own chats" on messages for insert with check (
  exists ( select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid() )
);

-- Remove occupation column
alter table public.profiles drop column if exists occupation;

-- Add new personalization columns
alter table public.profiles add column if not exists tutor_mode text default 'socratic';
alter table public.profiles add column if not exists response_length text default 'concise';
alter table public.profiles add column if not exists academic_level text default 'undergraduate';
alter table public.profiles add column if not exists major text;

-- Device ID 
insert into device_ids (code) values 
  ('DEVICE-0'), -- Examples
  ('DEVICE-1'), 
  ('DEVICE-2')
on conflict (code) do nothing;
```
