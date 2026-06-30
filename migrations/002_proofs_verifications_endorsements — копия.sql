-- Миграция 002: Пруфы, верификации, лайки
-- Дата: 28.06.2026

BEGIN;

-- 1. Пруфы (доказательства)
CREATE TABLE proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_skill_id uuid NOT NULL REFERENCES employee_skills(id) ON DELETE CASCADE,
  url text NOT NULL,
  description text,
  added_by uuid NOT NULL REFERENCES employees(id),
  added_at timestamp DEFAULT now()
);

CREATE INDEX idx_proofs_employee_skill ON proofs(employee_skill_id);

COMMENT ON TABLE proofs IS 'Доказательства (фото, видео, протоколы) для подтверждения навыка';
COMMENT ON COLUMN proofs.employee_skill_id IS 'Ссылка на назначенный навык сотрудника';
COMMENT ON COLUMN proofs.url IS 'Ссылка на файл с доказательством';
COMMENT ON COLUMN proofs.description IS 'Описание доказательства (что именно показано)';
COMMENT ON COLUMN proofs.added_by IS 'Кто загрузил пруф (Сотрудник, Руководитель или Ответственный за направление)';
COMMENT ON COLUMN proofs.added_at IS 'Дата и время загрузки';

-- 2. Верификации (история подтверждений)
CREATE TABLE verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_skill_id uuid NOT NULL REFERENCES employee_skills(id) ON DELETE CASCADE,
  verified_by uuid NOT NULL REFERENCES employees(id),
  verified_at timestamp DEFAULT now(),
  status varchar(10) NOT NULL CHECK (status IN ('confirmed', 'rejected', 'pending')),
  comment text,
  proof_ids uuid[]
);

CREATE INDEX idx_verifications_employee_skill ON verifications(employee_skill_id);
CREATE INDEX idx_verifications_verified_by ON verifications(verified_by);

COMMENT ON TABLE verifications IS 'История верификаций (подтверждений/отклонений) навыков';
COMMENT ON COLUMN verifications.employee_skill_id IS 'Ссылка на назначенный навык сотрудника';
COMMENT ON COLUMN verifications.verified_by IS 'Кто провёл верификацию (Руководитель или Ответственный за направление)';
COMMENT ON COLUMN verifications.verified_at IS 'Дата и время верификации';
COMMENT ON COLUMN verifications.status IS 'Статус: confirmed (подтверждено), rejected (отклонено), pending (ожидает)';
COMMENT ON COLUMN verifications.comment IS 'Комментарий верификатора (обязателен при отклонении)';
COMMENT ON COLUMN verifications.proof_ids IS 'Массив ID пруфов, использованных при верификации';

-- 3. Лайки / поддержка от равных
CREATE TABLE endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_skill_id uuid NOT NULL REFERENCES employee_skills(id) ON DELETE CASCADE,
  endorsed_by uuid NOT NULL REFERENCES employees(id),
  value varchar(10) NOT NULL CHECK (value IN ('confirm', 'dispute', 'revoked')),
  comment text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp,
  UNIQUE (employee_skill_id, endorsed_by)
);

CREATE INDEX idx_endorsements_employee_skill ON endorsements(employee_skill_id);
CREATE INDEX idx_endorsements_endorsed_by ON endorsements(endorsed_by);

COMMENT ON TABLE endorsements IS 'Лайки/дизлайки от равных и старших по уровню';
COMMENT ON COLUMN endorsements.employee_skill_id IS 'Ссылка на назначенный навык сотрудника';
COMMENT ON COLUMN endorsements.endorsed_by IS 'Кто поставил оценку (сотрудник с таким же навыком)';
COMMENT ON COLUMN endorsements.value IS 'Оценка: confirm (подтверждаю), dispute (оспариваю), revoked (отозвано)';
COMMENT ON COLUMN endorsements.comment IS 'Пояснение к оценке';
COMMENT ON COLUMN endorsements.created_at IS 'Дата и время первой оценки';
COMMENT ON COLUMN endorsements.updated_at IS 'Дата и время последнего изменения (отзыва)';

-- 4. Уточнения в employee_skills
ALTER TABLE employee_skills
  ADD COLUMN verified_by uuid REFERENCES employees(id),
  ADD COLUMN verified_at timestamp,
  ADD COLUMN visibility varchar(10) NOT NULL DEFAULT 'network' CHECK (visibility IN ('public', 'network', 'private'));

COMMENT ON COLUMN employee_skills.verified_by IS 'Кто верифицировал навык';
COMMENT ON COLUMN employee_skills.verified_at IS 'Дата верификации';
COMMENT ON COLUMN employee_skills.visibility IS 'Видимость: public (всем), network (внутри системы), private (только сотрудник и руководитель)';

-- 5. Типы навыков
ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS type varchar(10) NOT NULL DEFAULT 'skill' CHECK (type IN ('skill', 'permit', 'training')),
  ADD COLUMN IF NOT EXISTS has_levels boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN skills.type IS 'Тип: skill (умение), permit (допуск), training (обучение)';
COMMENT ON COLUMN skills.has_levels IS 'Применимы ли уровни 0-4 (true для skill, false для permit/training)';

COMMIT;