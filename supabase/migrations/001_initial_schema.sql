-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  subscription_status text check (subscription_status in ('free', 'paid')) default 'free',
  ai_usage_count integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  completed boolean default false,
  created_at timestamptz default now(),
  completed_at timestamptz,
  priority text check (priority in ('low', 'medium', 'high')),
  start_date timestamptz,
  end_date timestamptz
);

-- Enable RLS for projects
alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using ( auth.uid() = user_id );

create policy "Users can insert own projects"
  on public.projects for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own projects"
  on public.projects for update
  using ( auth.uid() = user_id );

create policy "Users can delete own projects"
  on public.projects for delete
  using ( auth.uid() = user_id );

-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS for tasks
alter table public.tasks enable row level security;

create policy "Users can view tasks of own projects"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects
      where public.projects.id = public.tasks.project_id
      and public.projects.user_id = auth.uid()
    )
  );

create policy "Users can insert tasks to own projects"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.projects
      where public.projects.id = public.tasks.project_id
      and public.projects.user_id = auth.uid()
    )
  );

create policy "Users can update tasks of own projects"
  on public.tasks for update
  using (
    exists (
      select 1 from public.projects
      where public.projects.id = public.tasks.project_id
      and public.projects.user_id = auth.uid()
    )
  );

create policy "Users can delete tasks of own projects"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.projects
      where public.projects.id = public.tasks.project_id
      and public.projects.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
