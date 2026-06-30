const express = require('express');
const { getAllEmployees } = require('./employees');
const { getActiveSkills, getMatrix, getEmployeeSkills, getSkillHistory, getSkillProofs } = require('./skills');
const { getAllDepartments, getAllEmployeesWithDept } = require('./departments');

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Матрица компетенций. Сервер работает.');
});

// Сотрудники
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await getAllEmployees();
    res.json(employees);
  } catch (error) {
    console.error('Ошибка получения сотрудников:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Навыки
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await getActiveSkills();
    res.json(skills);
  } catch (error) {
    console.error('Ошибка получения навыков:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Матрица компетенций для списка сотрудников
app.get('/api/matrix', async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    const matrix = await getMatrix(ids);
    res.json(matrix);
  } catch (error) {
    console.error('Ошибка получения матрицы:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Компетенции одного сотрудника
app.get('/api/employees/:id/skills', async (req, res) => {
  try {
    const skills = await getEmployeeSkills(req.params.id);
    res.json(skills);
  } catch (error) {
    console.error('Ошибка получения компетенций сотрудника:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// История изменений навыка сотрудника
app.get('/api/employees/:empId/skills/:skillId/history', async (req, res) => {
  try {
    const history = await getSkillHistory(req.params.empId, req.params.skillId);
    res.json(history);
  } catch (error) {
    console.error('Ошибка получения истории:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Пруфы (файлы подтверждения) навыка сотрудника
app.get('/api/employees/:empId/skills/:skillId/proofs', async (req, res) => {
  try {
    const proofs = await getSkillProofs(req.params.empId, req.params.skillId);
    res.json(proofs);
  } catch (error) {
    console.error('Ошибка получения пруфов:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Дерево отделов с сотрудниками
app.get('/api/departments/tree', async (req, res) => {
  try {
    const [departments, employees] = await Promise.all([
      getAllDepartments(),
      getAllEmployeesWithDept()
    ]);

    // Строим карту отделов
    const deptMap = {};
    for (const dept of departments) {
      deptMap[dept.id] = {
        id: dept.id,
        name: dept.name,
        headId: dept.head_id,
        employees: []
      };
    }

    // Распределяем сотрудников по отделам
    for (const emp of employees) {
      if (emp.department_id && deptMap[emp.department_id]) {
        deptMap[emp.department_id].employees.push(emp);
      }
    }

    // Строим вложенность
    const tree = [];
    for (const dept of departments) {
      const node = deptMap[dept.id];
      if (dept.parent_id && deptMap[dept.parent_id]) {
        if (!deptMap[dept.parent_id].children) {
          deptMap[dept.parent_id].children = [];
        }
        deptMap[dept.parent_id].children.push(node);
      } else {
        tree.push(node);
      }
    }

    res.json(tree);
  } catch (error) {
    console.error('Ошибка получения дерева отделов:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});