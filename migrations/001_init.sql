-- Таблица отделов (оргструктура, дерево)
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES departments(id),
  path text NOT NULL,
  name text NOT NULL,
  head_id uuid -- REFERENCES employees(id) добавим позже, после создания employees
);
CREATE INDEX idx_departments_path ON departments(path);

-- Таблица сотрудников
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_number integer NOT NULL UNIQUE,
  last_name text NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  position text NOT NULL,
  department_id uuid REFERENCES departments(id),
  manager_id uuid REFERENCES employees(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fired', 'vacation', 'sick_leave', 'maternity_leave', 'day_off')),
  email text,
  phone text,
  user_id uuid UNIQUE -- REFERENCES users(id) добавим позже
);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);

-- Добавляем внешний ключ head_id после создания employees
ALTER TABLE departments ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_id) REFERENCES employees(id);

-- Таблица пользователей (учётные записи)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'trainer', 'employee'))
);

-- Добавляем внешний ключ user_id после создания users
ALTER TABLE employees ADD CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id);

-- Таблица замещений
CREATE TABLE delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id uuid NOT NULL REFERENCES employees(id),
  delegate_id uuid NOT NULL REFERENCES employees(id),
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  created_by uuid NOT NULL REFERENCES employees(id),
  created_at timestamp DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- Таблица навыков и групп навыков (дерево)
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES skills(id),
  path text NOT NULL,
  is_group boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  description text,
  validity_period integer, -- дней, NULL = бессрочно
  document_required boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid NOT NULL REFERENCES employees(id)
);
CREATE INDEX idx_skills_path ON skills(path);

-- Справочник уровней владения
CREATE TABLE skill_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value integer NOT NULL UNIQUE CHECK (value BETWEEN 0 AND 4),
  name text NOT NULL
);

-- Предзаполняем уровни
INSERT INTO skill_levels (value, name) VALUES
  (0, 'Не назначен'),
  (1, 'Начальный'),
  (2, 'Базовый'),
  (3, 'Продвинутый'),
  (4, 'Эксперт');

-- Назначенные компетенции сотрудников
CREATE TABLE employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id),
  skill_id uuid NOT NULL REFERENCES skills(id),
  level_id uuid NOT NULL REFERENCES skill_levels(id),
  granted_by uuid NOT NULL REFERENCES employees(id),
  granted_date date NOT NULL DEFAULT now(),
  expiry_date date, -- локальный срок
  global_expiry_date date, -- глобальный срок (от навыка)
  document_ref text,
  UNIQUE (employee_id, skill_id)
);
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);

-- Правила напоминаний
CREATE TABLE notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES skills(id),
  days_before integer NOT NULL,
  notify_employee boolean DEFAULT true,
  notify_manager boolean DEFAULT true,
  notify_trainer boolean DEFAULT false
);

-- Уведомления
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES employees(id),
  employee_skill_id uuid NOT NULL REFERENCES employee_skills(id),
  type text NOT NULL CHECK (type IN ('expiring_soon', 'expired')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);